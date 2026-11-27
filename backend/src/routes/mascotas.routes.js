const { randomBytes } = require('node:crypto');
const express = require('express');
const router = express.Router();
const db = require('../db');
const { sanitizeText } = require('../utils/security');
const { sendLostPetAlert } = require('../services/messagingService');
const { STAFF_ROLES, OWNER_ROLES, RECEPTION_ROLES, requireSession, allowRoles } = require('../utils/session');

const petAccess = [requireSession, allowRoles([...STAFF_ROLES, ...OWNER_ROLES])];
const ownerScope = (user) => OWNER_ROLES.includes(user.rol) ? user.id_propietario : null;

function mapSpeciesToDb(especie) {
  const s = String(especie || '').toLowerCase();
  if (s.includes('fel') || s.includes('gato')) return 'Felino';
  if (s.includes('conejo')) return 'Conejo';
  if (s.includes('ave')) return 'Ave';
  if (s.includes('otro')) return 'Otro';
  return 'Canino';
}

function parseWeightKg(peso) {
  if (peso === null || peso === undefined || peso === '') return null;
  const num = Number(String(peso).trim().replace(/ kg$/i, '').replace(',', '.'));
  return Number.isFinite(num) && num > 0 && num <= 999.99 ? num : null;
}

/**
 * 1. GET /api/mascotas
 * Obtiene todas las mascotas con su propietario, raza y vacunas del carnet.
 */
