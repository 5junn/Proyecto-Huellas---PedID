// src/data/vacunasData.js
/**
 * Catálogo Clínico Oficial de Vacunas y Tratamientos por Especie
 * Clínica Veterinaria Huellas PetID
 */

export const VACUNAS_POR_ESPECIE = {
  'Canino': [
    'Vacuna Séxtuple Canina & Antirrábica',
    'Vacuna Quíntuple Canina (DHPPi)',
    'Vacuna contra Parvovirus y Coronavirus Canino',
    'Vacuna contra Tos de las Perreras (KC Bronchicine)',
    'Desparasitación Interna y Externa Canina'
  ],
  'Felino': [
    'Triple Felina (Panleucopenia, Rinotraqueítis y Calicivirus)',
    'Vacuna Antirrábica Felina (Rabisin)',
    'Vacuna contra Leucemia Viral Felina (FeLV)',
    'Desparasitación Interna y Pipeta Antipulgas Felina'
  ],
  'Conejo': [
    'Vacuna Mixomatosis y Enfermedad Hemorrágica Vírica (RHD-1/RHD-2)',
    'Desparasitación Preventiva para Lagomorfos'
  ],
  'Ave': [
    'Vacuna contra Enfermedad de Newcastle & Vitaminización',
    'Control Antiparasitario Especializado para Aves'
  ],
  'Otro': [
    'Control Preventivo Integral & Desparasitación de Exóticos'
  ]
};

export function getVacunaSugerida(especie = 'Canino') {
  const norm = especie.toLowerCase();
  if (norm.includes('fel') || norm.includes('gato')) {
    return 'Triple Felina (Panleucopenia, Rinotraqueítis y Calicivirus)';
  }
  if (norm.includes('conejo')) {
    return 'Vacuna Mixomatosis y Enfermedad Hemorrágica Vírica (RHD-1/RHD-2)';
  }
  if (norm.includes('ave')) {
    return 'Vacuna contra Enfermedad de Newcastle & Vitaminización';
  }
  if (norm.includes('otro') || norm.includes('cuy') || norm.includes('cobayo') || norm.includes('hur')) {
    return 'Control Preventivo Integral & Desparasitación de Exóticos';
  }
  return 'Vacuna Séxtuple Canina & Antirrábica';
}

export function getListaVacunasPorEspecie(especie = 'Canino') {
  const norm = especie.toLowerCase();
  if (norm.includes('fel') || norm.includes('gato')) {
    return VACUNAS_POR_ESPECIE['Felino'];
  }
  if (norm.includes('conejo')) {
    return VACUNAS_POR_ESPECIE['Conejo'];
  }
  if (norm.includes('ave')) {
    return VACUNAS_POR_ESPECIE['Ave'];
  }
  if (norm.includes('otro')) {
    return VACUNAS_POR_ESPECIE['Otro'];
  }
  return VACUNAS_POR_ESPECIE['Canino'];
}
