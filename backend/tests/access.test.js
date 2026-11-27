const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('../index');
const { DEMO_SEED_HASH, verifyPassword } = require('../src/utils/security');

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
