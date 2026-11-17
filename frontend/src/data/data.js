// src/data/data.js

export const KPIS = [
  { id: 'mascotas', label: 'Pacientes registrados', value: '1,284', delta: '+4.2% este mes', good: true, tone: 'emerald', icon: 'paw', trend: [40, 44, 43, 50, 52, 58, 61, 66] },
  { id: 'consultas', label: 'Consultas atendidas', value: '326', delta: '+12% vs mes ant.', good: true, tone: 'amber', icon: 'clipboard', trend: [20, 26, 24, 31, 29, 36, 40, 44] },
  { id: 'vacunas', label: 'Vacunas por vencer', value: '14', delta: '3 menos que ayer', good: true, tone: 'rose', icon: 'shield', trend: [22, 20, 21, 19, 18, 17, 17, 14] },
  { id: 'propietarios', label: 'Propietarios activos', value: '842', delta: '+2.1% nuevos', good: true, tone: 'indigo', icon: 'users', trend: [30, 31, 35, 34, 38, 40, 43, 45] },
];

export const WEEK = { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], data: [18, 24, 21, 29, 26, 14, 8] };
export const MONTH = { labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'], data: [96, 104, 99, 112, 121, 118, 131, 126] };

export const SPECIES = [
  { name: 'Caninos', value: 64, color: '#10B981' },
  { name: 'Felinos', value: 29, color: '#F59E0B' },
  { name: 'Exóticos / Otros', value: 7, color: '#6366F1' },
];

export const MASCOTAS_CLINICA = [
  { id: 'M-101', nombre: 'Toby', especie: 'Canino', raza: 'Beagle', sexo: 'Macho', edad: '3 años', peso: '12.4 kg', propietario: 'Jorge Salas', codigoQR: 'HP-4092', estado: 'Activo', chip: '981098124' },
  { id: 'M-102', nombre: 'Luna', especie: 'Felino', raza: 'Siamés', sexo: 'Hembra', edad: '1 año y medio', peso: '3.8 kg', propietario: 'Lucía Paredes', codigoQR: 'HP-8813', estado: 'Activo', chip: '981098451' },
  { id: 'M-103', nombre: 'Max', especie: 'Canino', raza: 'Golden Retriever', sexo: 'Macho', edad: '4 años', peso: '29.2 kg', propietario: 'Carla Mendoza', codigoQR: 'HP-1294', estado: 'Activo', chip: '981098772' },
  { id: 'M-104', nombre: 'Coco', especie: 'Canino', raza: 'Poodle Toy', sexo: 'Hembra', edad: '2 años', peso: '4.5 kg', propietario: 'Andrés Quispe', codigoQR: 'HP-5521', estado: 'Activo', chip: '981098991' },
  { id: 'M-105', nombre: 'Mishi', especie: 'Felino', raza: 'Común Europeo', sexo: 'Macho', edad: '2 años', peso: '4.1 kg', propietario: 'Diego Ramos', codigoQR: 'HP-7712', estado: 'Activo', chip: '981099002' },
  { id: 'M-106', nombre: 'Rocky', especie: 'Canino', raza: 'Bulldog Francés', sexo: 'Macho', edad: '5 años', peso: '13.8 kg', propietario: 'Valeria Núñez', codigoQR: 'HP-3341', estado: 'En Observación', chip: '981099115' },
];

export const CONSULTS = [
  { id: 'C-01', pet: 'Max', breed: 'Golden Retriever', owner: 'Carla Mendoza', reason: 'Control Anual & Desparasitación', vet: 'Dra. Ana Torres', time: '09:30', status: 'done', diagnostico: 'Paciente en excelente condición física. Vacunación al día.' },
  { id: 'C-02', pet: 'Coco', breed: 'Poodle Toy', owner: 'Andrés Quispe', reason: 'Aplicación Refuerzo Vacunal', vet: 'Dr. Luis Vega', time: '10:15', status: 'done', diagnostico: 'Séxtuple canina aplicada sin complicaciones.' },
  { id: 'C-03', pet: 'Rocky', breed: 'Bulldog Francés', owner: 'Valeria Núñez', reason: 'Dermatitis Alérgica y Control', vet: 'Dra. Ana Torres', time: '11:00', status: 'progress', diagnostico: 'Lesión dérmica en flanco derecho. Prescrito baño medicado.' },
  { id: 'C-04', pet: 'Mishi', breed: 'Común Europeo', owner: 'Diego Ramos', reason: 'Vacunación Triple Felina', vet: 'Dr. Luis Vega', time: '11:40', status: 'waiting', diagnostico: 'En espera en sala 2.' },
  { id: 'C-05', pet: 'Toby', breed: 'Beagle', owner: 'Jorge Salas', reason: 'Revisión Otitis Externa', vet: 'Dra. Ana Torres', time: '12:20', status: 'waiting', diagnostico: 'Pendiente de pasar a triaje.' },
];

export const VACCINES = [
  { id: 'V-201', pet: 'Luna', owner: 'Lucía Paredes', vaccine: 'Antirrábica Rabisin', lote: 'LT-8821', applied: '14 Oct 2026', expire: 'Hoy', status: 'por-vencer', vet: 'Dra. Ana Torres' },
  { id: 'V-202', pet: 'Toby', owner: 'Jorge Salas', vaccine: 'Sextuple Vanguard Plus', lote: 'LT-4412', applied: '20 Ago 2026', expire: 'Mañana', status: 'por-vencer', vet: 'Dra. Ana Torres' },
  { id: 'V-203', pet: 'Mishi', owner: 'Diego Ramos', vaccine: 'Triple Felina Felocell', lote: 'LT-9031', applied: '10 Sep 2026', expire: 'En 3 días', status: 'al-dia', vet: 'Dr. Luis Vega' },
  { id: 'V-204', pet: 'Rocky', owner: 'Valeria Núñez', vaccine: 'Parvovirus Nobivac', lote: 'LT-1109', applied: '15 Jul 2026', expire: 'En 5 días', status: 'al-dia', vet: 'Dra. Ana Torres' },
  { id: 'V-205', pet: 'Coco', owner: 'Andrés Quispe', vaccine: 'KC Bronchicine', lote: 'LT-7734', applied: '05 Jun 2026', expire: 'En 9 días', status: 'al-dia', vet: 'Dr. Luis Vega' },
];

export const PROPIETARIOS_CLINICA = [
  { id: 'P-01', nombres: 'Jorge Salas Méndez', dni: '44521098', telefono: '987 654 321', correo: 'jorge.salas@gmail.com', direccion: 'Av. Larco 450, Miraflores', mascotas: ['Toby (Beagle)'] },
  { id: 'P-02', nombres: 'Lucía Paredes Torres', dni: '72345678', telefono: '976 543 210', correo: 'lucia.paredes@gmail.com', direccion: 'Calle Las Acacias 120, Surco', mascotas: ['Luna (Siamés)'] },
  { id: 'P-03', nombres: 'Carla Mendoza Vidal', dni: '40981245', telefono: '965 432 109', correo: 'carla.mendoza@yahoo.com', direccion: 'Av. Primavera 890, Surco', mascotas: ['Max (Golden)'] },
  { id: 'P-04', nombres: 'Andrés Quispe Castro', dni: '48123901', telefono: '954 321 098', correo: 'andres.quispe@hotmail.com', direccion: 'Jr. Monterrico 234, La Molina', mascotas: ['Coco (Poodle)'] },
  { id: 'P-05', nombres: 'Valeria Núñez Rivas', dni: '71902451', telefono: '943 210 987', correo: 'valeria.nunez@gmail.com', direccion: 'Av. El Sol 1102, Chorrillos', mascotas: ['Rocky (Bulldog)'] },
];

export const USUARIOS_STAFF = [
  { id: 'U-01', nombres: 'Dra. Ana Torres Paredes', correo: 'veterinario@huellas.com', rol: 'Veterinario', especialidad: 'Medicina General & Cirugía', turno: 'Mañana (8:00 - 14:00)', estado: 'activo' },
  { id: 'U-02', nombres: 'Dr. Luis Vega Morales', correo: 'luis.vega@huellas.com', rol: 'Veterinario', especialidad: 'Medicina Felina & Vacunación', turno: 'Tarde (14:00 - 20:00)', estado: 'activo' },
  { id: 'U-03', nombres: 'Carlos Mendoza Rios', correo: 'recepcion@huellas.com', rol: 'Recepcionista', especialidad: 'Admisión & Fichas QR', turno: 'Completo (8:00 - 17:00)', estado: 'activo' },
  { id: 'U-04', nombres: 'María Silva Soto', correo: 'maria.silva@huellas.com', rol: 'Recepcionista', especialidad: 'Agenda & Contacto Clientes', turno: 'Rotativo', estado: 'activo' },
  { id: 'U-05', nombres: 'Administrador General', correo: 'admin@huellas.com', rol: 'Administrador', especialidad: 'Gestión Integral Huellas PetID', turno: 'Permanente', estado: 'activo' },
];

export const RECORDATORIOS_CLINICA = [
  { id: 'R-01', pet: 'Toby', owner: 'Jorge Salas', canal: 'WhatsApp', asunto: 'Recordatorio Refuerzo Séxtuple', programado: 'Mañana 08:30', estado: 'Programado' },
  { id: 'R-02', pet: 'Luna', owner: 'Lucía Paredes', canal: 'SMS', asunto: 'Aviso Vencimiento Antirrábica', programado: 'Hoy 16:00', estado: 'Enviado' },
  { id: 'R-03', pet: 'Rocky', owner: 'Valeria Núñez', canal: 'WhatsApp', asunto: 'Revisión Dermatológica', programado: 'En 3 días', estado: 'Programado' },
];

export const ACTIVITY = [
  { icon: 'clipboard', tone: 'emerald', text: 'Consulta registrada para Max', by: 'Dra. Ana Torres', time: 'Hace 8 min' },
  { icon: 'shield', tone: 'rose', text: 'Vacuna aplicada a Coco', by: 'Dr. Luis Vega', time: 'Hace 25 min' },
  { icon: 'users', tone: 'amber', text: 'Nuevo propietario: Valeria Núñez', by: 'Recepción', time: 'Hace 1 h' },
  { icon: 'qr', tone: 'indigo', text: 'Código QR escaneado: Toby #HP-4092', by: 'Sistema Huellas', time: 'Hace 2 h' },
  { icon: 'bell', tone: 'emerald', text: 'Recordatorios enviados a 6 propietarios', by: 'Sistema', time: 'Hace 3 h' },
];
