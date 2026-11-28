const readline = require('node:readline/promises');
const { Writable } = require('node:stream');
const db = require('../src/db');
const { initDatabase } = require('../src/dbInit');
const { DEMO_SEED_HASH, hashPassword, isValidEmail, sanitizeText } = require('../src/utils/security');

const resetPassword = process.argv.includes('--reset-password');
const listOnly = process.argv.includes('--listar');

async function promptForAccount() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Abre una terminal para ingresar los datos o configura STAFF_ADMIN_EMAIL y STAFF_ADMIN_PASSWORD.');
  }

  let hide = false;
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!hide) process.stdout.write(chunk);
      callback();
    },
  });
  const terminal = readline.createInterface({ input: process.stdin, output, terminal: true });
  try {
    const nombres = resetPassword ? '' : await terminal.question('Tu nombre completo: ');
    const correo = await terminal.question('Tu correo de administrador: ');
    const passwords = [];
    for (const label of ['Contraseña (12 a 128 caracteres): ', 'Escribe la contraseña otra vez: ']) {
      process.stdout.write(label);
      hide = true;
      passwords.push(await terminal.question(''));
      hide = false;
      process.stdout.write('\n');
    }
    if (passwords[0] !== passwords[1]) throw new Error('Las contraseñas deben coincidir.');
    return { nombres, correo, password: passwords[0] };
  } finally {
    terminal.close();
  }
}

async function provisionAdmin() {
  if (!await initDatabase()) throw new Error('MySQL no está disponible. Revisa backend/.env.');
  const [[database]] = await db.queryAsync('SELECT DATABASE() AS nombre');
  console.log(`Base de datos: ${database.nombre}`);

  const [admins] = await db.queryAsync(
    "SELECT nombres, correo, estado FROM usuarios WHERE rol = 'Administrador' AND contrasena_cifrada <> ? ORDER BY nombres, correo",
    [DEMO_SEED_HASH]
  );
  if (admins.length) {
    console.log('Cuentas de administrador registradas:');
    for (const { nombres, correo, estado } of admins) console.log(`- ${correo} · ${nombres} · ${estado}`);
  } else {
    console.log('Esta base todavía no tiene una cuenta administradora utilizable.');
  }

  const envEmail = process.env.STAFF_ADMIN_EMAIL;
  const envPassword = process.env.STAFF_ADMIN_PASSWORD;
  if (listOnly || (!envEmail && !envPassword && !resetPassword && admins.length)) {
    console.log(admins.length
      ? 'En el sitio, entra por Personal Clínico. Si olvidaste la clave, usa npm run admin -- --reset-password.'
      : 'Ejecuta npm run admin para crear tu cuenta.');
    return;
  }

  if (resetPassword && !admins.length) throw new Error('Ejecuta npm run admin para crear la primera cuenta.');

  const details = envEmail || envPassword
    ? { correo: envEmail, password: envPassword, nombres: process.env.STAFF_ADMIN_NAME }
    : await promptForAccount();
  const correo = sanitizeText(details.correo, 120).toLowerCase();
  const nombres = sanitizeText(details.nombres, 120);
  const { password } = details;
  if (!isValidEmail(correo) || typeof password !== 'string' ||
      password.length < 12 || password.length > 128 || password === 'password123') {
    throw new Error('Ingresa un correo válido y una contraseña de 12 a 128 caracteres.');
  }

  const hash = hashPassword(password);
  if (resetPassword) {
    const [result] = await db.queryAsync(
      `UPDATE usuarios SET contrasena_cifrada = ?, version_sesion = version_sesion + 1, estado = 'activo'
       WHERE correo = ? AND rol = 'Administrador' AND contrasena_cifrada <> ?`,
      [hash, correo, DEMO_SEED_HASH]
    );
    if (!result.affectedRows) throw new Error('El correo debe pertenecer a uno de los administradores listados.');
    console.log('Contraseña actualizada. Inicia sesión desde Personal Clínico.');
    return;
  }

  if (nombres.length < 3) throw new Error('Ingresa tu nombre completo.');
  await db.queryAsync(
    "INSERT INTO usuarios (nombres, correo, contrasena_cifrada, rol) VALUES (?, ?, ?, 'Administrador')",
    [nombres, correo, hash]
  );
  console.log(`Cuenta creada para ${correo}. Inicia sesión desde Personal Clínico.`);
}

provisionAdmin()
  .catch((error) => {
    console.error(error.code === 'ER_DUP_ENTRY' ? 'Este correo ya tiene una cuenta. Usa tu propio correo disponible.' : error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
