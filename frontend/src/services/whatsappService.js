// src/services/whatsappService.js

/**
 * Servicio de mensajería y recordatorios mediante la API de WhatsApp
 * Soporta enlace directo a la API de WhatsApp (Click to Chat) y simulación/llamada a webhook externo (Meta WhatsApp Cloud API).
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Limpia y normaliza el número de teléfono con código de país (Perú +51 por defecto si tiene 9 dígitos)
 */
export function formatWhatsAppPhone(phone) {
  if (!phone) return '51987654321';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 9) {
    return `51${cleaned}`;
  }
  return cleaned || '51987654321';
}

/**
 * Genera el enlace oficial a la API de WhatsApp
 */
export function generateWhatsAppLink(phone, message) {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message.trim());
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

/**
 * Genera el texto estándar de recordatorio de vacunación para WhatsApp
 */
export function getVaccineReminderMessage({
  petName = 'tu mascota',
  ownerName = 'Familia',
  vaccineName = 'Vacuna de Refuerzo',
  dueDate = 'próximamente',
  clinicName = 'Clínica Veterinaria Huellas',
  clinicPhone = '+51 987 654 321'
}) {
  return `🐾 *RECORDATORIO MÉDICO - HUELLAS PETID* 🐾\n\n` +
    `Hola ${ownerName}, te saludamos de la *${clinicName}*.\n\n` +
    `🔔 Te recordamos que *${petName}* tiene programada su aplicación de:\n` +
    `💉 *${vaccineName}*\n` +
    `📅 Fecha estimada: *${dueDate}*\n\n` +
    `Mantener su carnet de vacunación al día es vital para su protección y salud integral.\n\n` +
    `📍 Para confirmar tu cita o consultas, comunícate con nosotros al *${clinicPhone}* o responde a este mensaje.\n` +
    `¡Cuidamos a los que más quieres! 🐶🐱`;
}

/**
 * Genera el texto estándar de recordatorio de desparasitación o control
 */
export function getGeneralReminderMessage({
  petName = 'tu mascota',
  ownerName = 'Familia',
  topic = 'Control Veterinario Preventivo',
  dueDate = 'en 30 días',
  clinicName = 'Clínica Veterinaria Huellas'
}) {
  return `🩺 *HUELLAS PETID - RECORDATORIO PREVENTIVO* 🩺\n\n` +
    `Estimado(a) ${ownerName},\n` +
    `Es momento del chequeo preventivo de *${petName}* (*${topic}*).\n` +
    `📅 Fecha sugerida: *${dueDate}*\n\n` +
    `Recuerda que con su placa inteligente Huellas PetID puedes mostrar su historial médico en cualquier momento.\n\n` +
    `🏥 *${clinicName}* · Siempre contigo`;
}

/**
 * Envía / Programa el recordatorio a través de la API externa (o simula la integración con Meta / Twilio WhatsApp API)
 */
export async function scheduleWhatsAppReminder({
  petName,
  ownerName,
  ownerPhone,
  reminderType = 'vacuna', // 'vacuna' | 'desparasitacion' | 'control'
  vaccineName = 'Vacuna Antirrábica',
  dueDate = 'En 30 días'
}) {
  const message = reminderType === 'vacuna'
    ? getVaccineReminderMessage({ petName, ownerName, vaccineName, dueDate })
    : getGeneralReminderMessage({ petName, ownerName, topic: vaccineName, dueDate });

  const payload = {
    messageId: 'WA-' + Date.now(),
    channel: 'whatsapp_cloud_api',
    recipient: formatWhatsAppPhone(ownerPhone),
    petName,
    ownerName,
    reminderType,
    dueDate,
    message,
    scheduledAt: new Date().toISOString(),
    status: 'scheduled_external_api'
  };

  // Intentar notificar al backend si está disponible
  try {
    await fetch(`${API_BASE}/reminders/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Si el backend no está corriendo aún, continúa localmente
    });
  } catch {
    // Modo offline resiliente
  }

  // Guardar en almacenamiento local para persistencia
  const current = getStoredReminders();
  current.unshift(payload);
  localStorage.setItem('huellas_reminders', JSON.stringify(current.slice(0, 30)));

  return {
    success: true,
    data: payload,
    directLink: generateWhatsAppLink(ownerPhone, message)
  };
}

/**
 * Obtiene los recordatorios almacenados
 */
export function getStoredReminders() {
  try {
    const raw = localStorage.getItem('huellas_reminders');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
