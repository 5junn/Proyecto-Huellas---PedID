const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { loadBackendEnv, mysqlPassword } = require('../src/env');

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'huellas-env-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('Carga el archivo .env aunque esté guardado en UTF-16 en Windows', (t) => {
  const file = join(fixture(t), '.env');
  const content = '\uFEFFDB_USER=root\r\nDB_PASSWORD="clave-de-prueba"\r\n';
  for (const data of [
    Buffer.from(content, 'utf8'),
    Buffer.from(content, 'utf16le'),
    Buffer.from(content, 'utf16le').swap16(),
  ]) {
    writeFileSync(file, data);
    const environment = {};
    const localEnv = loadBackendEnv(file, environment);
    assert.equal(environment.DB_USER, 'root');
    assert.equal(mysqlPassword(environment, localEnv), 'clave-de-prueba');
  }
});

test('Una variable DB_PASSWORD vacía permite usar la de Railway o del archivo local', (t) => {
  const file = join(fixture(t), '.env');
  writeFileSync(file, 'DB_PASSWORD=clave-local\n');

  for (const [environment, expected] of [
    [{ DB_PASSWORD: 'clave-del-proceso' }, 'clave-del-proceso'],
    [{ DB_PASSWORD: '', MYSQLPASSWORD: 'clave-de-railway' }, 'clave-de-railway'],
    [{ DB_PASSWORD: '' }, 'clave-local'],
  ]) {
    const localEnv = loadBackendEnv(file, environment);
    assert.equal(mysqlPassword(environment, localEnv), expected);
  }
});

test('Si falta .env, el archivo de ejemplo jamás se usa para conectar', (t) => {
  const directory = fixture(t);
  writeFileSync(join(directory, '.env.example'), 'DB_PASSWORD=solo-ejemplo\n');
  const environment = {};
  const localEnv = loadBackendEnv(join(directory, '.env'), environment);
  assert.equal(localEnv.found, false);
  assert.equal(mysqlPassword(environment, localEnv), '');
});
