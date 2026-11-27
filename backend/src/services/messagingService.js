const db = require('../db');
const { normalizePhone, sanitizeText } = require('../utils/security');

function whatsappTestNumber() {
  const raw = process.env.WHATSAPP_TEST_TO?.trim();
  if (!raw) return null;
  const number = normalizePhone(raw);
  if (!/^[1-9]\d{8,14}$/.test(number)) throw new Error('WHATSAPP_TEST_TO debe tener un número válido con código de país.');
  return number;
}

/**
 * Envía un mensaje a través de proveedores externos configurados (Meta WhatsApp Cloud API,
 * Twilio WhatsApp/SMS, Resend Email, o Webhook), con respaldo seguro en modo gateway local.
 */
async function sendThroughExternalProvider({ canal = 'WhatsApp', toPhone, toEmail, subject, message }) {
  const cleanPhone = normalizePhone(toPhone);
  const testNumber = canal === 'WhatsApp' ? whatsappTestNumber() : null;
  if (testNumber && cleanPhone !== testNumber) {
    throw new Error('El modo de prueba de WhatsApp solo permite el número configurado.');
  }
  const text = sanitizeText(message, 2000);
  const cleanSubject = sanitizeText(subject || 'Notificación Clínica Veterinaria Huellas', 150);

  // 1. Correo electrónico vía Resend API
  if (canal === 'Correo' && process.env.RESEND_API_KEY && toEmail) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Huellas PetID <notificaciones@huellaspetid.com>',
        to: [toEmail],
        subject: cleanSubject,
        text,
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data.message || `Error Resend HTTP ${resp.status}`);
    }
    return {
      ok: true,
      providerName: 'Resend Email API',
      providerMessageId: data.id || `EMAIL-${Date.now()}`,
      external: true,
    };
  }

  // 2. Meta WhatsApp Cloud API
  if (
    canal === 'WhatsApp' &&
    process.env.WHATSAPP_CLOUD_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    cleanPhone
  ) {
    const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';
    const url = `https://graph.facebook.com/${graphVersion}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
    const content = templateName
      ? {
        type: 'template',
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es' },
          components: [{
            type: 'body',
            parameters: [{ type: 'text', text: text.replace(/\s+/g, ' ').slice(0, 1000) }],
          }],
        },
      }
      : { type: 'text', text: { preview_url: false, body: text } };
    const resp = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        ...content,
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data.error?.message || `Error Meta WhatsApp HTTP ${resp.status}`);
    }
    return {
      ok: true,
      providerName: 'Meta WhatsApp Cloud API',
      providerMessageId: data.messages?.[0]?.id || `WAMETA-${Date.now()}`,
      external: true,
    };
  }

  // 3. Twilio WhatsApp / SMS API
  if (
    (canal === 'WhatsApp' || canal === 'SMS') &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    cleanPhone
  ) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const from =
      canal === 'WhatsApp'
        ? process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
        : process.env.TWILIO_FROM_NUMBER;

    if (from) {
      const to = canal === 'WhatsApp' ? `whatsapp:+${cleanPhone}` : `+${cleanPhone}`;
      const body = new URLSearchParams({ From: from, To: to, Body: text });
      const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
      signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.message || `Error Twilio HTTP ${resp.status}`);
      }
      return {
        ok: true,
        providerName: `Twilio ${canal} API`,
        providerMessageId: data.sid || `TW-${Date.now()}`,
        external: true,
      };
    }
  }

  // 4. Webhook personalizado (n8n, Make, Zapier, Gateway propio)
  if (process.env.MESSAGING_WEBHOOK_URL) {
    const resp = await fetch(process.env.MESSAGING_WEBHOOK_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canal,
        telefono: cleanPhone,
        correo: toEmail || null,
        asunto: cleanSubject,
        mensaje: text,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!resp.ok) {
      throw new Error(`Error Webhook HTTP ${resp.status}`);
    }
    return {
      ok: true,
      providerName: 'External Messaging Webhook',
      providerMessageId: `WHK-${Date.now()}`,
      external: true,
    };
  }

  throw new Error(`Configura un proveedor de mensajería para el canal ${canal}.`);
}

/**
 * Registra un mensaje en historial_mensajes en MySQL.
 */
async function logMessageHistory({
  id_propietario = null,
  id_mascota = null,
  id_recordatorio = null,
  tipo_evento = 'notificacion',
  canal = 'WhatsApp',
  destinatario,
  contenido,
  estado = 'Enviado',
  provider_name = null,
  provider_message_id = null,
  generado_por_ia = 0,
}) {
  try {
    const [res] = await db.queryAsync(
      `INSERT INTO historial_mensajes
       (id_propietario, id_mascota, id_recordatorio, tipo_evento, canal, destinatario, contenido, estado, provider_name, provider_message_id, generado_por_ia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_propietario,
        id_mascota,
        id_recordatorio,
        tipo_evento,
        canal,
        destinatario,
        contenido,
        estado,
        provider_name,
        provider_message_id,
        generado_por_ia ? 1 : 0,
      ]
    );
    return res.insertId;
  } catch (err) {
    console.warn('[Mensajería] No se pudo registrar historial_mensajes:', err.message);
    return null;
  }
}

