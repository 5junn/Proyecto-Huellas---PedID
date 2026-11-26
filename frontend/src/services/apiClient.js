// src/services/apiClient.js

export function getApiBase() {
  const raw = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').trim().replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

export async function apiFetch(path, options = {}) {
  const base = getApiBase();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const token = localStorage.getItem('huellas_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${base}${cleanPath}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || data.error || `Error HTTP ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}
