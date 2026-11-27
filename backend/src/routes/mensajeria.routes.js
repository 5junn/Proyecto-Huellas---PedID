const express = require('express');
const router = express.Router();
const db = require('../db');
const { RECEPTION_ROLES, requireSession, allowRoles } = require('../utils/session');

router.use(requireSession, allowRoles(RECEPTION_ROLES));
const { normalizePhone, sanitizeText } = require('../utils/security');
const {
  dispatchMessage,
  processScheduledAndDueReminders,
} = require('../services/messagingService');

/**
 * GET /api/mensajeria/numeros
 * Lista todos los números telefónicos y correos registrados en la base de datos del proyecto.
 */
router.get('/numeros', async (req, res) => {
  try {
    const [rows] = await db.queryAsync(
      `SELECT p.id_propietario, p.nombres, p.telefono, p.correo, p.dni,
              COUNT(m.id_mascota) AS total_mascotas,
              GROUP_CONCAT(m.nombre SEPARATOR ', ') AS mascotas
       FROM propietarios p
       LEFT JOIN mascotas m ON m.id_propietario = p.id_propietario
       WHERE p.telefono IS NOT NULL AND p.telefono <> ''
       GROUP BY p.id_propietario
       ORDER BY p.id_propietario DESC`
    );

    res.json({
      total: rows.length,
      numeros: rows.map((r) => ({
        ...r,
        telefono_normalizado: normalizePhone(r.telefono),
      })),
    });
  } catch (err) {
    console.error('[Mensajeria Numeros] Error:', err);
    res.status(500).json({ error: 'Error al consultar números registrados' });
  }
});

/**
 * GET /api/mensajeria/recordatorios
 * Lista todos los recordatorios almacenados en MySQL.
 */
