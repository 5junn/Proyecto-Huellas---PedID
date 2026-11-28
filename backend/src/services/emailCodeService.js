const { createHmac, randomBytes, randomInt, timingSafeEqual } = require('node:crypto');
const db = require('../db');
const { getSigningSecret } = require('../utils/security');
const { sendThroughExternalProvider } = require('./messagingService');
const { registrationEmail, passwordResetEmail } = require('../templates/registrationEmail');

const MAX_ATTEMPTS = 5;

const REGISTRATION = {
  scope: 'registro',
  table: 'verificaciones_registro',
  template: registrationEmail,
};
const PASSWORD_RESET = {
  scope: 'recuperacion',
  table: 'verificaciones_recuperacion',
  template: passwordResetEmail,
};

function digest(scope, correo, nonce, code, binding) {
  const data = [scope, correo, nonce, code];
  // Preserva los códigos de registro emitidos antes de la actualización.
  if (binding !== undefined) data.push(binding);
  return createHmac('sha256', getSigningSecret())
    .update(JSON.stringify(data))
    .digest();
}

function emailCodesConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

async function requestEmailCode({ scope, table, template }, correo, binding) {
  if (!emailCodesConfigured()) {
    return { status: 503, message: 'El envío de códigos requiere configurar Resend y el remitente del correo.' };
  }

  const code = String(randomInt(1_000_000)).padStart(6, '0');
  const nonce = randomBytes(16).toString('hex');
  const codeHash = digest(scope, correo, nonce, code, binding).toString('hex');

  const reserved = await db.withTransaction(async (conn) => {
    await conn.query(
      `INSERT INTO ${table} (correo) VALUES (?) ON DUPLICATE KEY UPDATE correo = correo`,
      [correo]
    );
    const [[row]] = await conn.query(
      `SELECT reenviar_en > NOW() AS espera FROM ${table} WHERE correo = ? FOR UPDATE`,
      [correo]
    );
    if (row.espera) return false;
    await conn.query(
      `UPDATE ${table}
       SET nonce = ?, codigo_hash = ?, intentos = 0, vence_en = NOW() + INTERVAL 10 MINUTE,
           reenviar_en = NOW() + INTERVAL 60 SECOND
       WHERE correo = ?`,
      [nonce, codeHash, correo]
    );
    return true;
  });

  if (!reserved) return { status: 429, message: 'Espera un minuto antes de solicitar otro código.' };

  try {
    await sendThroughExternalProvider({
      canal: 'Correo',
      toEmail: correo,
      ...template(code),
    });
  } catch {
    await db.queryAsync(
      `UPDATE ${table} SET codigo_hash = NULL WHERE correo = ? AND nonce = ?`,
      [correo, nonce]
    );
    return { status: 502, message: 'El proveedor de correo no aceptó el envío. Revisa el remitente de Resend e intenta de nuevo.' };
  }

  await db.queryAsync(`DELETE FROM ${table} WHERE vence_en < NOW() - INTERVAL 1 DAY LIMIT 100`);
  return { status: 202, message: 'Enviamos un código al correo indicado. Vence en 10 minutos.' };
}

// El llamador consume el código dentro de la misma transacción que actualiza la cuenta.
async function verifyEmailCode({ scope, table }, conn, correo, code, binding) {
  const [[row]] = await conn.query(
    `SELECT nonce, codigo_hash, intentos, vence_en > NOW() AS vigente
     FROM ${table} WHERE correo = ? FOR UPDATE`,
    [correo]
  );
  if (!row?.vigente || !row.codigo_hash || row.intentos >= MAX_ATTEMPTS) return false;

  const expected = Buffer.from(row.codigo_hash, 'hex');
  if (expected.length === 32 && timingSafeEqual(digest(scope, correo, row.nonce, code, binding), expected)) return true;

  await conn.query(`UPDATE ${table} SET intentos = intentos + 1 WHERE correo = ?`, [correo]);
  return false;
}

function accountBinding(account) {
  return `${account.id_usuario}:${account.version_sesion}`;
}

module.exports = {
  emailCodesConfigured,
  requestRegistrationCode: (correo) => requestEmailCode(REGISTRATION, correo),
  verifyRegistrationCode: (conn, correo, code) => verifyEmailCode(REGISTRATION, conn, correo, code),
  requestPasswordResetCode: (correo, account) => requestEmailCode(PASSWORD_RESET, correo, accountBinding(account)),
  verifyPasswordResetCode: (conn, correo, code, account) => verifyEmailCode(PASSWORD_RESET, conn, correo, code, accountBinding(account)),
};
