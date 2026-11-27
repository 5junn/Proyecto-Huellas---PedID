const express = require('express');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const db = require('../db');
const {
  hashPassword,
  verifyPassword,
  signToken,
  normalizePhone,
  sanitizeText,
  isValidEmail,
} = require('../utils/security');
const { sendWelcomeMessage } = require('../services/messagingService');

const {
  STAFF_ROLES, OWNER_ROLES, RECEPTION_ROLES,
  findActiveUser, publicUser, requireSession, allowRoles,
} = require('../utils/session');

function createSession(usuario) {
  return { success: true, token: signToken({ id: usuario.id, sessionVersion: 2 }), usuario };
}

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 15,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

router.get('/me', requireSession, (req, res) => res.json({ usuario: req.user }));

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

/**
 * POST /api/auth/register
 * Registra un nuevo Propietario en `usuarios` y `propietarios`, y envía mensaje automático de bienvenida.
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const nombres = sanitizeText(req.body?.nombres, 120);
    const dni = sanitizeText(req.body?.dni, 20);
    const telefonoRaw = sanitizeText(req.body?.telefono, 30);
    const correo = sanitizeText(req.body?.correo, 120).toLowerCase();
    const direccion = sanitizeText(req.body?.direccion || 'Lima, Perú', 255);
    const password = req.body?.password;

    if (!nombres || nombres.length < 3) {
      return res.status(400).json({ message: 'Ingresa tu nombre completo (mínimo 3 caracteres).' });
    }
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ message: 'El DNI debe tener exactamente 8 dígitos numéricos.' });
    }
    const telefonoStored = normalizePhone(telefonoRaw);
    if (!/^519\d{8}$/.test(telefonoStored)) {
      return res.status(400).json({ message: 'Ingresa un número celular peruano válido.' });
    }
    if (!isValidEmail(correo)) {
      return res.status(400).json({ message: 'Ingresa un correo electrónico válido.' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128 || password === 'password123') {
      return res.status(400).json({ message: 'Elige una contraseña de 8 a 128 caracteres distinta de la clave de demostración.' });
    }

    const passwordHash = hashPassword(password);

    const created = await db.withTransaction(async (conn) => {
      const [existingUser] = await conn.query(
        'SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1',
        [correo]
      );
      if (existingUser.length > 0) {
        const err = new Error('Ya existe una cuenta registrada con este correo electrónico.');
        err.status = 409;
        throw err;
      }

      const [existingProp] = await conn.query(
        'SELECT id_propietario FROM propietarios WHERE dni = ? OR correo = ? LIMIT 1',
        [dni, correo]
      );
      if (existingProp.length > 0) {
        const err = new Error('Ya existe un propietario registrado con este DNI o correo.');
        err.status = 409;
        throw err;
      }

      const [userRes] = await conn.query(
        `INSERT INTO usuarios (nombres, correo, contrasena_cifrada, rol, dni, telefono, direccion, estado)
         VALUES (?, ?, ?, 'Propietario', ?, ?, ?, 'activo')`,
        [nombres, correo, passwordHash, dni, telefonoStored, direccion]
      );
      const idUsuario = userRes.insertId;

      const [propRes] = await conn.query(
        `INSERT INTO propietarios (id_usuario, nombres, dni, telefono, correo, direccion)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idUsuario, nombres, dni, telefonoStored, correo, direccion]
      );

      return {
        id_usuario: idUsuario,
        id_propietario: propRes.insertId,
        nombres,
        dni,
        telefono: telefonoStored,
        correo,
        direccion,
        rol: 'Propietario',
      };
    });

    // Disparar mensaje automático de bienvenida al teléfono registrado (no bloqueante si falla proveedor)
    let welcomeStatus = null;
    try {
      welcomeStatus = await sendWelcomeMessage({
        id_propietario: created.id_propietario,
        nombres: created.nombres,
        telefono: created.telefono,
        correo: created.correo,
      });
    } catch (msgErr) {
      console.warn('[Auth Register] No se pudo enviar bienvenida automática:', msgErr.message);
    }

    return res.status(201).json({
      ...createSession({
        id: created.id_usuario,
        id_propietario: created.id_propietario,
        nombres: created.nombres,
        correo: created.correo,
        dni: created.dni,
        telefono: created.telefono,
        direccion: created.direccion,
        rol: created.rol,
      }),
      message: 'Cuenta de propietario registrada en la base de datos con éxito.',
      bienvenida_enviada: Boolean(welcomeStatus?.success),
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe una cuenta con este DNI o correo.' });
    }
    console.error('[Auth Register] Error:', err);
    return res.status(500).json({ message: 'Error interno al registrar propietario.' });
  }
});

/**
 * POST /api/auth/login
 * Autentica personal clínico o propietarios contra MySQL.
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const correo = sanitizeText(req.body?.correo, 120).toLowerCase();
    const password = req.body?.password;
    const portal = sanitizeText(req.body?.portal, 30);

    if (portal && !['staff', 'usuario'].includes(portal)) {
      return res.status(400).json({ message: 'Portal de acceso inválido.' });
    }

    const userRow = await findActiveUser('correo', correo);
    if (!userRow || !verifyPassword(password, userRow.contrasena_cifrada)) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
    }

    const usuario = publicUser(userRow);
    const portalRoles = portal === 'staff' ? STAFF_ROLES : OWNER_ROLES;
    if (!portalRoles.includes(usuario.rol)) {
      return res.status(403).json({ message: 'Esta cuenta pertenece al otro portal de Huellas PetID.' });
    }
    if (OWNER_ROLES.includes(usuario.rol) && !usuario.id_propietario) {
      return res.status(403).json({ message: 'Tu cuenta aún no está vinculada a un perfil de propietario.' });
    }

    return res.json(createSession(usuario));
  } catch (err) {
    console.error('[Auth Login] Error:', err);
    return res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
});

/**
 * GET /api/auth/propietarios
 * Lista todos los propietarios registrados en la BD con sus mascotas asociadas.
 */