router.get('/', petAccess, async (req, res) => {
  try {
    const correoFilter = sanitizeText(req.query.correo, 120).toLowerCase();
    const especieFilter = sanitizeText(req.query.especie, 40);
    const propIdFilter = ownerScope(req.user) || (Number(req.query.propietarioId) || null);

    let sql = `
      SELECT
        m.*,
        COALESCE(r.nombre_raza, m.raza, 'Mestizo') AS raza_nombre,
        p.nombres AS propietario_nombre,
        p.telefono AS propietario_telefono,
        p.correo AS propietario_correo,
        p.direccion AS propietario_direccion
      FROM mascotas m
      LEFT JOIN razas r ON m.id_raza = r.id_raza
      LEFT JOIN propietarios p ON m.id_propietario = p.id_propietario
      WHERE 1=1
    `;
    const params = [];

    if (correoFilter) {
      sql += ' AND LOWER(p.correo) = ?';
      params.push(correoFilter);
    }
    if (propIdFilter) {
      sql += ' AND m.id_propietario = ?';
      params.push(propIdFilter);
    }
    if (especieFilter && especieFilter !== 'all') {
      sql += ' AND m.especie = ?';
      params.push(mapSpeciesToDb(especieFilter));
    }

    sql += ' ORDER BY m.id_mascota DESC';

    const [mascotas] = await db.queryAsync(sql, params);
    const [vacunas] = mascotas.length
      ? await db.queryAsync(
        'SELECT * FROM carnet_vacunacion WHERE id_mascota IN (?) ORDER BY fecha_aplicacion DESC, id_vacunacion DESC',
        [mascotas.map((m) => m.id_mascota)]
      )
      : [[]];

    const vacunasByPet = new Map();
    for (const v of vacunas) {
      if (!vacunasByPet.has(v.id_mascota)) vacunasByPet.set(v.id_mascota, []);
      vacunasByPet.get(v.id_mascota).push({
        id_vacunacion: v.id_vacunacion,
        nombre: v.vacuna,
        lote: v.lote_fabricante,
        fecha: v.fecha_aplicacion
          ? new Date(v.fecha_aplicacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Registrada',
        proxima: v.fecha_proximo_refuerzo
          ? new Date(v.fecha_proximo_refuerzo).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Anual',
        fecha_proximo_refuerzo: v.fecha_proximo_refuerzo,
        estado: v.estado_dosis === 'por-vencer' ? 'Por Vencer' : v.estado_dosis === 'vencida' ? 'Vencida' : 'Vigente',
        estado_dosis: v.estado_dosis,
        vet: v.veterinario_nombre || 'Equipo Clínica Huellas',
      });
    }

    const enriched = mascotas.map((m) => ({
      ...m,
      id: m.codigo_qr || `hp-${m.id_mascota}`,
      codigoQR: m.codigo_qr,
      raza: m.raza_nombre || m.raza,
      peso: m.peso_actual ? `${m.peso_actual} kg` : 'N/A',
      foto: m.foto_url,
      propietario: m.propietario_nombre,
      telefono: m.propietario_telefono,
      correo: m.propietario_correo,
      direccion: m.propietario_direccion,
      estadoExtravio: Boolean(m.modo_extraviado),
      chip: m.microchip,
      vacunas: vacunasByPet.get(m.id_mascota) || [],
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Error al consultar mascotas:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

/**
 * 2. GET /api/mascotas/alertas-gps
 * Lista las alertas de rescate GPS almacenadas en MySQL.
 */
router.get('/alertas-gps', petAccess, async (req, res) => {
  try {
    const ownerId = ownerScope(req.user);
    const [rows] = await db.queryAsync(
      `SELECT a.*, m.nombre AS nombreMascota, m.especie, m.raza, p.nombres AS propietario, p.telefono
       FROM alertas_rescate_gps a
       INNER JOIN mascotas m ON a.id_mascota = m.id_mascota
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
       WHERE a.estado = 'activa'${ownerId ? ' AND m.id_propietario = ?' : ''}
       ORDER BY a.id_alerta DESC`,
      ownerId ? [ownerId] : []
    );

    const formatted = rows.map((r) => ({
      id: r.id_alerta,
      id_alerta: r.id_alerta,
      id_mascota: r.id_mascota,
      codigoMascota: r.codigo_qr,
      nombreMascota: r.nombreMascota,
      especie: r.especie,
      raza: r.raza,
      propietario: r.propietario,
      telefono: r.telefono,
      lat: Number(r.latitud),
      lng: Number(r.longitud),
      precision: `${r.precision_metros || 15} metros`,
      mapsUrl: r.maps_url,
      mensaje_rescatista: r.mensaje_rescatista,
      fechaCompleta: new Date(r.creado_en).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      estado: r.estado,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error obteniendo alertas GPS:', err);
    res.status(500).json({ error: 'Error al obtener alertas GPS' });
  }
});

/**
 * 3. PATCH /api/mascotas/alertas-gps/:id/resolver
 */
router.patch('/alertas-gps/:id/resolver', petAccess, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'ID de alerta inválido' });
    const ownerId = ownerScope(req.user);
    const [result] = await db.queryAsync(
      `UPDATE alertas_rescate_gps a JOIN mascotas m ON a.id_mascota = m.id_mascota
       SET a.estado = 'resuelta' WHERE a.id_alerta = ?${ownerId ? ' AND m.id_propietario = ?' : ''}`,
      ownerId ? [id, ownerId] : [id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Alerta no encontrada.' });
    res.json({ success: true, id_alerta: id, estado: 'resuelta' });
  } catch (err) {
    console.error('Error resolviendo alerta GPS:', err);
    res.status(500).json({ error: 'Error al resolver alerta GPS' });
  }
});

/**
 * 4. GET /api/mascotas/:codigo
 * Ficha pública QR respetando Ley N° 29733 (privacidad del dueño en modo habitual vs modo mascota perdida).
 */
router.get('/:codigo', async (req, res) => {
  try {
    const codigo = sanitizeText(req.params.codigo, 50).toUpperCase();
    const [rows] = await db.queryAsync(
      `SELECT m.*,
        COALESCE(r.nombre_raza, m.raza, 'Mestizo') AS raza_nombre,
        p.nombres AS propietario_nombre,
        p.telefono AS propietario_telefono,
        p.direccion AS propietario_direccion
       FROM mascotas m
       LEFT JOIN razas r ON m.id_raza = r.id_raza
       LEFT JOIN propietarios p ON m.id_propietario = p.id_propietario
       WHERE m.codigo_qr = ?
       LIMIT 1`,
      [codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const m = rows[0];
    const [vacunas] = await db.queryAsync(
      'SELECT * FROM carnet_vacunacion WHERE id_mascota = ? ORDER BY fecha_aplicacion DESC',
      [m.id_mascota]
    );

    const isLost = Boolean(m.modo_extraviado);
    const fullAddress = m.propietario_direccion || 'Lima, Perú';
    const districtOnly = fullAddress.includes(',') ? fullAddress.split(',').slice(-1)[0].trim() : null;

    res.json({
      codigo: m.codigo_qr,
      codigoQR: m.codigo_qr,
      nombre: m.nombre,
      especie: m.especie,
      raza: m.raza_nombre,
      edad: m.edad || 'Adulto',
      sexo: m.sexo,
      peso: m.peso_actual ? `${m.peso_actual} kg` : 'N/A',
      color: m.color || 'No especificado',
      foto: m.foto_url,
      alergias: m.alergias || 'Sin alergias médicas reportadas.',
      estadoExtravio: isLost,
      recompensa: isLost ? m.recompensa : null,
      // Privacidad Ley N° 29733: solo exponer teléfono de contacto directo si está en Modo Mascota Perdida
      propietario: isLost ? m.propietario_nombre : null,
      telefono: isLost ? m.propietario_telefono : null,
      distrito: isLost ? districtOnly : null,
      clinica: process.env.CLINIC_NAME || 'Clínica Veterinaria Huellas',
      dirClinica: process.env.CLINIC_ADDRESS || 'Av. Primavera 1234, Santiago de Surco, Lima',
      telClinica: process.env.CLINIC_PHONE || '+51 987 654 321',
      horarioClinica: 'Lunes a Domingo · Emergencias 24/7',
      vacunas: vacunas.map((v) => ({
        nombre: v.vacuna,
        fecha: new Date(v.fecha_aplicacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
        proxima: new Date(v.fecha_proximo_refuerzo).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
        estado: v.estado_dosis === 'por-vencer' ? 'Por Vencer' : v.estado_dosis === 'vencida' ? 'Vencida' : 'Vigente',
        vet: v.veterinario_nombre || 'Equipo Médico Huellas',
      })),
    });
  } catch (err) {
    console.error('Error consultando ficha QR:', err);
    res.status(500).json({ error: 'Error al obtener ficha QR' });
  }
});

/**
 * Registra el paciente y su peso inicial, con un recordatorio preventivo opcional.
 * Las vacunas aplicadas se registran por separado en el módulo clínico.
 */
router.post('/', requireSession, allowRoles([...RECEPTION_ROLES, ...OWNER_ROLES]), async (req, res) => {
  try {
    const body = req.body || {};
    const nombre = sanitizeText(body.nombre, 80);
    const pesoInput = body.peso_actual ?? body.peso;
    const peso = parseWeightKg(pesoInput);
    if (!nombre || (pesoInput != null && pesoInput !== '' && peso === null)) {
      return res.status(400).json({ error: 'Ingresa un nombre y, si indicas el peso, usa un valor válido en kg.' });
    }

    const ownerId = ownerScope(req.user) || Number(body.id_propietario);
    if (!Number.isSafeInteger(ownerId) || ownerId < 1) {
      return res.status(400).json({ error: 'Selecciona un propietario registrado.' });
    }

    const especie = mapSpeciesToDb(body.especie);
    const raza = sanitizeText(body.raza || body.raza_nombre || 'Mestizo', 80);
    const sexo = body.sexo === 'Hembra' ? 'Hembra' : 'Macho';
    const foto = body.foto_url || body.foto || null;
    if (foto && (typeof foto !== 'string' || !/^(https?:\/\/|data:image\/(jpeg|png|webp|gif);base64,)/i.test(foto))) {
      return res.status(400).json({ error: 'Usa una imagen JPG, PNG, WebP o GIF.' });
    }
    const placaSolicitada = ownerScope(req.user) ? '' : sanitizeText(body.codigo_qr || body.codigoQR, 50);
    if (placaSolicitada && !/^[a-z0-9-]+$/i.test(placaSolicitada)) {
      return res.status(400).json({ error: 'El código de placa solo admite letras, números y guiones.' });
    }
    const codigoQR = (placaSolicitada || `HP-${randomBytes(12).toString('hex')}`).toUpperCase();
    const microchip = sanitizeText(body.microchip || body.chip, 50) || null;
    const recordatorio = sanitizeText(body.recordatorio_preventivo, 120);
    const dias = Number(body.reminderDays);
    if (recordatorio && ![15, 30, 60, 90].includes(dias)) {
      return res.status(400).json({ error: 'Selecciona un plazo válido para el recordatorio.' });
    }

    const created = await db.withTransaction(async (conn) => {
      const [[owner]] = await conn.query(
        `SELECT p.id_propietario, p.nombres, p.telefono, p.correo FROM propietarios p
         INNER JOIN usuarios u ON p.id_usuario = u.id_usuario OR (
           p.id_usuario IS NULL AND p.correo = u.correo AND p.dni = u.dni
         )
         WHERE p.id_propietario = ? AND u.rol = 'Propietario' AND u.estado = 'activo' LIMIT 1`,
        [ownerId]
      );
      if (!owner) return null;

      const [[razaRow]] = await conn.query('SELECT id_raza FROM razas WHERE nombre_raza = ? AND especie = ? LIMIT 1', [raza, especie]);
      const [pet] = await conn.query(
        `INSERT INTO mascotas
         (id_propietario, id_raza, codigo_qr, microchip, nombre, especie, raza, sexo, edad, fecha_nacimiento, peso_actual, color, foto_url, alergias)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ownerId, razaRow?.id_raza || null, codigoQR, microchip, nombre, especie, raza, sexo,
          sanitizeText(body.edad, 50) || null, body.fecha_nacimiento || null, peso,
          sanitizeText(body.color, 80) || null, foto, sanitizeText(body.alergias, 500) || null,
        ]
      );
      if (peso !== null) {
        await conn.query(
          "INSERT INTO registro_pesos (id_mascota, peso_kg, origen) VALUES (?, ?, 'registro')",
          [pet.insertId, peso]
        );
      }

      let idRecordatorio = null;
      if (recordatorio && owner.telefono) {
        const asunto = sanitizeText(`Recordatorio preventivo para ${nombre}`, 150);
        const mensaje = `Hola ${owner.nombres}. Te recordamos consultar con tu clínica sobre ${recordatorio} para ${nombre}.`;
        const [reminder] = await conn.query(
          `INSERT INTO recordatorios
           (id_mascota, id_propietario, canal, asunto, mensaje, telefono_destino, correo_destino, fecha_programada)
           VALUES (?, ?, 'WhatsApp', ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
          [pet.insertId, ownerId, asunto, mensaje, owner.telefono, owner.correo, dias]
        );
        idRecordatorio = reminder.insertId;
      }

      return {
        id_mascota: pet.insertId,
        id_propietario: ownerId,
        codigo_qr: codigoQR,
        microchip,
        id_recordatorio: idRecordatorio,
      };
    });

    if (!created) return res.status(404).json({ error: 'El propietario debe tener una cuenta activa antes de registrar la mascota.' });
    return res.status(201).json({ success: true, ...created });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una mascota con esa placa o microchip.' });
    console.error('Error al registrar la mascota:', err);
    return res.status(500).json({ error: 'Error al guardar la mascota en la base de datos.' });
  }
});

/**
 * 6. PATCH /api/mascotas/:id/extravio
 * Activa o desactiva el Modo Mascota Perdida en MySQL y notifica por WhatsApp al dueño.
 */
router.patch('/:id/extravio', petAccess, async (req, res) => {
  try {
    const idParam = sanitizeText(req.params.id, 50);
    const ownerId = ownerScope(req.user);
    const nuevoEstado = req.body?.estadoExtravio;
    if (typeof nuevoEstado !== 'boolean') {
      return res.status(400).json({ error: 'Indica si deseas activar o desactivar el modo extravío.' });
    }
    const [rows] = await db.queryAsync(
      `SELECT m.*, p.nombres AS propietario_nombre, p.telefono AS propietario_telefono, p.correo AS propietario_correo
       FROM mascotas m
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
       WHERE (m.codigo_qr = ? OR CAST(m.id_mascota AS CHAR) = ?)
       ${ownerId ? 'AND m.id_propietario = ?' : ''} LIMIT 1`,
      ownerId ? [idParam, idParam, ownerId] : [idParam, idParam]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const pet = rows[0];
    const [result] = await db.queryAsync(
      'UPDATE mascotas SET modo_extraviado = ? WHERE id_mascota = ? AND id_propietario = ? AND modo_extraviado <> ?',
      [Number(nuevoEstado), pet.id_mascota, pet.id_propietario, Number(nuevoEstado)]
    );

    if (result.affectedRows && nuevoEstado && pet.propietario_telefono) {
      sendLostPetAlert({
        id_mascota: pet.id_mascota,
        id_propietario: pet.id_propietario,
        petName: pet.nombre,
        codigoQR: pet.codigo_qr,
        ownerName: pet.propietario_nombre,
        ownerPhone: pet.propietario_telefono,
        ownerEmail: pet.propietario_correo,
      }).catch((e) => console.warn('[Extravío Alert]', e.message));
    }

    res.json({
      success: true,
      id_mascota: pet.id_mascota,
      codigo_qr: pet.codigo_qr,
      estadoExtravio: nuevoEstado,
    });
  } catch (err) {
    console.error('Error actualizando modo extravío:', err);
    res.status(500).json({ error: 'Error al actualizar estado de extravío' });
  }
});

/**
 * 7. POST /api/mascotas/:codigo/alerta-gps
 * Guarda coordenadas GPS de rescate en MySQL y envía alerta automática al número del propietario.
 */
router.post('/:codigo/alerta-gps', async (req, res) => {
  try {
    const codigo = sanitizeText(req.params.codigo, 50).toUpperCase();
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    const precision = Number(req.body?.precision_metros) || 15;
    const mensajeRescatista = sanitizeText(req.body?.mensaje || '', 400);

    if (req.body?.lat == null || req.body?.lng == null ||
        !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Coordenadas GPS inválidas.' });
    }

    const [rows] = await db.queryAsync(
      `SELECT m.*, p.nombres AS propietario_nombre, p.telefono AS propietario_telefono, p.correo AS propietario_correo
       FROM mascotas m
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
       WHERE m.codigo_qr = ? AND m.modo_extraviado = 1 LIMIT 1`,
      [codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Esta placa no tiene una alerta de extravío activa.' });
    }

    const pet = rows[0];
    const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

    const [ins] = await db.queryAsync(
      `INSERT INTO alertas_rescate_gps (id_mascota, codigo_qr, latitud, longitud, precision_metros, maps_url, mensaje_rescatista, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activa')`,
      [pet.id_mascota, pet.codigo_qr, lat, lng, precision, mapsUrl, mensajeRescatista || null]
    );

    let notificacion = null;
    if (pet.propietario_telefono) {
      try {
        notificacion = await sendLostPetAlert({
          id_mascota: pet.id_mascota,
          id_propietario: pet.id_propietario,
          petName: pet.nombre,
          codigoQR: pet.codigo_qr,
          ownerName: pet.propietario_nombre,
          ownerPhone: pet.propietario_telefono,
          ownerEmail: pet.propietario_correo,
          mapsUrl,
        });
      } catch (msgErr) {
        console.warn('[GPS Alert] Error enviando notificación automática:', msgErr.message);
      }
    }

    res.status(201).json({
      success: true,
      id_alerta: ins.insertId,
      mapsUrl,
      notificacion_enviada: Boolean(notificacion?.success),
    });
  } catch (err) {
    console.error('Error guardando alerta GPS:', err);
    res.status(500).json({ error: 'Error al registrar alerta GPS' });
  }
});

module.exports = router;
