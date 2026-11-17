const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. GET: Obtener todas las mascotas
router.get('/', (req, res) => {
  const query = 'SELECT * FROM mascotas';
  db.query(query, (err, resultados) => {
    if (err) {
      console.error('Error al consultar mascotas:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(resultados);
  });
});

// 2. POST: Registrar una nueva mascota
router.post('/', (req, res) => {
  const { id_propietario, id_raza, codigo_historia, nombre, sexo, fecha_nacimiento, peso_actual } = req.body;

  const query = `
    INSERT INTO mascotas (id_propietario, id_raza, codigo_historia, nombre, sexo, fecha_nacimiento, peso_actual, estado) 
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')
  `;

  const values = [id_propietario, id_raza, codigo_historia, nombre, sexo, fecha_nacimiento, peso_actual];

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