/**
 * Envía y persiste un mensaje automático a un destinatario registrado en el proyecto.
 */
async function dispatchMessage({
  id_propietario = null,
  id_mascota = null,
  id_vacunacion = null,
  id_recordatorio = null,
  tipo_evento = 'recordatorio',
  canal = 'WhatsApp',
  asunto = 'Notificación Clínica Huellas',
  mensaje,
  telefono,
  correo = null,
  fecha_programada = null,
  generado_por_ia = false,
  soloProgramar = false,
}) {
  const cleanPhone = normalizePhone(telefono);
  const destinatario = canal === 'Correo' ? correo : cleanPhone;

  if (!destinatario) {
    throw new Error('Se requiere un número telefónico o correo válido para enviar el mensaje.');
  }

  let recordatorioId = id_recordatorio;

  // Si hay mascota y propietario, garantizar persistencia en tabla recordatorios
  if (!recordatorioId && id_mascota && id_propietario) {
    const schedDate = fecha_programada ? new Date(fecha_programada) : new Date();
    const [ins] = await db.queryAsync(
      `INSERT INTO recordatorios
       (id_mascota, id_propietario, id_vacunacion, canal, asunto, mensaje, telefono_destino, correo_destino, fecha_programada, estado, generado_por_ia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Programado', ?)`,
      [
        id_mascota,
        id_propietario,
        id_vacunacion,
        canal,
        sanitizeText(asunto, 150),
        mensaje,
        cleanPhone || '',
        correo || null,
        schedDate,
        generado_por_ia ? 1 : 0,
      ]
    );
    recordatorioId = ins.insertId;
  }

  if (soloProgramar) {
    await logMessageHistory({
      id_propietario,
      id_mascota,
      id_recordatorio: recordatorioId,
      tipo_evento,
      canal,
      destinatario,
      contenido: mensaje,
      estado: 'Programado',
      provider_name: 'Programador Huellas PetID',
      generado_por_ia,
    });

    return {
      success: true,
      estado: 'Programado',
      id_recordatorio: recordatorioId,
      destinatario,
      canal,
    };
  }

  try {
    const providerResult = await sendThroughExternalProvider({
      canal,
      toPhone: cleanPhone,
      toEmail: correo,
      subject: asunto,
      message: mensaje,
    });

    if (recordatorioId) {
      await db.queryAsync(
        `UPDATE recordatorios
         SET estado = 'Enviado',
             provider_name = ?,
             provider_message_id = ?,
             intentos = intentos + 1,
             enviado_en = NOW(),
             ultimo_error = NULL
         WHERE id_recordatorio = ?`,
        [providerResult.providerName, providerResult.providerMessageId, recordatorioId]
      );
    }

    const id_mensaje = await logMessageHistory({
      id_propietario,
      id_mascota,
      id_recordatorio: recordatorioId,
      tipo_evento,
      canal,
      destinatario,
      contenido: mensaje,
      estado: 'Enviado',
      provider_name: providerResult.providerName,
      provider_message_id: providerResult.providerMessageId,
      generado_por_ia,
    });

    return {
      success: true,
      estado: 'Enviado',
      id_recordatorio: recordatorioId,
      id_mensaje,
      destinatario,
      canal,
      provider: providerResult.providerName,
      messageId: providerResult.providerMessageId,
      external: providerResult.external,
      whatsappLink: cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensaje)}`
        : null,
    };
  } catch (err) {
    if (recordatorioId) {
      await db.queryAsync(
        `UPDATE recordatorios
         SET estado = 'Fallido',
             intentos = intentos + 1,
             ultimo_error = ?
         WHERE id_recordatorio = ?`,
        [sanitizeText(err.message, 250), recordatorioId]
      );
    }

    await logMessageHistory({
      id_propietario,
      id_mascota,
      id_recordatorio: recordatorioId,
      tipo_evento,
      canal,
      destinatario,
      contenido: mensaje,
      estado: 'Fallido',
      provider_name: 'Error de Proveedor',
      generado_por_ia,
    });

    throw err;
  }
}

/**
 * Envío automático al registrarse una nueva persona en el sistema.
 */
async function sendWelcomeMessage({ id_propietario, nombres, telefono, correo }) {
  const clinicName = process.env.CLINIC_NAME || 'Clínica Veterinaria Huellas';
  const clinicPhone = process.env.CLINIC_PHONE || '+51 987 654 321';
  const primerNombre = (nombres || 'Propietario').split(' ')[0];

  const mensaje =
    `🐾 ¡Bienvenido(a) a *Huellas PetID*, ${primerNombre}!\n\n` +
    `Tu registro en *${clinicName}* se completó con éxito.\n` +
    `Desde ahora recibirás recordatorios automáticos de vacunas, alertas preventivas y avisos de rescate QR en este número.\n\n` +
    `🏥 Central de atención 24/7: *${clinicPhone}*`;

  return dispatchMessage({
    id_propietario,
    tipo_evento: 'bienvenida_registro',
    canal: 'WhatsApp',
    asunto: 'Bienvenida a Huellas PetID',
    mensaje,
    telefono,
    correo,
    generado_por_ia: false,
  });
}

/**
 * Notificación automática cuando una mascota entra en Modo Extraviado o se escanea su QR con GPS.
 */
async function sendLostPetAlert({
  id_mascota,
  id_propietario,
  petName,
  codigoQR,
  ownerName,
  ownerPhone,
  ownerEmail,
  mapsUrl = null,
}) {
  const mensaje = mapsUrl
    ? `🚨 *ALERTA DE RESCATE GPS - HUELLAS PETID* 🚨\n\n` +
      `Hola ${ownerName || 'Propietario'}, alguien acaba de escanear la placa QR *${codigoQR}* de *${petName}* y compartió su ubicación en vivo:\n` +
      `📍 Mapa GPS: ${mapsUrl}\n\n` +
      `Por favor verifica el enlace o comunícate con nuestra clínica 24/7.`
    : `🚨 *MODO MASCOTA PERDIDA ACTIVADO* 🚨\n\n` +
      `Hola ${ownerName || 'Propietario'}, confirmamos que la placa *${codigoQR}* de *${petName}* está ahora en alerta de búsqueda.\n` +
      `Cualquier persona que escanee su collar verá el protocolo de rescate inmediato y podrá enviarte su ubicación GPS.`;

  return dispatchMessage({
    id_propietario,
    id_mascota,
    tipo_evento: mapsUrl ? 'alerta_rescate_gps' : 'activacion_extravio',
    canal: 'WhatsApp',
    asunto: mapsUrl ? `Ubicación GPS recibida: ${petName}` : `Modo Extraviado Activado: ${petName}`,
    mensaje,
    telefono: ownerPhone,
    correo: ownerEmail,
  });
}

/**
 * Procesa y envía automáticamente todos los recordatorios pendientes cuya fecha ya llegó,
 * además de generar avisos para vacunas próximas a vencer en los siguientes N días.
 */
async function processScheduledAndDueReminders({ diasAnticipacion = 15, soloVencidos = false } = {}) {
  const results = {
    procesados: 0,
    enviados: 0,
    fallidos: 0,
    generadosPorVacunas: 0,
    detalles: [],
  };

  // Filtra los recordatorios de prueba antes de generar avisos o modificar su estado.
  const testNumber = whatsappTestNumber();
  const testPhones = testNumber ? [testNumber, testNumber.replace(/^51(?=9\d{8}$)/, '')] : [];
  const [vacunasSinAviso] = await db.queryAsync(
    `SELECT
       cv.id_vacunacion, cv.id_mascota, cv.vacuna, cv.fecha_proximo_refuerzo,
       m.nombre AS mascota_nombre, m.especie, m.codigo_qr,
       p.id_propietario, p.nombres AS propietario_nombre, p.telefono, p.correo
     FROM carnet_vacunacion cv
     INNER JOIN mascotas m ON cv.id_mascota = m.id_mascota
     INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
     LEFT JOIN recordatorios r
       ON r.id_vacunacion = cv.id_vacunacion
     WHERE cv.fecha_proximo_refuerzo <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       AND r.id_recordatorio IS NULL
       AND p.telefono IS NOT NULL
       AND p.telefono <> ''
       ${testNumber ? "AND REGEXP_REPLACE(p.telefono, '[^0-9]', '') IN (?, ?)" : ''}`,
    [Number(diasAnticipacion) || 15, ...testPhones]
  );

  for (const v of vacunasSinAviso) {
    const dueStr = new Date(v.fecha_proximo_refuerzo).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const msg =
      `🐾 *RECORDATORIO AUTOMÁTICO DE VACUNACIÓN* 🐾\n\n` +
      `Hola ${v.propietario_nombre}, le saludamos de *Clínica Veterinaria Huellas*.\n` +
      `🔔 *${v.mascota_nombre}* (${v.codigo_qr}) tiene próximo refuerzo de:\n` +
      `💉 *${v.vacuna}*\n` +
      `📅 Fecha programada: *${dueStr}*\n\n` +
      `Responde este mensaje o llámanos al *+51 987 654 321* para confirmar su atención.`;

    await db.queryAsync(
      `INSERT INTO recordatorios
       (id_mascota, id_propietario, id_vacunacion, canal, asunto, mensaje, telefono_destino, correo_destino, fecha_programada, estado, generado_por_ia)
       VALUES (?, ?, ?, 'WhatsApp', ?, ?, ?, ?, NOW(), 'Programado', 0)`,
      [
        v.id_mascota,
        v.id_propietario,
        v.id_vacunacion,
        `Refuerzo ${v.vacuna} - ${v.mascota_nombre}`,
        msg,
        normalizePhone(v.telefono),
        v.correo || null,
      ]
    );
    results.generadosPorVacunas += 1;
  }

  // 2. Obtener recordatorios pendientes (todos los Programados si !soloVencidos, o solo fecha_programada <= NOW())
  const dateFilter = soloVencidos ? 'AND r.fecha_programada <= NOW()' : '';
  const [pendientes] = await db.queryAsync(
    `SELECT r.*, m.nombre AS mascota_nombre, p.nombres AS propietario_nombre
     FROM recordatorios r
     INNER JOIN mascotas m ON r.id_mascota = m.id_mascota
     INNER JOIN propietarios p ON r.id_propietario = p.id_propietario
     WHERE r.estado = 'Programado' ${dateFilter}
       ${testNumber ? "AND (r.canal <> 'WhatsApp' OR REGEXP_REPLACE(r.telefono_destino, '[^0-9]', '') IN (?, ?))" : ''}
     ORDER BY r.fecha_programada ASC
     LIMIT 50`,
    testPhones
  );

  for (const rec of pendientes) {
    results.procesados += 1;
    try {
      const sent = await dispatchMessage({
        id_propietario: rec.id_propietario,
        id_mascota: rec.id_mascota,
        id_vacunacion: rec.id_vacunacion,
        id_recordatorio: rec.id_recordatorio,
        tipo_evento: 'recordatorio_automatico',
        canal: rec.canal || 'WhatsApp',
        asunto: rec.asunto,
        mensaje: rec.mensaje,
        telefono: rec.telefono_destino,
        correo: rec.correo_destino,
        generado_por_ia: Boolean(rec.generado_por_ia),
      });
      results.enviados += 1;
      results.detalles.push({
        id_recordatorio: rec.id_recordatorio,
        mascota: rec.mascota_nombre,
        propietario: rec.propietario_nombre,
        destinatario: sent.destinatario,
        canal: sent.canal,
        estado: 'Enviado',
        provider: sent.provider,
        messageId: sent.messageId,
      });
    } catch (err) {
      results.fallidos += 1;
      results.detalles.push({
        id_recordatorio: rec.id_recordatorio,
        mascota: rec.mascota_nombre,
        propietario: rec.propietario_nombre,
        destinatario: rec.telefono_destino,
        canal: rec.canal,
        estado: 'Fallido',
        error: err.message,
      });
    }
  }

  return results;
}

module.exports = {
  sendThroughExternalProvider,
  logMessageHistory,
  dispatchMessage,
  sendWelcomeMessage,
  sendLostPetAlert,
  processScheduledAndDueReminders,
};