router.get('/propietarios', requireSession, allowRoles(RECEPTION_ROLES), async (req, res) => {
  try {
    const [propietarios] = await db.queryAsync(
      `SELECT p.*, owner.estado AS cuenta_estado,
        GROUP_CONCAT(CONCAT(m.nombre, ' (', COALESCE(m.raza, m.especie), ')') SEPARATOR ' | ') AS mascotas_texto,
        COUNT(m.id_mascota) AS total_mascotas
       FROM propietarios p
       LEFT JOIN usuarios owner ON owner.id_usuario = p.id_usuario AND owner.rol = 'Propietario'
       LEFT JOIN mascotas m ON m.id_propietario = p.id_propietario
       GROUP BY p.id_propietario
       ORDER BY p.id_propietario DESC`
    );

    const formatted = propietarios.map((p) => ({
      ...p,
      mascotas: p.mascotas_texto ? p.mascotas_texto.split(' | ') : [],
    }));
    res.json(formatted);
  } catch (err) {
    console.error('[Propietarios GET] Error:', err);
    res.status(500).json({ message: 'Error al consultar propietarios.' });
  }
});

/**
 * GET /api/auth/staff
 * Lista personal clínico desde MySQL.
 */
router.get('/staff', requireSession, allowRoles(['Administrador']), async (req, res) => {
  try {
    const [staff] = await db.queryAsync(
      `SELECT id_usuario AS id, nombres, correo, rol, especialidad, turno, estado, telefono
       FROM usuarios
       WHERE rol IN ('Administrador', 'Veterinario', 'Recepcionista')
       ORDER BY id_usuario ASC`
    );
    res.json(staff);
  } catch (err) {
    console.error('[Staff GET] Error:', err);
    res.status(500).json({ message: 'Error al consultar personal clínico.' });
  }
});

/**
 * POST /api/auth/staff
 * Crea una nueva cuenta de personal clínico en MySQL.
 */
router.post('/staff', requireSession, allowRoles(['Administrador']), async (req, res) => {
  try {
    const nombres = sanitizeText(req.body?.nombres, 120);
    const correo = sanitizeText(req.body?.correo, 120).toLowerCase();
    const rol = req.body?.rol;
    const especialidad = sanitizeText(req.body?.especialidad || 'Atención General', 100);
    const turno = sanitizeText(req.body?.turno || 'Mañana (8:00 - 14:00)', 60);
    const telefono = normalizePhone(req.body?.telefono || '');
    const password = req.body?.password;

    if (!nombres || !isValidEmail(correo)) {
      return res.status(400).json({ message: 'Se requiere nombre completo y correo válido.' });
    }

    if (!STAFF_ROLES.includes(rol) || typeof password !== 'string' ||
        password.length < 12 || password.length > 128 || password === 'password123') {
      return res.status(400).json({ message: 'Selecciona un rol válido y una contraseña de 12 a 128 caracteres.' });
    }

    const passwordHash = hashPassword(password);
    const [result] = await db.queryAsync(
      `INSERT INTO usuarios (nombres, correo, contrasena_cifrada, rol, especialidad, turno, telefono, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [nombres, correo, passwordHash, rol, especialidad, turno, telefono || null]
    );

    res.status(201).json({
      id: result.insertId,
      nombres,
      correo,
      rol,
      especialidad,
      turno,
      estado: 'activo',
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe un usuario con ese correo institucional.' });
    }
    console.error('[Staff POST] Error:', err);
    res.status(500).json({ message: 'Error al crear personal clínico.' });
  }
});

module.exports = router;
