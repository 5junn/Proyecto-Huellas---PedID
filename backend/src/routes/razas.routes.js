const express = require('express');
const router = express.Router();
const db = require('../db');

// Catálogo base de respaldo si la base de datos no está inicializada aún
const RAZAS_CATALOGO = [
  { id_raza: 1, nombre_raza: 'Beagle', especie: 'Canino' },
  { id_raza: 2, nombre_raza: 'Golden Retriever', especie: 'Canino' },
  { id_raza: 3, nombre_raza: 'Labrador Retriever', especie: 'Canino' },
  { id_raza: 4, nombre_raza: 'Bulldog Francés', especie: 'Canino' },
  { id_raza: 5, nombre_raza: 'Bulldog Inglés', especie: 'Canino' },
  { id_raza: 6, nombre_raza: 'Pastor Alemán', especie: 'Canino' },
  { id_raza: 7, nombre_raza: 'Poodle (Caniche)', especie: 'Canino' },
  { id_raza: 8, nombre_raza: 'Pug (Carlino)', especie: 'Canino' },
  { id_raza: 9, nombre_raza: 'Chihuahua', especie: 'Canino' },
  { id_raza: 10, nombre_raza: 'Husky Siberiano', especie: 'Canino' },
  { id_raza: 11, nombre_raza: 'Schnauzer Miniatura', especie: 'Canino' },
  { id_raza: 12, nombre_raza: 'Mestizo / Criollo Canino', especie: 'Canino' },
  { id_raza: 13, nombre_raza: 'Siamés', especie: 'Felino' },
  { id_raza: 14, nombre_raza: 'Persa', especie: 'Felino' },
  { id_raza: 15, nombre_raza: 'Bengala', especie: 'Felino' },
  { id_raza: 16, nombre_raza: 'Maine Coon', especie: 'Felino' },
  { id_raza: 17, nombre_raza: 'Mestizo / Común Europeo', especie: 'Felino' },
  { id_raza: 18, nombre_raza: 'Enano Holandés', especie: 'Conejo' },
  { id_raza: 19, nombre_raza: 'Belier / Mini Lop', especie: 'Conejo' },
  { id_raza: 20, nombre_raza: 'Periquito Australiano', especie: 'Ave' },
  { id_raza: 21, nombre_raza: 'Ninfa / Carolina', especie: 'Ave' },
  { id_raza: 22, nombre_raza: 'Cobayo / Cuy Peruano', especie: 'Otro' },
];

// 1. GET: Listar razas normalizadas (con filtro opcional ?especie=Canino)
router.get('/', (req, res) => {
  const { especie } = req.query;

  let query = 'SELECT * FROM razas';
  const params = [];

  if (especie) {
    query += ' WHERE especie = ? OR especie LIKE ?';
    params.push(especie, `%${especie}%`);
  }
  query += ' ORDER BY nombre_raza ASC';

  db.query(query, params, (err, resultados) => {
    if (err) {
      // Fallback elegante en caso MySQL no tenga la tabla importada aún
      let filtered = RAZAS_CATALOGO;
      if (especie) {
        filtered = RAZAS_CATALOGO.filter((r) =>
          r.especie.toLowerCase().includes(especie.toLowerCase())
        );
      }
      return res.json({
        fuente: 'catalogo_local_reserva',
        razas: filtered
      });
    }

    res.json({
      fuente: 'base_de_datos_mysql',
      total: resultados.length,
      razas: resultados
    });
  });
});

// 2. POST: Agregar una nueva raza normalizada (para administradores)
router.post('/', (req, res) => {
  const { nombre_raza, especie, descripcion } = req.body;
  if (!nombre_raza || !especie) {
    return res.status(400).json({ error: 'Se requiere nombre_raza y especie' });
  }

  const query = 'INSERT INTO razas (nombre_raza, especie, descripcion) VALUES (?, ?, ?)';
  db.query(query, [nombre_raza, especie, descripcion || null], (err, resultado) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'La raza ya se encuentra registrada en la base de datos' });
      }
      return res.status(500).json({ error: 'Error al registrar raza', detalles: err.message });
    }
    res.status(201).json({
      mensaje: 'Raza normalizada registrada exitosamente',
      id_raza: resultado.insertId,
      nombre_raza,
      especie
    });
  });
});

module.exports = router;
