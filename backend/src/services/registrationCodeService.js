const { createHmac, randomBytes, randomInt, timingSafeEqual } = require('node:crypto');
const db = require('../db');
const { getSigningSecret } = require('../utils/security');
const { sendThroughExternalProvider } = require('./messagingService');

const MAX_ATTEMPTS = 5;

function digest(correo, nonce, code) {
  return createHmac('sha256', getSigningSecret())
    .update(JSON.stringify(['registro', correo, nonce, code]))
    .digest();
}

async function requestRegistrationCode(correo) {
  if (!process.env.RESEND_API_KEY?.trim() || !process.env.EMAIL_FROM?.trim()) {
    return { status: 503, message: 'El envío de códigos requiere configurar Resend y el remitente del correo.' };
  }

  const code = String(randomInt(1_000_000)).padStart(6, '0');
  const nonce = randomBytes(16).toString('hex');
  const codeHash = digest(correo, nonce, code).toString('hex');

  const reserved = await db.withTransaction(async (conn) => {
    await conn.query(
      'INSERT INTO verificaciones_registro (correo) VALUES (?) ON DUPLICATE KEY UPDATE correo = correo',
      [correo]
    );
    const [[row]] = await conn.query(
      'SELECT reenviar_en > NOW() AS espera FROM verificaciones_registro WHERE correo = ? FOR UPDATE',
      [correo]
    );
    if (row.espera) return false;
    await conn.query(
      `UPDATE verificaciones_registro
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
      subject: 'Código de registro de Huellas PetID',
      message: `Tu código de verificación es ${code}. Vence en 10 minutos. Si no pediste el código, puedes ignorar este correo.`,
    });
  } catch {
    await db.queryAsync(
      'UPDATE verificaciones_registro SET codigo_hash = NULL WHERE correo = ? AND nonce = ?',
      [correo, nonce]
    );
    return { status: 502, message: 'El proveedor de correo no aceptó el envío. Revisa el remitente de Resend e intenta de nuevo.' };
  }

  await db.queryAsync('DELETE FROM verificaciones_registro WHERE vence_en < NOW() - INTERVAL 1 DAY LIMIT 100');
  return { status: 202, message: 'Enviamos un código al correo indicado. Vence en 10 minutos.' };
}

// El llamador mantiene la transacción hasta que se crea la cuenta y se consume el código.
async function verifyRegistrationCode(conn, correo, code) {
  const [[row]] = await conn.query(
    `SELECT nonce, codigo_hash, intentos, vence_en > NOW() AS vigente
     FROM verificaciones_registro WHERE correo = ? FOR UPDATE`,
    [correo]
  );
  if (!row?.vigente || !row.codigo_hash || row.intentos >= MAX_ATTEMPTS) return false;

  const expected = Buffer.from(row.codigo_hash, 'hex');
  if (expected.length === 32 && timingSafeEqual(digest(correo, row.nonce, code), expected)) return true;

  await conn.query('UPDATE verificaciones_registro SET intentos = intentos + 1 WHERE correo = ?', [correo]);
  return false;
}

module.exports = { requestRegistrationCode, verifyRegistrationCode };
