const express = require('express');
const router = express.Router();
const db = require('../db');
const { sanitizeText } = require('../utils/security');
const { loadDashboard } = require('../services/dashboardService');
const { DAY_MS, clinicToday, daysBetween, validDay, vaccineStatus, displayDate } = require('../utils/clinicDates');
const { generateSmartReminder } = require('../services/aiService');
const { STAFF_ROLES, CLINICAL_ROLES, requireSession, allowRoles } = require('../utils/session');

router.use(requireSession);
const clinicalOnly = allowRoles(CLINICAL_ROLES);

async function resolvePetRow({ id_mascota, codigo_qr, petName }) {
  let clause = 'm.nombre = ?';
  let value = sanitizeText(petName, 80);
  if (id_mascota) {
    clause = 'm.id_mascota = ?';
    value = Number(id_mascota);
    if (!Number.isSafeInteger(value) || value < 1) return null;
  } else if (codigo_qr) {
    clause = 'm.codigo_qr = ?';
    value = sanitizeText(codigo_qr, 50);
  }
  const [rows] = await db.queryAsync(
    `SELECT m.*, p.nombres AS propietario_nombre, p.telefono AS propietario_telefono, p.correo AS propietario_correo
     FROM mascotas m INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
     WHERE ${clause} LIMIT 2`,
    [value]
  );
  return rows.length === 1 ? rows[0] : null;
}

/**
 * GET /api/clinica/dashboard
 * Resumen operativo en tiempo real desde MySQL.
 */
router.get('/dashboard', allowRoles(STAFF_ROLES), async (req, res) => {
  try {
    res.json(await loadDashboard(CLINICAL_ROLES.includes(req.user.rol)));
  } catch (err) {
    console.error('[Dashboard MySQL]', err.code || err.name, err.sqlMessage || err.message);
    const unavailable = ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR'].includes(err.code);
    res.status(unavailable ? 503 : 500).json({
      error: unavailable
        ? 'MySQL no está disponible. Revisa que esté iniciado y que backend/.env apunte a la base de la clínica.'
        : 'No se pudieron consultar los indicadores en MySQL. Revisa el mensaje [Dashboard MySQL] en la terminal del backend.',
    });
  }
});

/**
 * GET /api/clinica/consultas
 * Lista consultas médicas desde MySQL.
 */
