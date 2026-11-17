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
  
  const [formData, setFormData] = useState({ correo: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePortalSwitch = (portal) => {
    setSearchParams(portal === 'staff' ? { portal: 'staff' } : {});
    setError('');
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleQuickFill = (email, pass) => {
    setFormData({ correo: email, password: pass });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activePortal === 'staff') {
        const usuario = await loginPersonalClinico(formData);
        navigate('/dashboard', { state: { role: usuario.rol } });
      } else {
        const usuario = await loginUsuarioPropietario(formData);
        // Si un miembro del staff se loguea por el portal de usuario, lo llevamos a su dashboard clínico
        if (['Administrador', 'Veterinario', 'Recepcionista'].includes(usuario.rol)) {
          navigate('/dashboard', { state: { role: usuario.rol } });
        } else {
          navigate('/propietario');
        }
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

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
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

      {/* BOTONES DE PRUEBA RÁPIDA / DEMO */}
      <div className="auth-quick-demo">
        <span className="demo-label">Accesos rápidos de demostración:</span>
        <div className="demo-buttons-row">
          {isStaffPortal ? (
            <>
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => handleQuickFill('veterinario@huellas.com', 'password123')}
              >
                <Icon name="doctor" size={13} />
                <span>Veterinario</span>
              </button>
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => handleQuickFill('recepcion@huellas.com', 'password123')}
              >
                <Icon name="desk" size={13} />
                <span>Recepción</span>
              </button>
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => handleQuickFill('admin@huellas.com', 'password123')}
              >
                <Icon name="shield" size={13} />
                <span>Admin</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="demo-chip-btn owner"
              onClick={() => handleQuickFill('propietario@gmail.com', 'password123')}
            >
              <Icon name="paw" size={13} />
              <span>Propietario Demo (Lucía Paredes)</span>
            </button>
          )}
        </div>
      </div>

      {/* PIE DE PÁGINA SEGÚN ROL */}
      {isStaffPortal ? (
        <div className="auth-roles-notice">
          <Icon name="shield" size={15} />
          <span>Acceso para: Veterinario, Recepcionista y Administrador. Las cuentas son generadas por la clínica.</span>
        </div>
      ) : (
        <div className="auth-switch-footer">
          <span>¿Aún no has registrado a tu mascota?</span>
          <Link to="/register" className="auth-switch-link">
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
