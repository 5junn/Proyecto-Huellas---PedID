const mysql = require('mysql2');
const { loadBackendEnv, mysqlPassword } = require('./env');

const localEnv = loadBackendEnv();
const password = mysqlPassword(process.env, localEnv);

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'huellas_petid',
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

const promisePool = pool.promise();

/**
 * Ejecuta una consulta SQL parametrizada retornando una promesa con [rows, fields].
 */
function queryAsync(sql, params = []) {
  return promisePool.query(sql, params);
}

/**
 * Ejecuta un callback dentro de una transacción MySQL.
 */
async function withTransaction(fn) {
  const conn = await promisePool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Verifica conectividad al servidor MySQL.
 */
async function checkConnection() {
  try {
    await promisePool.query('SELECT 1');
    return true;
  } catch (err) {
    console.warn('MySQL no disponible:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR' && !password) {
      console.warn(localEnv.found
        ? `[MySQL] No se cargó una contraseña. Revisa que DB_PASSWORD tenga un valor y aparezca una sola vez en ${localEnv.filePath}.`
        : `[MySQL] No se encontró ${localEnv.filePath}. Crea ese archivo y configura DB_PASSWORD.`);
    }
    return false;
  }
}

module.exports = {
  query: (...args) => pool.query(...args),
  promise: () => promisePool,
  queryAsync,
  withTransaction,
  checkConnection,
  end: () => promisePool.end(),
};
