const db = require('../db');
const { verifyToken, DEMO_SEED_HASH } = require('./security');

const STAFF_ROLES = ['Administrador', 'Veterinario', 'Recepcionista'];
const OWNER_ROLES = ['Propietario', 'Cliente'];
const CLINICAL_ROLES = ['Administrador', 'Veterinario'];
const RECEPTION_ROLES = ['Administrador', 'Recepcionista'];

async function findActiveUser(field, value) {
  const lookup = field === 'correo' ? 'u.correo' : 'u.id_usuario';
  const [rows] = await db.queryAsync(
    `SELECT u.*, p.id_propietario, p.telefono AS prop_telefono, p.dni AS prop_dni, p.direccion AS prop_direccion
     FROM usuarios u
     LEFT JOIN propietarios p ON u.rol = 'Propietario' AND (
       p.id_usuario = u.id_usuario OR (p.id_usuario IS NULL AND p.correo = u.correo AND p.dni = u.dni)
     )
     WHERE ${lookup} = ? AND u.estado = 'activo'
     ORDER BY p.id_usuario IS NULL, p.id_propietario
     LIMIT 1`,
    [value]
  );
  return rows[0];
}

function publicUser(row) {
  return {
    id: row.id_usuario,
    id_propietario: row.id_propietario || null,
    nombres: row.nombres,
    correo: row.correo,
    rol: row.rol,
    dni: row.prop_dni || row.dni || '',
    telefono: row.prop_telefono || row.telefono || '',
    direccion: row.prop_direccion || row.direccion || '',
    especialidad: row.especialidad || '',
    turno: row.turno || '',
  };
}

async function requireSession(req, res, next) {
  const authorization = req.get('Authorization') || '';
  const token = verifyToken(authorization.match(/^Bearer (\S+)$/i)?.[1]);
  if (token?.sessionVersion !== 2 || !Number.isInteger(token.id)) {
    return res.status(401).json({ message: 'Inicia sesión para continuar.' });
  }

  try {
    const row = await findActiveUser('id', token.id);
    if (!row || row.contrasena_cifrada === DEMO_SEED_HASH ||
        (token.revision ?? 0) !== row.version_sesion) {
      return res.status(401).json({ message: 'Tu sesión ya no está disponible. Vuelve a iniciar sesión.' });
    }
    req.user = publicUser(row);
    next();
  } catch (error) {
    console.error('[Sesión]', error.code || error.message);
    res.status(503).json({ message: 'No se pudo verificar la sesión. Intenta de nuevo.' });
  }
}

function allowRoles(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'Tu cuenta no tiene permisos para esta operación.' });
    }
    if (OWNER_ROLES.includes(req.user.rol) && !req.user.id_propietario) {
      return res.status(403).json({ message: 'Tu cuenta aún no está vinculada a un perfil de propietario.' });
    }
    next();
  };
}

module.exports = {
  STAFF_ROLES, OWNER_ROLES, CLINICAL_ROLES, RECEPTION_ROLES,
  findActiveUser, publicUser, requireSession, allowRoles,
};
