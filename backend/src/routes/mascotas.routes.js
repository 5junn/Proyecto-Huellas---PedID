const express = require('express');
const router = express.Router();
const db = require('../db');
const { normalizePhone, sanitizeText } = require('../utils/security');
const { sendLostPetAlert } = require('../services/messagingService');
const { generateSmartReminder } = require('../services/aiService');

function mapSpeciesToDb(especie) {
  const s = String(especie || '').toLowerCase();
  if (s.includes('fel') || s.includes('gato')) return 'Felino';
  if (s.includes('conejo')) return 'Conejo';
  if (s.includes('ave')) return 'Ave';
  if (s.includes('otro')) return 'Otro';
  return 'Canino';
}

function parseWeightKg(peso) {
  if (peso === null || peso === undefined || peso === '') return null;
  const num = parseFloat(String(peso).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * 1. GET /api/mascotas
 * Obtiene todas las mascotas con su propietario, raza y vacunas del carnet.
 */
router.get('/', async (req, res) => {
  try {
    const correoFilter = sanitizeText(req.query.correo, 120).toLowerCase();
    const especieFilter = sanitizeText(req.query.especie, 40);
    const propIdFilter = req.query.propietarioId ? Number(req.query.propietarioId) : null;

    let sql = `
      SELECT
        m.*,
        COALESCE(r.nombre_raza, m.raza, 'Mestizo') AS raza_nombre,
        p.nombres AS propietario_nombre,
        p.telefono AS propietario_telefono,
        p.correo AS propietario_correo,
        p.direccion AS propietario_direccion
      FROM mascotas m
      LEFT JOIN razas r ON m.id_raza = r.id_raza
      LEFT JOIN propietarios p ON m.id_propietario = p.id_propietario
      WHERE 1=1
    `;
    const params = [];

    if (correoFilter) {
      sql += ' AND LOWER(p.correo) = ?';
      params.push(correoFilter);
    }
    if (propIdFilter) {
      sql += ' AND m.id_propietario = ?';
      params.push(propIdFilter);
    }
    if (especieFilter && especieFilter !== 'all') {
      sql += ' AND m.especie = ?';
      params.push(mapSpeciesToDb(especieFilter));
    }

    sql += ' ORDER BY m.id_mascota DESC';

    const [mascotas] = await db.queryAsync(sql, params);
    const [vacunas] = await db.queryAsync(
      `SELECT * FROM carnet_vacunacion ORDER BY fecha_aplicacion DESC, id_vacunacion DESC`
    );

    const vacunasByPet = new Map();
    for (const v of vacunas) {
      if (!vacunasByPet.has(v.id_mascota)) vacunasByPet.set(v.id_mascota, []);
      vacunasByPet.get(v.id_mascota).push({
        id_vacunacion: v.id_vacunacion,
        nombre: v.vacuna,
        lote: v.lote_fabricante,
        fecha: v.fecha_aplicacion
          ? new Date(v.fecha_aplicacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Registrada',
        proxima: v.fecha_proximo_refuerzo
          ? new Date(v.fecha_proximo_refuerzo).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Anual',
        fecha_proximo_refuerzo: v.fecha_proximo_refuerzo,
        estado: v.estado_dosis === 'por-vencer' ? 'Por Vencer' : v.estado_dosis === 'vencida' ? 'Vencida' : 'Vigente',
        estado_dosis: v.estado_dosis,
        vet: v.veterinario_nombre || 'Equipo Clínica Huellas',
      });
    }

    const enriched = mascotas.map((m) => ({
      ...m,
      id: m.codigo_qr || `hp-${m.id_mascota}`,
      codigoQR: m.codigo_qr,
      raza: m.raza_nombre || m.raza,
      peso: m.peso_actual ? `${m.peso_actual} kg` : 'N/A',
      foto: m.foto_url,
      propietario: m.propietario_nombre,
      telefono: m.propietario_telefono,
      correo: m.propietario_correo,
      direccion: m.propietario_direccion,
      estadoExtravio: Boolean(m.modo_extraviado),
      chip: m.microchip,
      vacunas: vacunasByPet.get(m.id_mascota) || [],
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Error al consultar mascotas:', err);
    res.status(500).json({ error: 'Error en el servidor', detalles: err.message });
  }
});

/**
 * 2. GET /api/mascotas/alertas-gps
 * Lista las alertas de rescate GPS almacenadas en MySQL.
 */
router.get('/alertas-gps', async (req, res) => {
  try {
    const [rows] = await db.queryAsync(
      `SELECT a.*, m.nombre AS nombreMascota, m.especie, m.raza, p.nombres AS propietario, p.telefono
       FROM alertas_rescate_gps a
       INNER JOIN mascotas m ON a.id_mascota = m.id_mascota
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
       WHERE a.estado = 'activa'
       ORDER BY a.id_alerta DESC`
    );

    const formatted = rows.map((r) => ({
      id: r.id_alerta,
      id_alerta: r.id_alerta,
      id_mascota: r.id_mascota,
      codigoMascota: r.codigo_qr,
      nombreMascota: r.nombreMascota,
      especie: r.especie,
      raza: r.raza,
      propietario: r.propietario,
      telefono: r.telefono,
      lat: Number(r.latitud),
      lng: Number(r.longitud),
      precision: `${r.precision_metros || 15} metros`,
      mapsUrl: r.maps_url,
      mensaje_rescatista: r.mensaje_rescatista,
      fechaCompleta: new Date(r.creado_en).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      estado: r.estado,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error obteniendo alertas GPS:', err);
    res.status(500).json({ error: 'Error al obtener alertas GPS' });
  }
});

/**
 * 3. PATCH /api/mascotas/alertas-gps/:id/resolver
 */
router.patch('/alertas-gps/:id/resolver', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de alerta inválido' });
    await db.queryAsync("UPDATE alertas_rescate_gps SET estado = 'resuelta' WHERE id_alerta = ?", [id]);
    res.json({ success: true, id_alerta: id, estado: 'resuelta' });
  } catch (err) {
    console.error('Error resolviendo alerta GPS:', err);
    res.status(500).json({ error: 'Error al resolver alerta GPS' });
  }
});

/**
 * 4. GET /api/mascotas/:codigo
 * Ficha pública QR respetando Ley N° 29733 (privacidad del dueño en modo habitual vs modo mascota perdida).
 */
router.get('/:codigo', async (req, res) => {
  try {
    const codigo = sanitizeText(req.params.codigo, 50).toUpperCase();
    const [rows] = await db.queryAsync(
      `SELECT m.*,
        COALESCE(r.nombre_raza, m.raza, 'Mestizo') AS raza_nombre,
        p.nombres AS propietario_nombre,
        p.telefono AS propietario_telefono,
        p.direccion AS propietario_direccion
       FROM mascotas m
       LEFT JOIN razas r ON m.id_raza = r.id_raza
       LEFT JOIN propietarios p ON m.id_propietario = p.id_propietario
       WHERE UPPER(m.codigo_qr) = ? OR CAST(m.id_mascota AS CHAR) = ?
       LIMIT 1`,
      [codigo, codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const m = rows[0];
    const [vacunas] = await db.queryAsync(
      'SELECT * FROM carnet_vacunacion WHERE id_mascota = ? ORDER BY fecha_aplicacion DESC',
      [m.id_mascota]
    );

    const isLost = Boolean(m.modo_extraviado);
    const fullAddress = m.propietario_direccion || 'Lima, Perú';
    const districtOnly = fullAddress.includes(',') ? fullAddress.split(',').slice(-2).join(',').trim() : fullAddress;

    res.json({
      id_mascota: m.id_mascota,
      id_propietario: m.id_propietario,
      codigo: m.codigo_qr,
      codigoQR: m.codigo_qr,
      nombre: m.nombre,
      especie: m.especie,
      raza: m.raza_nombre,
      edad: m.edad || 'Adulto',
      sexo: m.sexo,
      peso: m.peso_actual ? `${m.peso_actual} kg` : 'N/A',
      color: m.color || 'No especificado',
      foto: m.foto_url,
      alergias: m.alergias || 'Sin alergias médicas reportadas.',
      estadoExtravio: isLost,
      recompensa: isLost ? m.recompensa : null,
      // Privacidad Ley N° 29733: solo exponer teléfono de contacto directo si está en Modo Mascota Perdida
      propietario: m.propietario_nombre,
      telefono: isLost ? m.propietario_telefono : null,
      distrito: districtOnly,
      clinica: process.env.CLINIC_NAME || 'Clínica Veterinaria Huellas',
      dirClinica: process.env.CLINIC_ADDRESS || 'Av. Primavera 1234, Santiago de Surco, Lima',
      telClinica: process.env.CLINIC_PHONE || '+51 987 654 321',
      horarioClinica: 'Lunes a Domingo · Emergencias 24/7',
      vacunas: vacunas.map((v) => ({
        nombre: v.vacuna,
        fecha: new Date(v.fecha_aplicacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
        proxima: new Date(v.fecha_proximo_refuerzo).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
        estado: v.estado_dosis === 'por-vencer' ? 'Por Vencer' : v.estado_dosis === 'vencida' ? 'Vencida' : 'Vigente',
        vet: v.veterinario_nombre || 'Equipo Médico Huellas',
      })),
    });
  } catch (err) {
    console.error('Error consultando ficha QR:', err);
    res.status(500).json({ error: 'Error al obtener ficha QR' });
  }
});

/**
 * 5. POST /api/mascotas
 * Registra mascota, vincula/crea propietario si hace falta, guarda peso inicial,
 * vacuna inicial y programa recordatorio automático en MySQL.
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const nombre = sanitizeText(body.nombre, 80);
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la mascota es obligatorio.' });
    }

    const especieDb = mapSpeciesToDb(body.especie);
    const razaNombre = sanitizeText(body.raza || 'Mestizo', 80);
    const sexo = body.sexo === 'Hembra' ? 'Hembra' : 'Macho';
    const edad = sanitizeText(body.edad || '1 año', 50);
    const pesoNum = parseWeightKg(body.peso_actual ?? body.peso);
    const color = sanitizeText(body.color || 'Varios', 80);
    const fotoUrl = body.foto_url || body.foto || null;
    const alergias = sanitizeText(body.alergias || 'Sin alergias reportadas.', 500);
    const codigoQR = sanitizeText(body.codigo_qr || body.codigoQR || `HP-${Math.floor(1000 + Math.random() * 9000)}`, 50).toUpperCase();
    const microchip = sanitizeText(body.microchip || body.chip || `981${Math.floor(100000 + Math.random() * 900000)}`, 50);

    const ownerName = sanitizeText(body.propietario_nombre || body.propietario || 'Propietario Huellas', 120);
    const ownerPhone = normalizePhone(body.propietario_telefono || body.telefono || '987654321');
    const ownerEmail = sanitizeText(body.propietario_correo || body.correo || '', 120).toLowerCase();
    const ownerDni = sanitizeText(body.propietario_dni || body.dni || '', 20);
    const ownerDir = sanitizeText(body.propietario_direccion || body.direccion || 'Lima, Perú', 255);

    const created = await db.withTransaction(async (conn) => {
      // Resolver id_propietario
      let idPropietario = body.id_propietario ? Number(body.id_propietario) : null;

      if (!idPropietario && ownerEmail) {
        const [byEmail] = await conn.query(
          'SELECT id_propietario FROM propietarios WHERE LOWER(correo) = ? LIMIT 1',
          [ownerEmail]
        );
        if (byEmail.length > 0) idPropietario = byEmail[0].id_propietario;
      }

      if (!idPropietario && ownerPhone) {
        const [byPhone] = await conn.query(
          'SELECT id_propietario FROM propietarios WHERE telefono = ? OR LOWER(nombres) = ? LIMIT 1',
          [ownerPhone, ownerName.toLowerCase()]
        );
        if (byPhone.length > 0) idPropietario = byPhone[0].id_propietario;
      }

      if (!idPropietario) {
        const fallbackEmail = ownerEmail || `owner.${Date.now()}.${Math.floor(Math.random() * 999)}@huellas.local`;
        const fallbackDni = /^\d{8}$/.test(ownerDni) ? ownerDni : String(Math.floor(10000000 + Math.random() * 89999999));
        const [newProp] = await conn.query(
          `INSERT INTO propietarios (nombres, dni, telefono, correo, direccion)
           VALUES (?, ?, ?, ?, ?)`,
          [ownerName, fallbackDni, ownerPhone || '987654321', fallbackEmail, ownerDir]
        );
        idPropietario = newProp.insertId;
      }

      // Resolver id_raza
      let idRaza = body.id_raza ? Number(body.id_raza) : null;
      if (!idRaza && razaNombre) {
        const [rRows] = await conn.query(
          'SELECT id_raza FROM razas WHERE LOWER(nombre_raza) = ? LIMIT 1',
          [razaNombre.toLowerCase()]
        );
        if (rRows.length > 0) idRaza = rRows[0].id_raza;
      }

      const [petRes] = await conn.query(
        `INSERT INTO mascotas
         (id_propietario, id_raza, codigo_qr, microchip, nombre, especie, raza, sexo, edad, fecha_nacimiento, peso_actual, color, foto_url, alergias, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo')`,
        [
          idPropietario,
          idRaza,
          codigoQR,
          microchip,
          nombre,
          especieDb,
          razaNombre,
          sexo,
          edad,
          body.fecha_nacimiento || null,
          pesoNum,
          color,
          fotoUrl,
          alergias,
        ]
      );
      const idMascota = petRes.insertId;

      if (pesoNum) {
        await conn.query(
          `INSERT INTO registro_pesos (id_mascota, peso_kg, origen) VALUES (?, ?, 'registro')`,
          [idMascota, pesoNum]
        );
      }

      // Si viene vacuna inicial o días de recordatorio, guardarla en carnet_vacunacion
      let idVacunacion = null;
      const vacunaInicial = sanitizeText(body.vacuna_inicial || body.vaccineName || '', 120);
      const reminderDays = Number(body.reminderDays) || 30;

      if (vacunaInicial) {
        const dueDate = new Date(Date.now() + reminderDays * 86400000);
        const dueSql = dueDate.toISOString().slice(0, 10);
        const [vaxRes] = await conn.query(
          `INSERT INTO carnet_vacunacion
           (id_mascota, veterinario_nombre, vacuna, lote_fabricante, fecha_aplicacion, fecha_proximo_refuerzo, estado_dosis)
           VALUES (?, ?, ?, ?, CURDATE(), ?, ?)`,
          [
            idMascota,
            sanitizeText(body.veterinario_nombre || 'Dra. Ana Torres Paredes', 120),
            vacunaInicial,
            sanitizeText(body.lote || `LT-${Math.floor(1000 + Math.random() * 8999)}`, 60),
            dueSql,
            reminderDays <= 7 ? 'por-vencer' : 'al-dia',
          ]
        );
        idVacunacion = vaxRes.insertId;
      }

      return {
        id_mascota: idMascota,
        id_propietario: idPropietario,
        id_vacunacion: idVacunacion,
        codigo_qr: codigoQR,
        microchip,
        nombre,
        especie: especieDb,
        raza: razaNombre,
        ownerName,
        ownerPhone,
        ownerEmail,
        vacunaInicial,
        reminderDays,
        alergias,
      };
    });

    // Programar recordatorio inteligente en BD si aplica
    if (created.vacunaInicial && (body.programar_recordatorio !== false)) {
      try {
        const dueDate = new Date(Date.now() + created.reminderDays * 86400000);
        const aiDraft = await generateSmartReminder({
          petName: created.nombre,
          species: created.especie,
          breed: created.raza,
          ownerName: created.ownerName,
          vaccineName: created.vacunaInicial,
          dueDate: dueDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
          daysRemaining: created.reminderDays,
          allergies: created.alergias,
          channel: 'WhatsApp',
        });

        await db.queryAsync(
          `INSERT INTO recordatorios
           (id_mascota, id_propietario, id_vacunacion, canal, asunto, mensaje, telefono_destino, correo_destino, fecha_programada, estado, generado_por_ia)
           VALUES (?, ?, ?, 'WhatsApp', ?, ?, ?, ?, ?, 'Programado', 1)`,
          [
            created.id_mascota,
            created.id_propietario,
            created.id_vacunacion,
            aiDraft.asunto,
            aiDraft.mensaje,
            created.ownerPhone || '987654321',
            created.ownerEmail || null,
            dueDate,
          ]
        );
      } catch (remErr) {
        console.warn('[Mascota POST] Recordatorio no programado:', remErr.message);
      }
    }

    res.status(201).json({
      success: true,
      mensaje: '¡Mascota registrada exitosamente en la base de datos!',
      id_mascota: created.id_mascota,
      id_propietario: created.id_propietario,
      codigo_qr: created.codigo_qr,
      microchip: created.microchip,
    });
  } catch (err) {
    console.error('Error al registrar la mascota:', err);
    res.status(500).json({ error: 'Error al guardar en la base de datos', detalles: err.message });
  }
});

/**
 * 6. PATCH /api/mascotas/:id/extravio
 * Activa o desactiva el Modo Mascota Perdida en MySQL y notifica por WhatsApp al dueño.
 */
router.patch('/:id/extravio', async (req, res) => {
  try {
    const idParam = sanitizeText(req.params.id, 50);
    const [rows] = await db.queryAsync(
      `SELECT m.*, p.nombres AS propietario_nombre, p.telefono AS propietario_telefono, p.correo AS propietario_correo
       FROM mascotas m
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
       WHERE UPPER(m.codigo_qr) = ? OR CAST(m.id_mascota AS CHAR) = ?
       LIMIT 1`,
      [idParam.toUpperCase(), idParam]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const pet = rows[0];
    const nuevoEstado =
      typeof req.body?.estadoExtravio === 'boolean'
        ? req.body.estadoExtravio
        : !Boolean(pet.modo_extraviado);

    await db.queryAsync('UPDATE mascotas SET modo_extraviado = ? WHERE id_mascota = ?', [
      nuevoEstado ? 1 : 0,
      pet.id_mascota,
    ]);

    if (nuevoEstado && pet.propietario_telefono) {
      sendLostPetAlert({
        id_mascota: pet.id_mascota,
        id_propietario: pet.id_propietario,
        petName: pet.nombre,
        codigoQR: pet.codigo_qr,
        ownerName: pet.propietario_nombre,
        ownerPhone: pet.propietario_telefono,
        ownerEmail: pet.propietario_correo,
      }).catch((e) => console.warn('[Extravío Alert]', e.message));
    }

    res.json({
      success: true,
      id_mascota: pet.id_mascota,
      codigo_qr: pet.codigo_qr,
      estadoExtravio: nuevoEstado,
    });
  } catch (err) {
    console.error('Error actualizando modo extravío:', err);
    res.status(500).json({ error: 'Error al actualizar estado de extravío' });
  }
});

/**
 * 7. POST /api/mascotas/:codigo/alerta-gps
 * Guarda coordenadas GPS de rescate en MySQL y envía alerta automática al número del propietario.
 */
router.post('/:codigo/alerta-gps', async (req, res) => {
  try {
    const codigo = sanitizeText(req.params.codigo, 50).toUpperCase();
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    const precision = Number(req.body?.precision_metros) || 15;
    const mensajeRescatista = sanitizeText(req.body?.mensaje || '', 400);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'Coordenadas GPS inválidas.' });
    }

    const [rows] = await db.queryAsync(
      `SELECT m.*, p.nombres AS propietario_nombre, p.telefono AS propietario_telefono, p.correo AS propietario_correo
       FROM mascotas m
       INNER JOIN propietarios p ON m.id_propietario = p.id_propietario
       WHERE UPPER(m.codigo_qr) = ? OR CAST(m.id_mascota AS CHAR) = ?
       LIMIT 1`,
      [codigo, codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada en la base de datos.' });
    }

    const pet = rows[0];
    const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

    const [ins] = await db.queryAsync(
      `INSERT INTO alertas_rescate_gps (id_mascota, codigo_qr, latitud, longitud, precision_metros, maps_url, mensaje_rescatista, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activa')`,
      [pet.id_mascota, pet.codigo_qr, lat, lng, precision, mapsUrl, mensajeRescatista || null]
    );

    let notificacion = null;
    if (pet.propietario_telefono) {
      try {
        notificacion = await sendLostPetAlert({
          id_mascota: pet.id_mascota,
          id_propietario: pet.id_propietario,
          petName: pet.nombre,
          codigoQR: pet.codigo_qr,
          ownerName: pet.propietario_nombre,
          ownerPhone: pet.propietario_telefono,
          ownerEmail: pet.propietario_correo,
          mapsUrl,
        });
      } catch (msgErr) {
        console.warn('[GPS Alert] Error enviando notificación automática:', msgErr.message);
      }
    }

    res.status(201).json({
      success: true,
      id_alerta: ins.insertId,
      mapsUrl,
      notificacion_enviada: Boolean(notificacion?.success),
    });
  } catch (err) {
    console.error('Error guardando alerta GPS:', err);
    res.status(500).json({ error: 'Error al registrar alerta GPS' });
  }
});

module.exports = router;