router.get('/consultas', clinicalOnly, async (req, res) => {
  try {
    const [rows] = await db.queryAsync(
      `SELECT c.*, m.nombre AS pet, COALESCE(r.nombre_raza, m.raza, m.especie) AS breed,
              m.codigo_qr, p.nombres AS owner, p.telefono AS owner_phone
       FROM consultas_historial c
       INNER JOIN mascotas m ON c.id_mascota = m.id_mascota
       LEFT JOIN razas r ON m.id_raza = r.id_raza
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
       ORDER BY c.fecha_hora DESC, c.id_consulta DESC`
    );

    const formatted = rows.map((c) => ({
      id: `C-${c.id_consulta}`,
      id_consulta: c.id_consulta,
      id_mascota: c.id_mascota,
      codigo_qr: c.codigo_qr,
      pet: c.pet,
      breed: c.breed,
      owner: c.owner,
      reason: c.motivo_consulta,
      diagnostico: c.diagnostico,
      tratamiento_receta: c.tratamiento_receta,
      borrador_ia: c.borrador_ia,
      peso: c.peso,
      temperatura: c.temperatura,
      vet: c.veterinario_nombre || 'Sin profesional registrado',
      time: c.fecha_hora ? new Date(c.fecha_hora).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }) : null,
      fecha_hora: c.fecha_hora,
      status: c.estado,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[Clinica Consultas GET] Error:', err);
    res.status(500).json({ error: 'Error al consultar historial clínico' });
  }
});

/**
 * POST /api/clinica/consultas
 * Guarda una nueva consulta médica en MySQL y actualiza el peso si se proporciona.
 */
router.post('/consultas', clinicalOnly, async (req, res) => {
  try {
    const body = req.body || {};
    const reason = sanitizeText(body.reason || body.motivo_consulta, 255);
    const diagnostico = sanitizeText(body.diagnostico || 'Atención clínica registrada.', 2000);
    const tratamiento = sanitizeText(body.tratamiento_receta || '', 2000);
    const borradorIA = sanitizeText(body.borrador_ia || '', 3000);
    const vetName = req.user.nombres;
    const estado = ['waiting', 'progress', 'done'].includes(body.status || body.estado)
      ? body.status || body.estado
      : 'progress';
    const peso = body.peso == null || body.peso === '' ? null : Number(body.peso);
    const temperatura = body.temperatura == null || body.temperatura === '' ? null : Number(body.temperatura);

    if ((peso !== null && (!Number.isFinite(peso) || peso <= 0 || peso > 999.99)) ||
        (temperatura !== null && (!Number.isFinite(temperatura) || temperatura <= 0 || temperatura > 99.99))) {
      return res.status(400).json({ error: 'Revisa el peso y la temperatura de la consulta.' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'El motivo de consulta es obligatorio.' });
    }

    const pet = await resolvePetRow({
      id_mascota: body.id_mascota,
      codigo_qr: body.codigo_qr,
      petName: body.pet || body.mascota_nombre,
    });

    if (!pet) {
      return res.status(404).json({
        error: 'No se encontró la mascota en la base de datos. Regístrala primero o selecciona una existente.',
      });
    }

    const idConsulta = await db.withTransaction(async (conn) => {
      const [ins] = await conn.query(
        `INSERT INTO consultas_historial
         (id_mascota, id_veterinario, veterinario_nombre, motivo_consulta, temperatura, peso, diagnostico, tratamiento_receta, borrador_ia, estado, fecha_hora)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [pet.id_mascota, req.user.id, vetName, reason, temperatura, peso, diagnostico, tratamiento || null, borradorIA || null, estado]
      );
      if (peso !== null) {
        await conn.query('UPDATE mascotas SET peso_actual = ? WHERE id_mascota = ?', [peso, pet.id_mascota]);
        await conn.query(
          "INSERT INTO registro_pesos (id_mascota, peso_kg, origen) VALUES (?, ?, 'consulta')",
          [pet.id_mascota, peso]
        );
      }
      return ins.insertId;
    });

    res.status(201).json({
      success: true,
      id: `C-${idConsulta}`,
      id_consulta: idConsulta,
      id_mascota: pet.id_mascota,
      pet: pet.nombre,
      breed: pet.raza || pet.especie,
      owner: pet.propietario_nombre,
      reason,
      diagnostico,
      tratamiento_receta: tratamiento,
      vet: vetName,
      time: new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }),
      status: estado,
    });
  } catch (err) {
    console.error('[Clinica Consultas POST] Error:', err);
    res.status(500).json({ error: 'Error al guardar la consulta médica' });
  }
});

/**
 * PATCH /api/clinica/consultas/:id/estado
 */
router.patch('/consultas/:id/estado', clinicalOnly, async (req, res) => {
  try {
    const rawId = String(req.params.id).replace(/^C-/i, '');
    const id = Number(rawId);
    const status = req.body?.status || req.body?.estado;
    if (!Number.isSafeInteger(id) || id < 1 || !['waiting', 'progress', 'done'].includes(status)) {
      return res.status(400).json({ error: 'ID o estado inválido.' });
    }
    const [result] = await db.queryAsync('UPDATE consultas_historial SET estado = ? WHERE id_consulta = ?', [status, id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Consulta no encontrada.' });
    res.json({ success: true, id_consulta: id, status });
  } catch (err) {
    console.error('[Clinica Consultas PATCH] Error:', err);
    res.status(500).json({ error: 'Error al actualizar estado de consulta' });
  }
});

router.get('/lotes-vacunas', clinicalOnly, async (req, res) => {
  try {
    const [rows] = await db.queryAsync(
      `SELECT id_lote, vacuna, lote_fabricante, DATE_FORMAT(fecha_vencimiento, '%Y-%m-%d') AS fecha_vencimiento,
              dosis_iniciales, dosis_disponibles
       FROM lotes_vacunas ORDER BY fecha_vencimiento, id_lote`
    );
    res.json(rows);
  } catch (err) {
    console.error('[Lotes GET]', err.code || err.name);
    res.status(500).json({ error: 'Error al consultar los lotes de vacunas.' });
  }
});

router.post('/lotes-vacunas', clinicalOnly, async (req, res) => {
  try {
    const vacuna = sanitizeText(req.body?.vacuna, 120);
    const lote = sanitizeText(req.body?.lote_fabricante, 60);
    const vencimiento = req.body?.fecha_vencimiento;
    const dosis = Number(req.body?.dosis_iniciales);
    if (!vacuna || !lote || !validDay(vencimiento) || vencimiento < clinicToday() ||
        !Number.isSafeInteger(dosis) || dosis < 1 || dosis > 1000000) {
      return res.status(400).json({ error: 'Ingresa la vacuna, el lote, una fecha de vencimiento vigente y una cantidad válida.' });
    }
    const [result] = await db.queryAsync(
      `INSERT INTO lotes_vacunas (vacuna, lote_fabricante, fecha_vencimiento, dosis_iniciales, dosis_disponibles)
       VALUES (?, ?, ?, ?, ?)`,
      [vacuna, lote, vencimiento, dosis, dosis]
    );
    res.status(201).json({ id_lote: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe ese número de lote para esta vacuna.' });
    }
    console.error('[Lotes POST]', err.code || err.name);
    res.status(500).json({ error: 'Error al guardar el lote de vacunas.' });
  }
});

/**
 * GET /api/clinica/vacunas
 * Lista carnet de vacunación con estado dinámico calculado desde la fecha de refuerzo.
 */
router.get('/vacunas', clinicalOnly, async (req, res) => {
  try {
    const [rows] = await db.queryAsync(
      `SELECT cv.*, m.nombre AS pet, m.codigo_qr, m.especie, p.id_propietario,
              DATE_FORMAT(cv.fecha_aplicacion, '%Y-%m-%d') AS aplicada_el,
              DATE_FORMAT(cv.fecha_proximo_refuerzo, '%Y-%m-%d') AS refuerzo_el,
              p.nombres AS owner, p.telefono AS owner_phone, p.correo AS owner_email
       FROM carnet_vacunacion cv
       INNER JOIN mascotas m ON cv.id_mascota = m.id_mascota
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
       ORDER BY cv.fecha_proximo_refuerzo ASC, cv.id_vacunacion DESC`
    );

    const today = clinicToday();
    const formatted = rows.map((v) => {
      const diffDays = validDay(v.refuerzo_el) ? daysBetween(today, v.refuerzo_el) : null;

      return {
        id: `V-${v.id_vacunacion}`,
        id_vacunacion: v.id_vacunacion,
        id_mascota: v.id_mascota,
        id_propietario: v.id_propietario,
        codigo_qr: v.codigo_qr,
        pet: v.pet,
        especie: v.especie,
        owner: v.owner,
        ownerPhone: v.owner_phone,
        ownerEmail: v.owner_email,
        vaccine: v.vacuna,
        lote: v.lote_fabricante,
        id_lote: v.id_lote,
        applied: validDay(v.aplicada_el) ? displayDate.format(new Date(v.aplicada_el)) : null,
        expire: diffDays === null ? null : displayDate.format(new Date(v.refuerzo_el)),
        fecha_proximo_refuerzo: v.refuerzo_el,
        dias_restantes: diffDays,
        status: diffDays === null ? null : vaccineStatus(diffDays),
        vet: v.veterinario_nombre || 'Sin profesional registrado',
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('[Clinica Vacunas GET] Error:', err);
    res.status(500).json({ error: 'Error al consultar carnet de vacunación' });
  }
});

/**
 * POST /api/clinica/vacunas
 * Aplica vacuna en MySQL y programa automáticamente el recordatorio inteligente en `recordatorios`.
 */
router.post('/vacunas', clinicalOnly, async (req, res) => {
  try {
    const body = req.body || {};
    const batchId = Number(body.id_lote ?? 0);
    const vaccineName = sanitizeText(body.vaccine || body.vacuna, 120);
    const batchNumber = sanitizeText(body.lote || body.lote_fabricante, 60);
    if (body.id_lote != null ? (!Number.isSafeInteger(batchId) || batchId < 1) : (!vaccineName || !batchNumber)) {
      return res.status(400).json({ error: 'Selecciona un lote registrado para aplicar la vacuna.' });
    }

    const today = clinicToday();
    const fechaAplicacion = body.fecha_aplicacion ?? today;
    const diasRefuerzo = Number(body.dias_refuerzo ?? 365);
    if (!validDay(fechaAplicacion) || fechaAplicacion > today) {
      return res.status(400).json({ error: 'La fecha de aplicación debe ser válida y no puede estar en el futuro.' });
    }
    if (!body.fecha_proximo_refuerzo && (!Number.isInteger(diasRefuerzo) || diasRefuerzo < 1 || diasRefuerzo > 3650)) {
      return res.status(400).json({ error: 'Ingresa un plazo de refuerzo válido.' });
    }

    const fechaRefuerzo = body.fecha_proximo_refuerzo ||
      new Date(Date.parse(fechaAplicacion) + diasRefuerzo * DAY_MS).toISOString().slice(0, 10);
    if (!validDay(fechaRefuerzo) || fechaRefuerzo <= fechaAplicacion) {
      return res.status(400).json({ error: 'La fecha de refuerzo debe ser posterior a la aplicación.' });
    }

    const pet = await resolvePetRow({
      id_mascota: body.id_mascota,
      codigo_qr: body.codigo_qr,
      petName: body.pet || body.mascota_nombre,
    });
    if (!pet) return res.status(404).json({ error: 'Selecciona una mascota registrada.' });

    const [filter, values] = batchId
      ? ['id_lote = ?', [batchId]]
      : ['vacuna = ? AND lote_fabricante = ?', [vaccineName, batchNumber]];
    const [[batch]] = await db.queryAsync(
      `SELECT id_lote, vacuna, lote_fabricante, dosis_disponibles,
              DATE_FORMAT(fecha_vencimiento, '%Y-%m-%d') AS vence_el
       FROM lotes_vacunas WHERE ${filter}`, values
    );
    if (!batch) return res.status(404).json({ error: 'Registra el lote en el inventario antes de aplicar una dosis.' });
    if (batch.vence_el < fechaAplicacion || batch.dosis_disponibles < 1) {
      return res.status(409).json({ error: 'El lote está vencido para esa fecha o ya no tiene dosis disponibles.' });
    }

    const diffDays = daysBetween(today, fechaRefuerzo);
    const channel = body.canal_recordatorio || (pet.propietario_telefono ? 'WhatsApp' : 'Correo');
    if (!['WhatsApp', 'SMS', 'Correo'].includes(channel)) {
      return res.status(400).json({ error: 'Selecciona un canal de recordatorio válido.' });
    }
    const hasContact = channel === 'Correo' ? pet.propietario_correo : pet.propietario_telefono;
    const refuerzo = new Date(fechaRefuerzo);
    const reminder = diffDays >= 0 && hasContact ? await generateSmartReminder({
      petName: pet.nombre,
      species: pet.especie,
      breed: pet.raza,
      ownerName: pet.propietario_nombre,
      vaccineName: batch.vacuna,
      dueDate: displayDate.format(refuerzo),
      daysRemaining: diffDays,
      allergies: pet.alergias,
      channel,
    }) : null;

    const result = await db.withTransaction(async (conn) => {
      const [stock] = await conn.query(
        `UPDATE lotes_vacunas SET dosis_disponibles = dosis_disponibles - 1
         WHERE id_lote = ? AND dosis_disponibles > 0 AND fecha_vencimiento >= ?`,
        [batch.id_lote, fechaAplicacion]
      );
      if (!stock.affectedRows) return null;

      const [ins] = await conn.query(
        `INSERT INTO carnet_vacunacion
         (id_mascota, id_veterinario, veterinario_nombre, vacuna, lote_fabricante, id_lote,
          fecha_aplicacion, fecha_proximo_refuerzo, estado_dosis, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pet.id_mascota, req.user.id, req.user.nombres, batch.vacuna, batch.lote_fabricante, batch.id_lote,
          fechaAplicacion, fechaRefuerzo, vaccineStatus(diffDays), sanitizeText(body.observaciones, 255) || null]
      );
      let recordatorio = null;
      if (reminder) {
        const scheduledAt = new Date(Math.max(Date.now(), refuerzo.getTime() - 3 * DAY_MS + 14 * 3600000));
        const [remIns] = await conn.query(
          `INSERT INTO recordatorios
           (id_mascota, id_propietario, id_vacunacion, canal, asunto, mensaje, telefono_destino,
            correo_destino, fecha_programada, generado_por_ia)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [pet.id_mascota, pet.id_propietario, ins.insertId, channel, sanitizeText(reminder.asunto, 150), reminder.mensaje,
            pet.propietario_telefono || '', pet.propietario_correo || null, scheduledAt, Number(Boolean(reminder.external))]
        );
        recordatorio = { id_recordatorio: remIns.insertId, fecha_programada: scheduledAt };
      }
      return { id: ins.insertId, recordatorio };
    });
    if (!result) return res.status(409).json({ error: 'Ese lote ya no tiene dosis disponibles.' });

    res.status(201).json({
      success: true,
      id: `V-${result.id}`,
      id_vacunacion: result.id,
      id_mascota: pet.id_mascota,
      id_lote: batch.id_lote,
      pet: pet.nombre,
      owner: pet.propietario_nombre,
      vaccine: batch.vacuna,
      lote: batch.lote_fabricante,
      applied: displayDate.format(new Date(fechaAplicacion)),
      expire: displayDate.format(refuerzo),
      status: vaccineStatus(diffDays),
      vet: req.user.nombres,
      recordatorio_programado: result.recordatorio,
    });
  } catch (err) {
    console.error('[Clinica Vacunas POST]', err.code || err.name);
    res.status(500).json({ error: 'Error al registrar vacuna en el carnet' });
  }
});

module.exports = router;
