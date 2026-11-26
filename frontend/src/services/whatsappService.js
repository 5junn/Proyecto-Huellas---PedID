// src/services/whatsappService.js
import { apiFetch, getApiBase } from './apiClient';

const API_BASE = getApiBase();

export function formatWhatsAppPhone(phone) {
  if (!phone) return '51987654321';
  const cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.length === 9) {
    return `51${cleaned}`;
  }
  return cleaned || '51987654321';
}

export function generateWhatsAppLink(phone, message) {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(String(message || '').trim());
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

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

export async function scheduleWhatsAppReminder({
  id_mascota = null,
  id_propietario = null,
  petCode = null,
  petName,
  ownerName,
  ownerPhone,
  reminderType = 'vacuna',
  vaccineName = 'Vacuna Antirrábica',
  dueDate = 'En 30 días',
  customMessage = null,
  generadoPorIA = false
}) {
  const message = customMessage || (
    reminderType === 'vacuna'
      ? getVaccineReminderMessage({ petName, ownerName, vaccineName, dueDate })
      : getGeneralReminderMessage({ petName, ownerName, topic: vaccineName, dueDate })
  );

  const payload = {
    messageId: 'WA-' + Date.now(),
    channel: 'whatsapp_cloud_api',
    id_mascota,
    id_propietario,
    petCode,
    recipient: formatWhatsAppPhone(ownerPhone),
    petName,
    ownerName,
    reminderType,
    dueDate,
    message,
    generadoPorIA,
    scheduledAt: new Date().toISOString(),
    status: 'scheduled_external_api'
  };

  let backendResponse = null;
  try {
    const resp = await fetch(`${API_BASE}/reminders/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (resp.ok) {
      backendResponse = await resp.json();
    }
  } catch {
    // Modo offline resiliente
  }

  const current = getStoredReminders();
  current.unshift({
    ...payload,
    messageId: backendResponse?.messageId || payload.messageId,
    provider: backendResponse?.provider || 'Huellas Gateway Local',
  });
  localStorage.setItem('huellas_reminders', JSON.stringify(current.slice(0, 30)));

  return {
    success: true,
    data: { ...payload, ...(backendResponse || {}) },
    directLink: generateWhatsAppLink(ownerPhone, message)
  };
}

export function getStoredReminders() {
  try {
    const raw = localStorage.getItem('huellas_reminders');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function generateSmartReminderAI(params) {
  return apiFetch('/ia/recordatorio-inteligente', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function generateClinicalSummaryAI(params) {
  return apiFetch('/ia/resumen-clinico', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function fetchPredictiveAlertsAI() {
  return apiFetch('/ia/alertas-predictivas');
}

export function askEmergencyAssistantAI(params) {
  return apiFetch('/ia/asistente-emergencia', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function sendAutoBatchMessages(params) {
  return apiFetch('/mensajeria/enviar-automatico', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function sendDirectMessageDB(params) {
  return apiFetch('/mensajeria/enviar', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function fetchRegisteredNumbersDB() {
  return apiFetch('/mensajeria/numeros');
}

export function fetchRemindersDB(correo = '') {
  const qs = correo ? `?correo=${encodeURIComponent(correo)}` : '';
  return apiFetch(`/mensajeria/recordatorios${qs}`);
}

export function fetchMessagingHistoryDB() {
  return apiFetch('/mensajeria/historial');
}
