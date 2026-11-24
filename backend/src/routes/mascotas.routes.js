const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. GET: Obtener todas las mascotas con su raza normalizada asociada
router.get('/', (req, res) => {
  const query = `
    SELECT 
      m.*,
      COALESCE(r.nombre_raza, m.raza, 'Mestizo') AS raza_nombre,
      p.nombres AS propietario_nombre,
      p.telefono AS propietario_telefono
    FROM mascotas m
    LEFT JOIN razas r ON m.id_raza = r.id_raza
    LEFT JOIN propietarios p ON m.id_propietario = p.id_propietario
    ORDER BY m.id_mascota DESC
  `;
  db.query(query, (err, resultados) => {
    if (err) {
      console.error('Error al consultar mascotas:', err);
      return res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
    }
    res.json(resultados);
  });
});

// 2. POST: Registrar una nueva mascota vinculada a su raza normalizada
router.post('/', (req, res) => {
  const {
    id_propietario,
    id_raza,
    codigo_qr,
    microchip,
    nombre,
    especie,
    raza,
    sexo,
    fecha_nacimiento,
    peso_actual,
    color,
    foto_url,
    alergias
  } = req.body;

  const query = `
    INSERT INTO mascotas (
      id_propietario, id_raza, codigo_qr, microchip, nombre, 
      especie, raza, sexo, fecha_nacimiento, peso_actual, 
      color, foto_url, alergias, estado
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo')
  `;

  const values = [
    id_propietario || 1,
    id_raza || null,
    codigo_qr || ('HP-' + Math.floor(1000 + Math.random() * 9000)),
    microchip || null,
    nombre,
    especie || 'Canino',
    raza || null,
    sexo || 'Macho',
    fecha_nacimiento || null,
    peso_actual || null,
    color || null,
    foto_url || null,
    alergias || null
  ];

  db.query(query, values, (err, resultado) => {
    if (err) {
      console.error('Error al registrar la mascota:', err);
      return res.status(500).json({ error: 'Error al guardar en la base de datos', detalles: err.message });
    }
    res.status(201).json({ 
      mensaje: '¡Mascota registrada exitosamente!', 
      id_mascota: resultado.insertId 
    });
  });
});

module.exports = router;
