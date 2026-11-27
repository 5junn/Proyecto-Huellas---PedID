export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') ||
    (import.meta.env.DEV ? 'http://localhost:4000' : '');
  if (!raw) throw new Error('La conexión al servidor aún no está configurada.');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

export async function apiFetch(path, { authenticated = true, headers, ...options } = {}) {
  const base = getApiBase();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const token = authenticated ? localStorage.getItem('huellas_token') : null;
  let response;
  try {
    response = await fetch(`${base}${cleanPath}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token && token === localStorage.getItem('huellas_token')) {
      localStorage.removeItem('huellas_token');
      localStorage.removeItem('huellas_user');
      window.dispatchEvent(new Event('huellas_session_expired'));
    }
    const error = new Error(data?.message || data?.error || `Error HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  if (data === null) throw new Error('El servidor devolvió una respuesta inesperada.');
  return data;
}
