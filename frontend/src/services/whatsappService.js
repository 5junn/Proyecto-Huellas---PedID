// src/services/whatsappService.js
import { apiFetch } from './apiClient';

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
    authenticated: false,
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
