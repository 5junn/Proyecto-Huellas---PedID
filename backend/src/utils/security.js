const crypto = require('crypto');

const EPHEMERAL_RUNTIME_KEY = crypto.randomBytes(32).toString('hex');
const DEMO_SEED_HASH = '$2b$12$K1d0/P07v403ZlA5tN8cYb3FjS6uAe1GhP5oXiT0vEzMnQe8P3eTC';

function getSigningSecret() {
  return process.env.AUTH_SECRET || EPHEMERAL_RUNTIME_KEY;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || !password || password.length > 128 ||
      password === 'password123' || typeof storedHash !== 'string') return false;
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, originalHex] = parts;
    const derived = crypto.scryptSync(String(password), salt, 64);
    const originalBuf = Buffer.from(originalHex, 'hex');
    if (derived.length !== originalBuf.length) return false;
    return crypto.timingSafeEqual(derived, originalBuf);
  }
  return false;
}

function signToken(payload, ttlSeconds = 86400 * 7) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', getSigningSecret()).update(`${header}.${body}`).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function normalizePhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 9 && digits.startsWith('9')) {
    return `51${digits}`;
  }
  return digits;
}

function formatDisplayPhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 11 && digits.startsWith('51')) {
    const local = digits.slice(2);
    return `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  if (digits.length === 9) {
    return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `+${digits}`;
}

function sanitizeText(value, maxLength = 500) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

module.exports = {
  DEMO_SEED_HASH,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  normalizePhone,
  formatDisplayPhone,
  sanitizeText,
  isValidEmail,
};
