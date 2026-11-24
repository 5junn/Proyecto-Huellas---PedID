// src/data/razasData.js
/**
 * Catálogo Oficial y Normalizado de Razas - Clínica Veterinaria Huellas PetID
 * Permite selección estandarizada evitando errores tipográficos y de mayúsculas/minúsculas.
 */

export const RAZAS_POR_ESPECIE = {
  'Canino': [
    'Beagle',
    'Golden Retriever',
    'Labrador Retriever',
    'Bulldog Francés',
    'Bulldog Inglés',
    'Pastor Alemán',
    'Poodle (Caniche)',
    'Pug (Carlino)',
    'Chihuahua',
    'Boxer',
    'Husky Siberiano',
    'Schnauzer Miniatura',
    'Schnauzer Estándar',
    'Rottweiler',
    'Dálmata',
    'Cocker Spaniel',
    'Shih Tzu',
    'Yorkshire Terrier',
    'Doberman',
    'Border Collie',
    'San Bernardo',
    'Pitbull Terrier',
    'Mestizo / Criollo Canino',
    'Otra Raza Canina'
  ],
  'Canino (Perro)': [
    'Beagle',
    'Golden Retriever',
    'Labrador Retriever',
    'Bulldog Francés',
    'Bulldog Inglés',
    'Pastor Alemán',
    'Poodle (Caniche)',
    'Pug (Carlino)',
    'Chihuahua',
    'Boxer',
    'Husky Siberiano',
    'Schnauzer Miniatura',
    'Schnauzer Estándar',
    'Rottweiler',
    'Dálmata',
    'Cocker Spaniel',
    'Shih Tzu',
    'Yorkshire Terrier',
    'Doberman',
    'Border Collie',
    'San Bernardo',
    'Pitbull Terrier',
    'Mestizo / Criollo Canino',
    'Otra Raza Canina'
  ],
  'Felino': [
    'Siamés',
    'Persa',
    'Bengala',
    'Maine Coon',
    'Angora Turco',
    'Ragdoll',
    'Sphynx (Sin Pelo)',
    'Azul Ruso',
    'British Shorthair',
    'American Shorthair',
    'Scottish Fold',
    'Abisinio',
    'Mestizo / Común Europeo',
    'Otra Raza Felina'
  ],
  'Felino (Gato)': [
    'Siamés',
    'Persa',
    'Bengala',
    'Maine Coon',
    'Angora Turco',
    'Ragdoll',
    'Sphynx (Sin Pelo)',
    'Azul Ruso',
    'British Shorthair',
    'American Shorthair',
    'Scottish Fold',
    'Abisinio',
    'Mestizo / Común Europeo',
    'Otra Raza Felina'
  ],
  'Conejo': [
    'Enano Holandés',
    'Belier / Mini Lop',
    'Cabeza de León',
    'Angora Inglés',
    'Gigante de Flandes',
    'Rex',
    'Mestizo / Criollo',
    'Otro'
  ],
  'Ave': [
    'Periquito Australiano',
    'Ninfa / Carolina',
    'Canario',
    'Agapornis (Inseparable)',
    'Loro Cabeza Roja',
    'Cacatúa',
    'Otro'
  ],
  'Otro': [
    'Hámster Sirio / Ruso',
    'Cobayo / Cuy Peruano',
    'Hurón Doméstico',
    'Erizo Pigmeo Africano',
    'Chinchilla',
    'Otro'
  ]
};

/**
 * Obtiene la lista de razas según la especie seleccionada
 */
export function getRazasPorEspecie(especie = 'Canino') {
  if (RAZAS_POR_ESPECIE[especie]) {
    return RAZAS_POR_ESPECIE[especie];
  }
  // Normalizar búsqueda parcial
  const normal = especie.toLowerCase();
  if (normal.includes('can') || normal.includes('perro')) {
    return RAZAS_POR_ESPECIE['Canino'];
  }
  if (normal.includes('fel') || normal.includes('gato')) {
    return RAZAS_POR_ESPECIE['Felino'];
  }
  if (normal.includes('conejo')) {
    return RAZAS_POR_ESPECIE['Conejo'];
  }
  if (normal.includes('ave')) {
    return RAZAS_POR_ESPECIE['Ave'];
  }
  return RAZAS_POR_ESPECIE['Otro'];
}
