import { apiFetch } from './apiClient';

export const ROLES_INTERNOS = ['Administrador', 'Veterinario', 'Recepcionista'];
export const ROLES_USUARIOS = ['Propietario', 'Cliente'];

function saveSession(data, roles) {
  if (typeof data?.token !== 'string' || data.token.split('.').length !== 3 ||
      !roles.includes(data.usuario?.rol)) {
    throw new Error('El servidor no devolvió una sesión válida.');
  }
  localStorage.setItem('huellas_user', JSON.stringify(data.usuario));
  localStorage.setItem('huellas_token', data.token);
  return data.usuario;
}

async function login({ correo, password }, portal, roles) {
  const data = await apiFetch('/auth/login', {
    authenticated: false,
    method: 'POST',
    body: JSON.stringify({ correo: correo.trim().toLowerCase(), password, portal }),
  });
  return saveSession(data, roles);
}

export function loginPersonalClinico(credentials) {
  return login(credentials, 'staff', ROLES_INTERNOS);
}

export function loginUsuarioPropietario(credentials) {
  return login(credentials, 'usuario', ROLES_USUARIOS);
}

export function solicitarCodigoRegistro(correo) {
  return apiFetch('/auth/register/code', {
    authenticated: false,
    method: 'POST',
    body: JSON.stringify({ correo: correo.trim().toLowerCase() }),
  });
}

export async function registrarUsuarioPropietario({ nombres, dni, telefono, correo, direccion, password, codigo }) {
  const data = await apiFetch('/auth/register', {
    authenticated: false,
    method: 'POST',
    body: JSON.stringify({
      nombres: nombres.trim(),
      dni: dni.trim(),
      telefono: telefono.trim(),
      correo: correo.trim().toLowerCase(),
      direccion: direccion.trim(),
      password,
      codigo,
    }),
  });
  return saveSession(data, ROLES_USUARIOS);
}

export async function refreshSession(signal) {
  const { usuario } = await apiFetch('/auth/me', { signal });
  localStorage.setItem('huellas_user', JSON.stringify(usuario));
  return usuario;
}

export function getUser() {
  if (!getToken()) return null;
  try {
    return JSON.parse(localStorage.getItem('huellas_user'));
  } catch {
    return null;
  }
}

export function getToken() {
  const token = localStorage.getItem('huellas_token');
  return token?.split('.').length === 3 ? token : null;
}

export function isAuthenticated() {
  return Boolean(getUser());
}

export function isStaff() {
  return ROLES_INTERNOS.includes(getUser()?.rol);
}

export function isOwner() {
  return ROLES_USUARIOS.includes(getUser()?.rol);
}

export function logout() {
  localStorage.removeItem('huellas_token');
  localStorage.removeItem('huellas_user');
  window.dispatchEvent(new Event('huellas_session_expired'));
}
