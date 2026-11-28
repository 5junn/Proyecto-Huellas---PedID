const test = require('node:test');
const assert = require('node:assert/strict');

const {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  normalizePhone,
  isValidEmail,
} = require('../src/utils/security');

const {
  generateSmartReminder,
  generateClinicalSummary,
  generatePredictiveAlerts,
  generateEmergencyGuidance,
} = require('../src/services/aiService');

test('Las fechas del carnet distinguen un refuerzo para hoy de uno vencido', () => {
  const { daysBetween, validDay, vaccineStatus } = require('../src/utils/clinicDates');
  assert.equal(validDay('2026-02-30'), false);
  assert.equal(validDay('2028-02-29'), true);
  const today = '2026-11-28';
  assert.equal(vaccineStatus(daysBetween(today, today)), 'por-vencer');
  assert.equal(vaccineStatus(daysBetween(today, '2026-11-27')), 'vencida');
  assert.equal(vaccineStatus(daysBetween(today, '2026-12-13')), 'por-vencer');
  assert.equal(vaccineStatus(daysBetween(today, '2026-12-14')), 'al-dia');
});

test('Seguridad: hashPassword y verifyPassword funcionan correctamente', () => {
  const hash = hashPassword('ClaveSegura2026!');
  assert.ok(hash.startsWith('scrypt:'));
  assert.equal(verifyPassword('ClaveSegura2026!', hash), true);
  assert.equal(verifyPassword('otraClave', hash), false);
});

test('Seguridad: signToken y verifyToken validan firma e integridad', () => {
  const token = signToken({ id: 7, rol: 'Veterinario', correo: 'vet@huellas.com' }, 3600);
  const decoded = verifyToken(token);
  assert.equal(decoded.id, 7);
  assert.equal(decoded.rol, 'Veterinario');

  const tampered = token.slice(0, -4) + 'XXXX';
  assert.equal(verifyToken(tampered), null);
});

test('Normalización de teléfonos peruanos y validación de correos', () => {
  assert.equal(normalizePhone('987 654 321'), '51987654321');
  assert.equal(normalizePhone('+51 976-543-210'), '51976543210');
  assert.equal(isValidEmail('propietario@huellas.com'), true);
  assert.equal(isValidEmail('correo-invalido'), false);
});

test('IA 1 - Recordatorios Inteligentes: redacta mensajes personalizados para WhatsApp y Correo', async () => {
  const wa = await generateSmartReminder({
    petName: 'Toby',
    species: 'Canino',
    breed: 'Beagle',
    ownerName: 'Jorge Salas',
    vaccineName: 'Séxtuple Canina',
    dueDate: '20 Nov 2026',
    daysRemaining: 2,
    allergies: 'Alergia a penicilina',
    channel: 'WhatsApp',
  });
  assert.equal(wa.canal, 'WhatsApp');
  assert.match(wa.mensaje, /Toby/);
  assert.match(wa.mensaje, /Séxtuple Canina/);

  const email = await generateSmartReminder({
    petName: 'Luna',
    species: 'Felino',
    breed: 'Siamés',
    ownerName: 'Lucía Paredes',
    vaccineName: 'Triple Felina',
    dueDate: '10 Sep 2027',
    channel: 'Correo',
  });
  assert.equal(email.canal, 'Correo');
  assert.match(email.asunto, /Luna/);
});

test('IA 2 - Resumen del Historial Clínico: sintetiza alergias, consultas y genera borrador editable', async () => {
  const res = await generateClinicalSummary({
    pet: {
      nombre: 'Toby',
      especie: 'Canino',
      raza: 'Beagle',
      peso_actual: 12.4,
      alergias: 'Alergia severa a pulgas. No penicilina.',
    },
    consultations: [
      { motivo_consulta: 'Otitis externa', diagnostico: 'Inflamación derecha', tratamiento_receta: 'Otovier gotas' },
    ],
    vaccines: [{ vacuna: 'Séxtuple Canina', estado_dosis: 'por-vencer' }],
    weights: [
      { peso_kg: 12.4, registrado_en: '2026-11-20' },
      { peso_kg: 14.1, registrado_en: '2026-09-20' },
    ],
    currentReason: 'Control dermatológico',
  });

  assert.match(res.alertas_alergias, /penicilina/i);
  assert.match(res.borrador_diagnostico, /Toby/);
  assert.ok(res.indicaciones_sugeridas.length > 20);
});

test('IA 3 - Alertas Predictivas: detecta vacunas por vencer, falta de controles y cambios de peso', async () => {
  const soon = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
  const oldDate = new Date(Date.now() - 240 * 86400000).toISOString();

  const report = await generatePredictiveAlerts({
    pets: [
      { id_mascota: 1, nombre: 'Toby', codigo_qr: 'HP-4092', propietario_nombre: 'Jorge' },
      { id_mascota: 2, nombre: 'Luna', codigo_qr: 'HP-8813', propietario_nombre: 'Lucía' },
    ],
    vaccines: [
      { id_mascota: 1, mascota_nombre: 'Toby', propietario_nombre: 'Jorge', vacuna: 'Séxtuple', fecha_proximo_refuerzo: soon },
    ],
    consultations: [{ id_mascota: 1, fecha_hora: oldDate }],
    weights: [
      { id_mascota: 1, peso_kg: 14.5, registrado_en: '2026-08-01' },
      { id_mascota: 1, peso_kg: 12.0, registrado_en: '2026-11-20' },
    ],
  });

  assert.equal(report.indicadores_preventivos.vacunas_por_vencer_count, 1);
  assert.equal(report.indicadores_preventivos.pacientes_sin_control_count, 2);
  assert.equal(report.indicadores_preventivos.cambios_peso_count, 1);
  assert.equal(report.nivel_riesgo, 'Alto');
});

test('IA 4 - Asistente de Emergencia: protege privacidad en modo control y activa rescate en modo perdida', async () => {
  const normal = await generateEmergencyGuidance({
    pet: { nombre: 'Luna', especie: 'Felino', raza: 'Siamés', alergias: 'Ninguna' },
    isLost: false,
    question: 'Cuál es el teléfono o dirección de su casa?',
  });
  assert.equal(normal.modo_mascota_perdida, false);
  assert.match(normal.privacidad_aplicada, /29733/);
  const clinicPhone = process.env.CLINIC_PHONE?.trim();
  assert.equal(normal.boton_llamada_clinica?.numero ?? null, clinicPhone || null);

  const lost = await generateEmergencyGuidance({
    pet: { nombre: 'Toby', especie: 'Canino', raza: 'Beagle', alergias: 'No penicilina' },
    isLost: true,
    question: 'Lo encontré herido en el parque',
  });
  assert.equal(lost.modo_mascota_perdida, true);
  assert.ok(lost.pasos_inmediatos.length >= 3);
});
