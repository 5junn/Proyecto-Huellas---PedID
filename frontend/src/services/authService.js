// src/services/authService.js
import { getApiBase } from './apiClient';

const API_URL = getApiBase();

export const ROLES_INTERNOS = ['Administrador', 'Veterinario', 'Recepcionista'];
export const ROLES_USUARIOS = ['Propietario', 'Cliente'];

const USUARIOS_DEMO = [
  {
    correo: 'veterinario@huellas.com',
    password: 'password123',
    usuario: {
      id: 2,
      nombres: 'Dra. Ana Torres Paredes',
      correo: 'veterinario@huellas.com',
      rol: 'Veterinario',
      especialidad: 'Medicina General & Cirugía',
      avatar: 'AT'
    }
  },
  {
    correo: 'recepcion@huellas.com',
    password: 'password123',
    usuario: {
      id: 4,
      nombres: 'Carlos Mendoza Rios',
      correo: 'recepcion@huellas.com',
      rol: 'Recepcionista',
      area: 'Admisión y Citas',
      avatar: 'CM'
    }
  },
  {
    correo: 'admin@huellas.com',
    password: 'password123',
    usuario: {
      id: 1,
      nombres: 'Administrador General',
      correo: 'admin@huellas.com',
      rol: 'Administrador',
      permisos: 'Acceso total',
      avatar: 'AG'
    }
  },
  {
    correo: 'propietario@gmail.com',
    password: 'password123',
    usuario: {
      id: 5,
      id_propietario: 2,
      nombres: 'Lucía Paredes Torres',
      correo: 'propietario@gmail.com',
      rol: 'Propietario',
      telefono: '976543210',
      dni: '72345678',
      direccion: 'Calle Las Acacias 120, Surco, Lima',
      avatar: 'LP'
    }
  }
];

export async function loginPersonalClinico({ correo, password }) {
  const emailClean = (correo || '').trim().toLowerCase();

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: emailClean, password, portal: 'staff' }),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      const user = data.usuario || data.user;
      if (!ROLES_INTERNOS.includes(user.rol)) {
        throw new Error('Esta cuenta no tiene permisos de personal clínico.');
      }
      localStorage.setItem('huellas_token', data.token || 'hp_token_staff');
      localStorage.setItem('huellas_user', JSON.stringify(user));
      return user;
    }
    if (response.status === 401 || response.status === 403 || response.status === 400) {
      throw new Error(data.message || 'Credenciales inválidas para el portal del personal clínico.');
    }
  } catch (err) {
    if (err.message && !/fetch|network/i.test(err.message)) {
      throw err;
    }
    console.warn('API no accesible, verificando credenciales demo locales...', err.message);
  }

  const match = USUARIOS_DEMO.find(
    (u) => u.correo.toLowerCase() === emailClean && u.password === password
  );

  if (match) {
    if (!ROLES_INTERNOS.includes(match.usuario.rol)) {
      throw new Error('Esta cuenta pertenece a un Propietario. Inicia sesión en el Portal de Propietarios.');
    }
    localStorage.setItem('huellas_token', 'demo_token_staff_' + match.usuario.id);
    localStorage.setItem('huellas_user', JSON.stringify(match.usuario));
    return match.usuario;
  }

  throw new Error('Credenciales inválidas para el portal del personal clínico.');
}

export async function loginUsuarioPropietario({ correo, password }) {
  const emailClean = (correo || '').trim().toLowerCase();

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: emailClean, password, portal: 'usuario' }),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      const user = data.usuario || data.user;
      localStorage.setItem('huellas_token', data.token || 'hp_token_user');
      localStorage.setItem('huellas_user', JSON.stringify(user));
      return user;
    }
    if (response.status === 401 || response.status === 403 || response.status === 400) {
      throw new Error(data.message || 'Correo o contraseña incorrectos para el portal de propietarios.');
    }
  } catch (err) {
    if (err.message && !/fetch|network/i.test(err.message)) {
      throw err;
    }
    console.warn('API no accesible, verificando credenciales demo locales...', err.message);
  }

  const match = USUARIOS_DEMO.find(
    (u) => u.correo.toLowerCase() === emailClean && u.password === password
  );

  if (match) {
    localStorage.setItem('huellas_token', 'demo_token_user_' + match.usuario.id);
    localStorage.setItem('huellas_user', JSON.stringify(match.usuario));
    return match.usuario;
  }

  const registeredUsers = JSON.parse(localStorage.getItem('huellas_registered_users') || '[]');
  const localMatch = registeredUsers.find(
    (u) => u.correo.toLowerCase() === emailClean && u.password === password
  );

  if (localMatch) {
    const userData = { ...localMatch, password: undefined, rol: 'Propietario' };
    localStorage.setItem('huellas_token', 'demo_token_registered_' + Date.now());
    localStorage.setItem('huellas_user', JSON.stringify(userData));
    return userData;
  }

  throw new Error('Correo o contraseña incorrectos para el portal de propietarios.');
}

export async function registrarUsuarioPropietario({ nombres, dni, telefono, correo, direccion, password }) {
  if (!nombres || nombres.trim().length < 3) throw new Error('Ingresa tu nombre completo.');
  if (!dni || !/^\d{8}$/.test(dni.trim())) throw new Error('El DNI debe tener 8 dígitos numéricos.');
  if (!telefono || !/^9\d{8}$/.test(telefono.trim())) throw new Error('Ingresa un teléfono celular válido de 9 dígitos.');
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) throw new Error('Ingresa un correo electrónico válido.');
  if (!password || password.length < 8) throw new Error('La contraseña debe tener mínimo 8 caracteres.');

  const payload = {
    nombres: nombres.trim(),
    dni: dni.trim(),
    telefono: telefono.trim(),
    correo: correo.trim().toLowerCase(),
    direccion: (direccion || '').trim(),
    password,
    rol: 'Propietario'
  };

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return data;
    }
    throw new Error(data.message || 'No se pudo completar el registro en la base de datos.');
  } catch (err) {
    if (err.message && !/fetch|network/i.test(err.message)) {
      throw err;
    }
    console.warn('Backend offline o no disponible, registrando en almacenamiento local de contingencia...');
  }

  const registeredUsers = JSON.parse(localStorage.getItem('huellas_registered_users') || '[]');
  const exists = registeredUsers.some((u) => u.correo.toLowerCase() === payload.correo);
  if (exists) {
    throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
  }

  registeredUsers.push(payload);
  localStorage.setItem('huellas_registered_users', JSON.stringify(registeredUsers));

  return {
    success: true,
    message: 'Cuenta de propietario registrada con éxito.',
    user: {
      id: Date.now(),
      nombres: payload.nombres,
      correo: payload.correo,
      rol: 'Propietario'
    }
  };
}

export function getUser() {
  const user = localStorage.getItem('huellas_user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('huellas_token');
}

export function isAuthenticated() {
  return Boolean(getToken() && getUser());
}

export function isStaff() {
  const user = getUser();
  return Boolean(user && ROLES_INTERNOS.includes(user.rol));
}

export function isOwner() {
  const user = getUser();
  return Boolean(user && (user.rol === 'Propietario' || user.rol === 'Cliente'));
}

export function logout() {
  localStorage.removeItem('huellas_token');
  localStorage.removeItem('huellas_user');
}
