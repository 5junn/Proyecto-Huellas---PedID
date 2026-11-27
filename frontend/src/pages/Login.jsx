// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import Icon from '../components/Icon';
import { loginPersonalClinico, loginUsuarioPropietario } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activePortal = searchParams.get('portal') === 'staff' ? 'staff' : 'usuario';
  const redirectUrl = searchParams.get('redirect');
  const isAuthRequired = searchParams.get('msg') === 'auth_required';
  
  const [formData, setFormData] = useState({ correo: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePortalSwitch = (portal) => {
    const next = new URLSearchParams(searchParams);
    if (portal === 'staff') next.set('portal', 'staff');
    else next.delete('portal');
    setSearchParams(next);
    setError('');
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activePortal === 'staff') {
        await loginPersonalClinico(formData);
        navigate('/dashboard', { replace: true });
      } else {
        await loginUsuarioPropietario(formData);
        const destination = ['/registrar-mascota', '/registro-mascota'].includes(redirectUrl)
          ? redirectUrl
          : '/propietario';
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isStaffPortal = activePortal === 'staff';

  return (
    <AuthLayout
      showcaseTitle={
        isStaffPortal
          ? 'Gestión clínica digital y trazabilidad médica en cada consulta.'
          : 'La salud y seguridad de tu mascota a un escaneo de distancia.'
      }
      showcaseDescription={
        isStaffPortal
          ? 'Accede al ecosistema interno de la Clínica Veterinaria Huellas para gestionar pacientes, historias clínicas, carnets y turnos de atención.'
          : 'Inicia sesión para consultar el carnet de vacunación de tus mascotas, vincular placas QR y activar el Modo Mascota Perdida en tiempo real.'
      }
    >
      {/* SELECTOR DE PORTAL DUAL (PROPIETARIO VS PERSONAL CLÍNICO) */}
      <div className="auth-portal-selector">
        <button
          type="button"
          className={`portal-tab-btn ${!isStaffPortal ? 'active' : ''}`}
          onClick={() => handlePortalSwitch('usuario')}
        >
          <Icon name="paw" size={17} />
          <span>Soy Propietario</span>
        </button>

        <button
          type="button"
          className={`portal-tab-btn staff-tab ${isStaffPortal ? 'active' : ''}`}
          onClick={() => handlePortalSwitch('staff')}
        >
          <Icon name="shield" size={17} />
          <span>Personal Clínico</span>
        </button>
      </div>

      {isAuthRequired && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '12px',
          padding: '0.8rem 1rem',
          color: '#FBBF24',
          fontSize: '0.82rem',
          marginBottom: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          lineHeight: 1.4
        }}>
          <Icon name="lock" size={18} />
          <span>Para registrar una mascota con su placa QR inteligente, primero debes iniciar sesión o tener una cuenta de propietario.</span>
        </div>
      )}

      <div className="auth-card-header">
        <div className={`auth-role-pill ${isStaffPortal ? 'staff' : 'owner'}`}>
          <Icon name={isStaffPortal ? 'doctor' : 'user'} size={15} />
          <span>{isStaffPortal ? 'Acceso Personal Autorizado' : 'Portal de Propietarios'}</span>
        </div>
        <h2>{isStaffPortal ? 'Iniciar Sesión Clínica' : 'Bienvenido a Huellas PetID'}</h2>
        <p>
          {isStaffPortal
            ? 'Ingreso restringido para Veterinarios, Recepción y Administrador.'
            : 'Ingresa con tu correo de propietario para gestionar a tus mascotas.'}
        </p>
      </div>

      {error && (
        <div className="auth-alert error animate-fade" role="alert">
          <Icon name="alert" size={18} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="correo">
            {isStaffPortal ? 'Correo Institucional Clínico' : 'Correo Electrónico de Propietario'}
          </label>
          <div className="input-wrapper">
            <span className="input-icon" aria-hidden="true">
              <Icon name="mail" size={18} />
            </span>
            <input
              id="correo"
              name="correo"
              type="email"
              className="form-input"
              placeholder={isStaffPortal ? 'personal@huellaspetid.com' : 'tu-correo@ejemplo.com'}
              value={formData.correo}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <PasswordInput
          id="password"
          name="password"
          label="Contraseña"
          value={formData.password}
          onChange={handleChange}
          placeholder="Ingresa tu clave de acceso"
        />

        <button type="submit" className="btn-primary-gradient" disabled={loading}>
          {loading ? (
            <>
              <svg className="spinner-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>Verificando credenciales...</span>
            </>
          ) : (
            <>
              <span>{isStaffPortal ? 'Ingresar al Portal Clínico' : 'Ingresar como Propietario'}</span>
              <Icon name="arrow" size={18} />
            </>
          )}
        </button>
      </form>

      {/* PIE DE PÁGINA SEGÚN ROL */}
      {isStaffPortal ? (
        <div className="auth-roles-notice">
          <Icon name="shield" size={15} />
          <span>Acceso para: Veterinario, Recepcionista y Administrador. Las cuentas son generadas por la clínica.</span>
        </div>
      ) : (
        <div className="auth-switch-footer">
          <span>¿Aún no has registrado a tu mascota?</span>
          <Link to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'} className="auth-switch-link">
            Crear cuenta de propietario gratis
          </Link>
        </div>
      )}

      {/* ENLACE DE RETORNO A INICIO */}
      <div className="auth-home-back">
        <Link to="/" className="auth-back-link">
          <Icon name="arrowLeft" size={15} />
          <span>Volver a la página principal</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
