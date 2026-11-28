const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('../index');
const db = require('../src/db');
const { DEMO_SEED_HASH, signToken, verifyPassword } = require('../src/utils/security');

test('La contraseña de la cuenta de demostración está deshabilitada', () => {
  assert.equal(verifyPassword('password123', DEMO_SEED_HASH), false);
});

test('Las rutas privadas rechazan solicitudes sin una sesión de la API', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const privateRoutes = [
    ['GET', '/auth/me'],
    ['GET', '/auth/propietarios'],
    ['POST', '/auth/staff'],
    ['GET', '/clinica/dashboard'],
    ['POST', '/mascotas'],
    ['GET', '/mascotas/alertas-gps'],
    ['POST', '/mensajeria/enviar'],
    ['POST', '/ia/resumen-clinico'],
  ];

  for (const [method, path] of privateRoutes) {
    const response = await fetch(base + path, { method });
    assert.equal(response.status, 401, `${method} ${path}`);
    await response.json();
  }
});

test('El registro público requiere un código de correo', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombres: 'Propietario de prueba',
      dni: '80000001',
      telefono: '999000001',
      correo: 'propietario@example.invalid',
      direccion: 'Lima',
      password: 'Clave-local-de-prueba-01',
    }),
  });

  assert.equal(response.status, 400);
  const data = await response.json();
  assert.match(data.message, /código de seis dígitos/);
  assert.equal(data.token, undefined);
});


test('Una sesión emitida antes del cambio de contraseña queda revocada', async (t) => {
  const account = {
    id_usuario: 23,
    correo: 'propietario@example.invalid',
    nombres: 'Propietario de prueba',
    rol: 'Propietario',
    id_propietario: 19,
    version_sesion: 1,
  };
  t.mock.method(db, 'queryAsync', async () => [[account]]);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');

  const url = `http://127.0.0.1:${server.address().port}/api/auth/me`;
  const previous = signToken({ id: account.id_usuario, sessionVersion: 2 });
  const current = signToken({ id: account.id_usuario, sessionVersion: 2, revision: 1 });

  const expiredSession = await fetch(url, { headers: { Authorization: `Bearer ${previous}` } });
  assert.equal(expiredSession.status, 401);
  await expiredSession.json();

  const validSession = await fetch(url, { headers: { Authorization: `Bearer ${current}` } });
  assert.equal(validSession.status, 200);
  assert.equal((await validSession.json()).usuario.id, account.id_usuario);
});
