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
