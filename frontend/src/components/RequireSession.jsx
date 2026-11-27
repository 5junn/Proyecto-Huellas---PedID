import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, refreshSession, ROLES_INTERNOS, ROLES_USUARIOS } from '../services/authService';

export default function RequireSession({ staff = false, page: Page }) {
  const { pathname } = useLocation();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!getToken()) return;
    const controller = new AbortController();
    const onExpired = () => setSession(null);
    window.addEventListener('huellas_session_expired', onExpired);
    refreshSession(controller.signal)
      .then(setSession)
      .catch((err) => {
        if (err.name !== 'AbortError' && err.status !== 401) setError(err.message);
      });
    return () => {
      controller.abort();
      window.removeEventListener('huellas_session_expired', onExpired);
    };
  }, [attempt]);

  if (!getToken()) {
    const query = staff
      ? 'portal=staff'
      : `redirect=${encodeURIComponent(pathname)}&msg=auth_required`;
    return <Navigate to={`/login?${query}`} replace />;
  }
  if (error) {
    return (
      <main role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => {
          setError('');
          setAttempt((current) => current + 1);
        }}>Reintentar</button>
      </main>
    );
  }
  if (!session) return <p role="status">Verificando sesión…</p>;

  const roles = staff ? ROLES_INTERNOS : ROLES_USUARIOS;
  if (!roles.includes(session.rol)) {
    return <Navigate to={staff ? '/propietario' : '/dashboard'} replace />;
  }
  return <Page user={session} />;
}
