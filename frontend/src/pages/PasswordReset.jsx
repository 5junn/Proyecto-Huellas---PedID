import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';
import PasswordInput from '../components/PasswordInput';
import VerificationCodeInput from '../components/VerificationCodeInput';
import { solicitarCodigoRecuperacion, restablecerContrasena } from '../services/authService';

export default function PasswordReset() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const loginPath = searchParams.get('portal') === 'staff' ? '/login?portal=staff' : '/login';
  const [correo, setCorreo] = useState(location.state?.correo || '');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function sendCode(event) {
    event?.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const result = await solicitarCodigoRecuperacion(correo);
      setNotice(result.message);
      setCodigo('');
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitNewPassword(event) {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('Las contraseñas deben coincidir.');
      return;
    }
    setLoading(true);
    try {
      const result = await restablecerContrasena({ correo, codigo, password });
      setPassword('');
      setConfirmation('');
      setCodigo('');
      setNotice(result.message);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function changeEmail() {
    setCodigo('');
    setPassword('');
    setConfirmation('');
    setError('');
    setNotice('');
    setStep('email');
  }

  return (
    <AuthLayout
      showcaseTitle="Recupera el acceso a Huellas PetID."
      showcaseDescription="Usa el correo asociado a tu cuenta para elegir una nueva contraseña."
    >
      <div className="auth-card-header">
        <h2>{step === 'done' ? 'Contraseña actualizada' : 'Recuperar contraseña'}</h2>
        {step === 'email' && <p>Escribe el correo asociado a tu cuenta.</p>}
        {step === 'code' && <p>{correo.trim()}</p>}
      </div>

      {notice && (
        <p className={step === 'done' ? 'auth-alert success' : 'auth-code-notice'} role="status">{notice}</p>
      )}
      {error && (
        <div className="auth-alert error" role="alert">
          <Icon name="alert" size={18} />
          <span>{error}</span>
        </div>
      )}

      {step === 'email' && (
        <form className="auth-form" onSubmit={sendCode}>
          <div className="form-group">
            <label htmlFor="recuperacion-correo">Correo electrónico</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true"><Icon name="mail" size={18} /></span>
              <input id="recuperacion-correo" className="form-input" type="email" autoComplete="email"
                maxLength={120} value={correo} onChange={(event) => setCorreo(event.target.value)}
                required disabled={loading} />
            </div>
          </div>
          <button type="submit" className="btn-primary-gradient" disabled={loading}>
            {loading ? 'Solicitando código…' : 'Enviar código al correo'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form className="auth-form" onSubmit={submitNewPassword}>
          <VerificationCodeInput value={codigo} onChange={setCodigo} disabled={loading} />
          <PasswordInput label="Nueva contraseña" autoComplete="new-password" minLength={12} maxLength={128}
            placeholder="Mínimo 12 caracteres" value={password}
            onChange={(event) => setPassword(event.target.value)} disabled={loading} />
          <PasswordInput id="confirmacion" name="confirmacion" label="Repite la nueva contraseña" autoComplete="new-password"
            value={confirmation} minLength={12} maxLength={128}
            onChange={(event) => setConfirmation(event.target.value)} disabled={loading} />
          <button type="submit" className="btn-primary-gradient" disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
          </button>
          <div className="auth-code-actions">
            <button type="button" className="portal-tab-btn" disabled={loading} onClick={() => sendCode()}>
              Reenviar código
            </button>
            <button type="button" className="portal-tab-btn" disabled={loading} onClick={changeEmail}>
              Cambiar correo
            </button>
          </div>
        </form>
      )}

      <div className="auth-home-back">
        <Link to={loginPath} className="auth-back-link">
          <Icon name="arrowLeft" size={15} />
          {step === 'done' ? 'Iniciar sesión' : 'Volver al inicio de sesión'}
        </Link>
      </div>
    </AuthLayout>
  );
}
