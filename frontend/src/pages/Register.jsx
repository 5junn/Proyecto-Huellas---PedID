// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import Icon from '../components/Icon';
import { registrarUsuarioPropietario } from '../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [formData, setFormData] = useState({
    nombres: '',
    dni: '',
    telefono: '',
    correo: '',
    direccion: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registrarUsuarioPropietario(formData);
      navigate(['/registrar-mascota', '/registro-mascota'].includes(redirect) ? redirect : '/propietario', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      showcaseTitle="La salud y seguridad de tu mascota a un escaneo."
      showcaseDescription="Crea tu cuenta de propietario para vincular las placas QR de tus mascotas, consultar el carnet de vacunas y activar el Modo Mascota Perdida en caso de emergencia."
    >
      <div className="auth-card-header">
        <div className="auth-role-pill owner">
          <Icon name="paw" size={15} />
          <span>Registro Exclusivo de Propietario</span>
        </div>
        <h2>Crear Cuenta de Dueño</h2>
        <p>Completa tus datos de contacto para registrar y proteger a tus mascotas.</p>
      </div>

      {error && (
        <div className="auth-alert error animate-fade" role="alert">
          <Icon name="alert" size={18} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombres">Nombres y Apellidos Completos</label>
          <div className="input-wrapper">
            <span className="input-icon" aria-hidden="true">
              <Icon name="user" size={18} />
            </span>
            <input
              id="nombres"
              name="nombres"
              type="text"
              className="form-input"
              placeholder="Ej. Lucía Paredes Mendoza"
              value={formData.nombres}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="dni">DNI / Documento</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <Icon name="idcard" size={18} />
              </span>
              <input
                id="dni"
                name="dni"
                type="text"
                maxLength="8"
                className="form-input"
                placeholder="8 dígitos"
                value={formData.dni}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono Celular de Contacto</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <Icon name="phone" size={18} />
              </span>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                maxLength="9"
                className="form-input"
                placeholder="999 999 999"
                value={formData.telefono}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="correo">Correo Electrónico</label>
          <div className="input-wrapper">
            <span className="input-icon" aria-hidden="true">
              <Icon name="mail" size={18} />
            </span>
            <input
              id="correo"
              name="correo"
              type="email"
              className="form-input"
              placeholder="lucia@ejemplo.com"
              value={formData.correo}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="direccion">Dirección de Residencia</label>
          <div className="input-wrapper">
            <span className="input-icon" aria-hidden="true">
              <Icon name="pin" size={18} />
            </span>
            <input
              id="direccion"
              name="direccion"
              type="text"
              className="form-input"
              placeholder="Distrito, calle o referencia de Lima"
              value={formData.direccion}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <PasswordInput
          id="password"
          name="password"
          label="Crear Contraseña"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />

        <button type="submit" className="btn-primary-gradient" disabled={loading}>
          {loading ? (
            <>
              <svg className="spinner-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>Creando cuenta de propietario...</span>
            </>
          ) : (
            <>
              <span>Registrar Cuenta de Propietario</span>
              <Icon name="check" size={18} />
            </>
          )}
        </button>
      </form>

      <div className="auth-switch-footer">
        <span>¿Ya tienes una cuenta registrada?</span>
        <Link to="/login" className="auth-switch-link">
          Iniciar sesión aquí
        </Link>
      </div>

      <div className="auth-roles-notice">
        <Icon name="shield" size={14} />
        <span>¿Eres personal clínico de la veterinaria? No necesitas registrarte aquí. <Link to="/login?portal=staff" style={{ color: '#38BDF8', fontWeight: 600 }}>Acceder al Portal Clínico</Link></span>
      </div>

      <div className="auth-home-back">
        <Link to="/" className="auth-back-link">
          <Icon name="arrowLeft" size={15} />
          <span>Volver a la página principal</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
