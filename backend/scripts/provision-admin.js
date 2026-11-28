const db = require('../src/db');
const { initDatabase } = require('../src/dbInit');
const { hashPassword, isValidEmail, sanitizeText } = require('../src/utils/security');

async function provisionAdmin() {
  const correo = sanitizeText(process.env.STAFF_ADMIN_EMAIL, 120).toLowerCase();
  const password = process.env.STAFF_ADMIN_PASSWORD;
  const resetPassword = process.argv.includes('--reset-password');
  if (!isValidEmail(correo) || typeof password !== 'string' ||
      password.length < 12 || password.length > 128) {
    throw new Error('Configura STAFF_ADMIN_EMAIL y STAFF_ADMIN_PASSWORD (12 a 128 caracteres).');
  }
  if (!await initDatabase()) throw new Error('MySQL no está disponible.');

  const hash = hashPassword(password);
  if (resetPassword) {
    const [result] = await db.queryAsync(
      "UPDATE usuarios SET contrasena_cifrada = ?, version_sesion = version_sesion + 1, estado = 'activo' WHERE correo = ? AND rol = 'Administrador'",
      [hash, correo]
    );
    if (!result.affectedRows) throw new Error('No existe un administrador con ese correo.');
    console.log('La contraseña del administrador fue actualizada.');
    return;
  }

  const nombres = sanitizeText(process.env.STAFF_ADMIN_NAME, 120);
  if (nombres.length < 3) throw new Error('Configura STAFF_ADMIN_NAME.');
  await db.queryAsync(
    "INSERT INTO usuarios (nombres, correo, contrasena_cifrada, rol) VALUES (?, ?, ?, 'Administrador')",
    [nombres, correo, hash]
  );
  console.log('Administrador creado.');
}

provisionAdmin()
  .catch((error) => {
    console.error(error.code === 'ER_DUP_ENTRY' ? 'Este correo ya tiene una cuenta.' : error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
