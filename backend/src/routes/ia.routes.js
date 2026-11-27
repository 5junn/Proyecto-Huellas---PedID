const express = require('express');
const router = express.Router();
const db = require('../db');
const { CLINICAL_ROLES, RECEPTION_ROLES, requireSession, allowRoles } = require('../utils/session');
const { sanitizeText } = require('../utils/security');
const {
  generateSmartReminder,
  generateClinicalSummary,
  generatePredictiveAlerts,
  generateEmergencyGuidance,
} = require('../services/aiService');
const { dispatchMessage } = require('../services/messagingService');

/**
 * 1. POST /api/ia/recordatorio-inteligente
 * Redacta con IA (y opcionalmente programa o envía) un recordatorio basado en el carnet y tabla Recordatorios.
 */
router.post('/recordatorio-inteligente', requireSession, allowRoles(RECEPTION_ROLES), async (req, res) => {
  try {
    const body = req.body || {};
    let pet = null;
    let vaccine = null;

    if (body.id_mascota || body.codigo_qr || body.petName) {
      const [rows] = await db.queryAsync(
        `SELECT m.*, p.id_propietario, p.nombres AS owner_name, p.telefono AS owner_phone, p.correo AS owner_email
         FROM mascotas m
         INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
         WHERE m.id_mascota = ? OR UPPER(m.codigo_qr) = ? OR LOWER(m.nombre) = ?
         LIMIT 1`,
        [
          Number(body.id_mascota) || 0,
          sanitizeText(body.codigo_qr || '', 50).toUpperCase(),
          sanitizeText(body.petName || '', 80).toLowerCase(),
        ]
      );
      if (rows.length > 0) pet = rows[0];
    }

    if (body.id_vacunacion) {
      const [vRows] = await db.queryAsync(
        'SELECT * FROM carnet_vacunacion WHERE id_vacunacion = ? AND id_mascota = ? LIMIT 1',
        [Number(body.id_vacunacion), pet?.id_mascota || 0]
      );
      if (vRows.length > 0) vaccine = vRows[0];
    } else if (pet) {
      const [vRows] = await db.queryAsync(
        'SELECT * FROM carnet_vacunacion WHERE id_mascota = ? ORDER BY fecha_proximo_refuerzo ASC LIMIT 1',
        [pet.id_mascota]
      );
      if (vRows.length > 0) vaccine = vRows[0];
    }

    const dueDateRaw = vaccine?.fecha_proximo_refuerzo || body.dueDate || null;
    let daysRemaining = null;
    let dueStr = body.dueDate || 'En 30 días';
    if (vaccine?.fecha_proximo_refuerzo) {
      const d = new Date(vaccine.fecha_proximo_refuerzo);
      daysRemaining = Math.ceil((d.getTime() - Date.now()) / 86400000);
      dueStr = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const canal = ['WhatsApp', 'Correo', 'SMS'].includes(body.canal || body.channel)
      ? body.canal || body.channel
      : 'WhatsApp';

    const aiResult = await generateSmartReminder({
      petName: pet?.nombre || body.petName || 'tu mascota',
      species: pet?.especie || body.species || 'Canino',
      breed: pet?.raza || body.breed || 'Mestizo',
      ownerName: pet?.owner_name || body.ownerName || 'Familia',
      vaccineName: vaccine?.vacuna || body.vaccineName || 'Control y Refuerzo Vacunal',
      dueDate: dueStr,
      daysRemaining,
      allergies: pet?.alergias || body.allergies || '',
      channel: canal,
    });

    let delivery = null;
    if ((body.guardar || body.enviar) && pet) {
      delivery = await dispatchMessage({
        id_propietario: pet.id_propietario,
        id_mascota: pet.id_mascota,
        id_vacunacion: vaccine?.id_vacunacion || null,
        tipo_evento: 'recordatorio_inteligente_ia',
        canal,
        asunto: aiResult.asunto,
        mensaje: aiResult.mensaje,
        telefono: pet.owner_phone || body.ownerPhone,
        correo: pet.owner_email || body.ownerEmail,
        fecha_programada: dueDateRaw || new Date(),
        generado_por_ia: true,
        soloProgramar: !body.enviar,
      });
    }

    res.json({
      success: true,
      ...aiResult,
      delivery,
    });
  } catch (err) {
    console.error('[IA Recordatorio Inteligente] Error:', err);
    res.status(500).json({ error: 'Error generando recordatorio inteligente' });
  }
});

/**
 * 2. POST /api/ia/resumen-clinico
 * Sintetiza alergias, consultas y tratamientos previos, generando un borrador editable para el veterinario.
 */
router.post('/resumen-clinico', requireSession, allowRoles(CLINICAL_ROLES), async (req, res) => {
  try {
    const body = req.body || {};
    const petName = sanitizeText(body.petName || body.pet || '', 80).toLowerCase();
    const codigoQR = sanitizeText(body.codigo_qr || '', 50).toUpperCase();
    const idMascota = body.id_mascota ? Number(body.id_mascota) : 0;
    const currentReason = sanitizeText(body.motivo_consulta || body.reason || '', 255);

    const [pets] = await db.queryAsync(
      `SELECT m.*, COALESCE(r.nombre_raza, m.raza, 'Mestizo') AS raza_nombre
       FROM mascotas m
       LEFT JOIN razas r ON m.id_raza = r.id_raza
       WHERE ${idMascota ? 'm.id_mascota' : codigoQR ? 'm.codigo_qr' : 'm.nombre'} = ?
       LIMIT 2`,
      [idMascota || codigoQR || petName]
    );
    if (pets.length !== 1) {
      return res.status(404).json({ error: 'Selecciona un paciente identificado de la base de datos.' });
    }
    const [pet] = pets;

    let consultations = [];
    let vaccines = [];
    let weights = [];

    if (pet.id_mascota) {
      const [cRows] = await db.queryAsync(
        'SELECT * FROM consultas_historial WHERE id_mascota = ? ORDER BY fecha_hora DESC LIMIT 10',
        [pet.id_mascota]
      );
      const [vRows] = await db.queryAsync(
        'SELECT * FROM carnet_vacunacion WHERE id_mascota = ? ORDER BY fecha_aplicacion DESC LIMIT 10',
        [pet.id_mascota]
      );
      const [wRows] = await db.queryAsync(
        'SELECT * FROM registro_pesos WHERE id_mascota = ? ORDER BY registrado_en DESC LIMIT 10',
        [pet.id_mascota]
      );
      consultations = cRows;
      vaccines = vRows;
      weights = wRows;
    }

    const summary = await generateClinicalSummary({
      pet: { ...pet, raza: pet.raza_nombre || pet.raza },
      consultations,
      vaccines,
      weights,
      currentReason,
    });

    res.json({
      success: true,
      mascota_encontrada: Boolean(pet.id_mascota),
      id_mascota: pet.id_mascota || null,
      paciente: pet.nombre,
      ...summary,
    });
  } catch (err) {
    console.error('[IA Resumen Clinico] Error:', err);
    res.status(500).json({ error: 'Error generando resumen del historial clínico' });
  }
});

/**
 * 3. GET /api/ia/alertas-predictivas
 * Detecta vacunas por vencer, falta de controles recientes y cambios de peso para gerencia.
 */
router.get('/alertas-predictivas', requireSession, allowRoles(CLINICAL_ROLES), async (req, res) => {
  try {
    const [pets] = await db.queryAsync(
      `SELECT m.*, p.nombres AS propietario_nombre, p.telefono AS propietario_telefono
       FROM mascotas m
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario`
    );
    const [vaccines] = await db.queryAsync(
      `SELECT cv.*, m.nombre AS mascota_nombre, p.nombres AS propietario_nombre, p.telefono
       FROM carnet_vacunacion cv
       INNER JOIN mascotas m ON cv.id_mascota = m.id_mascota
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario`
    );
    const [consultations] = await db.queryAsync(
      'SELECT id_consulta, id_mascota, fecha_hora FROM consultas_historial'
    );
    const [weights] = await db.queryAsync(
      'SELECT id_mascota, peso_kg, registrado_en FROM registro_pesos ORDER BY registrado_en ASC'
    );

    const report = await generatePredictiveAlerts({
      pets,
      vaccines,
      consultations,
      weights,
    });

    res.json({
      success: true,
      generado_en: new Date().toISOString(),
      ...report,
    });
  } catch (err) {
    console.error('[IA Alertas Predictivas] Error:', err);
    res.status(500).json({ error: 'Error generando alertas predictivas' });
  }
});

/**
 * 4. POST /api/ia/asistente-emergencia
 * Guía a quien escanee el QR con pasos sencillos y llamada directa a la clínica,
 * protegiendo la privacidad del dueño y respetando el Modo Mascota Perdida.
 */
router.post('/asistente-emergencia', async (req, res) => {
  try {
    const body = req.body || {};
    const codigoQR = sanitizeText(body.codigo_qr || body.petCode || '', 50).toUpperCase();
    const question = sanitizeText(body.question || body.mensaje || '', 400);

    let pet = null;
    if (codigoQR) {
      const [rows] = await db.queryAsync(
        'SELECT * FROM mascotas WHERE UPPER(codigo_qr) = ? LIMIT 1',
        [codigoQR]
      );
      if (rows.length > 0) pet = rows[0];
    }

    if (codigoQR && !pet) {
      return res.status(404).json({ error: 'Placa no encontrada.' });
    }
    const isLost = Boolean(pet?.modo_extraviado);

    const guidance = await generateEmergencyGuidance({
      pet: pet || {
        nombre: sanitizeText(body.petName || 'la mascota', 80),
        especie: sanitizeText(body.especie || 'Canino', 40),
        raza: sanitizeText(body.raza || 'Mestizo', 80),
        alergias: sanitizeText(body.alergias || 'Sin alergias reportadas', 300),
      },
      isLost,
      question,
    });

    res.json({
      success: true,
      ...guidance,
    });
  } catch (err) {
    console.error('[IA Asistente Emergencia] Error:', err);
    res.status(500).json({ error: 'Error en asistente de emergencia' });
  }
});

module.exports = router;