router.get('/recordatorios', async (req, res) => {
  try {
    const correo = sanitizeText(req.query.correo, 120).toLowerCase();
    let sql = `
      SELECT r.*, m.nombre AS pet, m.codigo_qr, p.nombres AS owner, p.telefono AS owner_phone
      FROM recordatorios r
      INNER JOIN mascotas m ON r.id_mascota = m.id_mascota
      INNER JOIN propietarios p ON r.id_propietario = p.id_propietario
    `;
    const params = [];
    if (correo) {
      sql += ' WHERE LOWER(p.correo) = ?';
      params.push(correo);
    }
    sql += ' ORDER BY r.fecha_programada DESC, r.id_recordatorio DESC';

    const [rows] = await db.queryAsync(sql, params);
    res.json(
      rows.map((r) => ({
        id: `R-${r.id_recordatorio}`,
        id_recordatorio: r.id_recordatorio,
        id_mascota: r.id_mascota,
        id_propietario: r.id_propietario,
        pet: r.pet,
        codigo_qr: r.codigo_qr,
        owner: r.owner,
        telefono: r.telefono_destino,
        correo: r.correo_destino,
        canal: r.canal,
        asunto: r.asunto,
        mensaje: r.mensaje,
        programado: new Date(r.fecha_programada).toLocaleString('es-PE', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        fecha_programada: r.fecha_programada,
        estado: r.estado,
        provider_name: r.provider_name,
        provider_message_id: r.provider_message_id,
        generado_por_ia: Boolean(r.generado_por_ia),
        enviado_en: r.enviado_en,
      }))
    );
  } catch (err) {
    console.error('[Mensajeria Recordatorios] Error:', err);
    res.status(500).json({ error: 'Error al consultar recordatorios' });
  }
});

/**
 * GET /api/mensajeria/historial
 * Lista el historial de mensajes automáticos enviados a los números del proyecto.
 */
router.get('/historial', async (req, res) => {
  try {
    const [rows] = await db.queryAsync(
      `SELECT h.*, p.nombres AS propietario_nombre, m.nombre AS mascota_nombre
       FROM historial_mensajes h
       LEFT JOIN propietarios p ON h.id_propietario = p.id_propietario
       LEFT JOIN mascotas m ON h.id_mascota = m.id_mascota
       ORDER BY h.id_mensaje DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error('[Mensajeria Historial] Error:', err);
    res.status(500).json({ error: 'Error al consultar historial de envíos' });
  }
});

/**
 * POST /api/mensajeria/enviar
 * Envía un mensaje inmediato (o programa) a un destinatario registrado o número específico.
 */
router.post('/enviar', async (req, res) => {
  try {
    const body = req.body || {};
    let idPropietario = body.id_propietario ? Number(body.id_propietario) : null;
    let idMascota = body.id_mascota ? Number(body.id_mascota) : null;
    let telefono = body.telefono || body.recipient || '';
    let correo = body.correo || '';

    if (body.id_recordatorio && !body.mensaje) {
      const [recs] = await db.queryAsync(
        'SELECT * FROM recordatorios WHERE id_recordatorio = ? LIMIT 1',
        [Number(body.id_recordatorio)]
      );
      if (recs.length === 0) {
        return res.status(404).json({ error: 'Recordatorio no encontrado' });
      }
      const r = recs[0];
      const sent = await dispatchMessage({
        id_propietario: r.id_propietario,
        id_mascota: r.id_mascota,
        id_vacunacion: r.id_vacunacion,
        id_recordatorio: r.id_recordatorio,
        tipo_evento: 'reenvio_manual',
        canal: r.canal,
        asunto: r.asunto,
        mensaje: r.mensaje,
        telefono: r.telefono_destino,
        correo: r.correo_destino,
        generado_por_ia: Boolean(r.generado_por_ia),
      });
      return res.json(sent);
    }

    if (idPropietario && (!telefono || !correo)) {
      const [props] = await db.queryAsync(
        'SELECT telefono, correo FROM propietarios WHERE id_propietario = ? LIMIT 1',
        [idPropietario]
      );
      if (props.length > 0) {
        telefono = telefono || props[0].telefono;
        correo = correo || props[0].correo;
      }
    }

    const mensaje = sanitizeText(body.mensaje, 2000);
    if (!mensaje) {
      return res.status(400).json({ error: 'El contenido del mensaje es obligatorio.' });
    }

    const result = await dispatchMessage({
      id_propietario: idPropietario,
      id_mascota: idMascota,
      id_vacunacion: body.id_vacunacion ? Number(body.id_vacunacion) : null,
      tipo_evento: sanitizeText(body.tipo_evento || 'envio_directo', 60),
      canal: ['WhatsApp', 'SMS', 'Correo'].includes(body.canal) ? body.canal : 'WhatsApp',
      asunto: sanitizeText(body.asunto || 'Notificación Huellas PetID', 150),
      mensaje,
      telefono,
      correo,
      fecha_programada: body.fecha_programada || null,
      generado_por_ia: Boolean(body.generado_por_ia),
      soloProgramar: Boolean(body.soloProgramar),
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('[Mensajeria Enviar] Error:', err);
    res.status(500).json({ error: err.message || 'Error al enviar mensaje' });
  }
});

/**
 * POST /api/mensajeria/enviar-automatico
 * Ejecuta un envío automático a los números dentro de la base de datos:
 * - Modo 'recordatorios': procesa recordatorios pendientes y vacunas por vencer.
 * - Modo 'todos_numeros': envía campaña/aviso personalizado a todos los números registrados en `propietarios`.
 */
router.post('/enviar-automatico', async (req, res) => {
  try {
    const body = req.body || {};
    const modo = body.modo || 'recordatorios';
    const canal = ['WhatsApp', 'SMS', 'Correo'].includes(body.canal) ? body.canal : 'WhatsApp';

    if (modo === 'todos_numeros') {
      const asunto = sanitizeText(body.asunto || 'Campaña Preventiva Clínica Huellas', 150);
      const plantilla = sanitizeText(
        body.mensaje ||
          '🐾 Hola {nombre}, te saludamos de Clínica Veterinaria Huellas. Recuerda revisar el carnet de vacunación de {mascota} en tu portal Huellas PetID.',
        1500
      );

      const [destinatarios] = await db.queryAsync(
        `SELECT p.id_propietario, p.nombres, p.telefono, p.correo,
                MIN(m.id_mascota) AS id_mascota,
                COALESCE(GROUP_CONCAT(m.nombre SEPARATOR ' y '), 'tu mascota') AS mascotas
         FROM propietarios p
         LEFT JOIN mascotas m ON m.id_propietario = p.id_propietario
         WHERE p.telefono IS NOT NULL AND p.telefono <> ''
         GROUP BY p.id_propietario`
      );

      let enviados = 0;
      let fallidos = 0;
      const detalles = [];

      for (const dest of destinatarios) {
        const textoPersonalizado = plantilla
          .replace(/\{nombre\}/gi, dest.nombres.split(' ')[0])
          .replace(/\{mascota\}/gi, dest.mascotas);

        try {
          const sent = await dispatchMessage({
            id_propietario: dest.id_propietario,
            id_mascota: dest.id_mascota || null,
            tipo_evento: 'campana_masiva_bd',
            canal,
            asunto,
            mensaje: textoPersonalizado,
            telefono: dest.telefono,
            correo: dest.correo,
            generado_por_ia: Boolean(body.generado_por_ia),
          });
          enviados += 1;
          detalles.push({
            propietario: dest.nombres,
            telefono: sent.destinatario,
            estado: 'Enviado',
            messageId: sent.messageId,
          });
        } catch (err) {
          fallidos += 1;
          detalles.push({
            propietario: dest.nombres,
            telefono: dest.telefono,
            estado: 'Fallido',
            error: err.message,
          });
        }
      }

      return res.json({
        success: true,
        modo: 'todos_numeros',
        total_destinatarios: destinatarios.length,
        enviados,
        fallidos,
        detalles,
      });
    }

    const summary = await processScheduledAndDueReminders({
      diasAnticipacion: Number(body.diasAnticipacion) || 15,
      soloVencidos: Boolean(body.soloVencidos),
    });

    res.json({
      success: true,
      modo: 'recordatorios',
      ...summary,
    });
  } catch (err) {
    console.error('[Mensajeria Automatico] Error:', err);
    res.status(500).json({ error: 'Error ejecutando el envío automático de mensajes' });
  }
});

module.exports = router;
