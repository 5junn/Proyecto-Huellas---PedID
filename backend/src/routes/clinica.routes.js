const express = require('express');
const router = express.Router();
const db = require('../db');
const { sanitizeText } = require('../utils/security');
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
    const [[petCount]] = await db.queryAsync('SELECT COUNT(*) AS total FROM mascotas');
    const [[consultCount]] = await db.queryAsync('SELECT COUNT(*) AS total FROM consultas_historial');
    const [[vaxExpiring]] = await db.queryAsync(
      "SELECT COUNT(*) AS total FROM carnet_vacunacion WHERE fecha_proximo_refuerzo <= DATE_ADD(CURDATE(), INTERVAL 15 DAY)"
    );
    const [[ownerCount]] = await db.queryAsync('SELECT COUNT(*) AS total FROM propietarios');
    const [speciesRows] = await db.queryAsync(
      'SELECT especie, COUNT(*) AS cantidad FROM mascotas GROUP BY especie'
    );

    res.json({
      totales: {
        mascotas: petCount.total,
        consultas: consultCount.total,
        vacunasPorVencer: vaxExpiring.total,
        propietarios: ownerCount.total,
      },
      especies: speciesRows,
    });
  } catch (err) {
    console.error('[Clinica Dashboard] Error:', err);
    res.status(500).json({ error: 'Error al cargar métricas clínicas' });
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
      time: new Date(c.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
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
         (id_mascota, id_veterinario, veterinario_nombre, motivo_consulta, temperatura, peso, diagnostico, tratamiento_receta, borrador_ia, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
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

/**
 * GET /api/clinica/vacunas
 * Lista carnet de vacunación con estado dinámico calculado desde la fecha de refuerzo.
 */
router.get('/vacunas', clinicalOnly, async (req, res) => {
  try {
    const [rows] = await db.queryAsync(
      `SELECT cv.*, m.nombre AS pet, m.codigo_qr, m.especie, p.id_propietario,
              p.nombres AS owner, p.telefono AS owner_phone, p.correo AS owner_email
       FROM carnet_vacunacion cv
       INNER JOIN mascotas m ON cv.id_mascota = m.id_mascota
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
       ORDER BY cv.fecha_proximo_refuerzo ASC, cv.id_vacunacion DESC`
    );

    const now = Date.now();
    const DAY_MS = 86400000;

    const formatted = rows.map((v) => {
      const dueDate = new Date(v.fecha_proximo_refuerzo);
      const diffDays = Math.ceil((dueDate.getTime() - now) / DAY_MS);
      let computedStatus = 'al-dia';
      if (diffDays < 0) computedStatus = 'vencida';
      else if (diffDays <= 15) computedStatus = 'por-vencer';

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
        applied: new Date(v.fecha_aplicacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
        expire: dueDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
        fecha_proximo_refuerzo: v.fecha_proximo_refuerzo,
        dias_restantes: diffDays,
        status: computedStatus,
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
    const vacuna = sanitizeText(body.vaccine || body.vacuna, 120);
    const lote = sanitizeText(body.lote || body.lote_fabricante, 60);
    const vetName = req.user.nombres;
    const diasRefuerzo = Number(body.dias_refuerzo ?? 365);
    if (!vacuna || !lote || !Number.isInteger(diasRefuerzo) || diasRefuerzo < 1 || diasRefuerzo > 3650) {
      return res.status(400).json({ error: 'Ingresa una vacuna, el lote aplicado y un plazo de refuerzo válido.' });
    }

    const fechaAplicacion = body.fecha_aplicacion || new Date().toISOString().slice(0, 10);
    const fechaRefuerzo = body.fecha_proximo_refuerzo ||
      new Date(new Date(fechaAplicacion).getTime() + diasRefuerzo * 86400000).toJSON()?.slice(0, 10);
    const fechasValidas = [fechaAplicacion, fechaRefuerzo].every((fecha) =>
      typeof fecha === 'string' && new Date(fecha).toJSON()?.slice(0, 10) === fecha
    );
    if (!fechasValidas || fechaRefuerzo <= fechaAplicacion) {
      return res.status(400).json({ error: 'La fecha de refuerzo debe ser posterior a la aplicación.' });
    }

    const pet = await resolvePetRow({
      id_mascota: body.id_mascota,
      codigo_qr: body.codigo_qr,
      petName: body.pet || body.mascota_nombre,
    });

    if (!pet) {
      return res.status(404).json({
        error: 'No se encontró la mascota en la base de datos. Regístrala primero.',
      });
    }

    const dueDateObj = new Date(fechaRefuerzo);
    const diffDays = Math.ceil((dueDateObj.getTime() - Date.now()) / 86400000);
    const estadoDosis = diffDays < 0 ? 'vencida' : diffDays <= 15 ? 'por-vencer' : 'al-dia';

    const [ins] = await db.queryAsync(
      `INSERT INTO carnet_vacunacion
       (id_mascota, id_veterinario, veterinario_nombre, vacuna, lote_fabricante, fecha_aplicacion, fecha_proximo_refuerzo, estado_dosis, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pet.id_mascota, req.user.id, vetName, vacuna, lote, fechaAplicacion, fechaRefuerzo, estadoDosis, sanitizeText(body.observaciones || '', 255) || null]
    );

    const idVacunacion = ins.insertId;
    let reminderCreated = null;

    // Lógica de negocio: generar y guardar automáticamente el recordatorio para 3 días antes del refuerzo
    try {
      if (!pet.propietario_telefono && !pet.propietario_correo) throw new Error('El propietario no tiene contacto registrado.');
      const reminderDate = new Date(dueDateObj.getTime() - 3 * 86400000);
      const scheduledAt = reminderDate.getTime() > Date.now() ? reminderDate : new Date();
      const dueStr = dueDateObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
      const aiDraft = await generateSmartReminder({
        petName: pet.nombre,
        species: pet.especie,
        breed: pet.raza,
        ownerName: pet.propietario_nombre,
        vaccineName: vacuna,
        dueDate: dueStr,
        daysRemaining: diffDays,
        allergies: pet.alergias,
        channel: body.canal_recordatorio || 'WhatsApp',
      });

      const [remIns] = await db.queryAsync(
        `INSERT INTO recordatorios
         (id_mascota, id_propietario, id_vacunacion, canal, asunto, mensaje, telefono_destino, correo_destino, fecha_programada, estado, generado_por_ia)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Programado', 1)`,
        [
          pet.id_mascota,
          pet.id_propietario,
          idVacunacion,
          aiDraft.canal,
          aiDraft.asunto,
          aiDraft.mensaje,
          pet.propietario_telefono || '',
          pet.propietario_correo || null,
          scheduledAt,
        ]
      );
      reminderCreated = { id_recordatorio: remIns.insertId, fecha_programada: scheduledAt };
    } catch (remErr) {
      console.warn('[Vacuna POST] Recordatorio no generado:', remErr.message);
    }

    res.status(201).json({
      success: true,
      id: `V-${idVacunacion}`,
      id_vacunacion: idVacunacion,
      id_mascota: pet.id_mascota,
      pet: pet.nombre,
      owner: pet.propietario_nombre,
      vaccine: vacuna,
      lote,
      applied: new Date(fechaAplicacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
      expire: dueDateObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: estadoDosis,
      vet: vetName,
      recordatorio_programado: reminderCreated,
    });
  } catch (err) {
    console.error('[Clinica Vacunas POST] Error:', err);
    res.status(500).json({ error: 'Error al registrar vacuna en el carnet' });
  }
});

module.exports = router;
