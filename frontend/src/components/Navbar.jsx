// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Icon from './Icon';
import { getUser, isAuthenticated, isStaff, logout } from '../services/authService';
import '../styles/navbar.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const auth = isAuthenticated();
  const user = getUser();
  const staff = isStaff();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="hp-navbar">
      <div className="hp-nav-container">
        {/* Marca / Logo */}
        <Link to="/" className="hp-nav-brand" onClick={closeMenu}>
          <div className="hp-logo-glow">
            <Logo size={36} />
          </div>
          <div className="hp-brand-text">
            <div className="hp-brand-title">
              Huellas <span className="hp-gradient-text">PetID</span>
            </div>
            <span className="hp-brand-sub">Clínica & Trazabilidad QR</span>
          </div>
        </Link>

        {/* Enlaces de Navegación de Escritorio */}
        <nav className="hp-nav-links" aria-label="Navegación principal">
          <Link to="/" className={`hp-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            Inicio
          </Link>
          <a href="/#tecnologia-qr" className="hp-nav-item">
            Placas QR
          </a>
          <a href="/#servicios" className="hp-nav-item">
            Servicios Clínicos
          </a>
          <a href="/#como-funciona" className="hp-nav-item">
            Cómo Funciona
          </a>
          <Link to="/emergencias" className={`hp-nav-item hp-nav-badge-link ${location.pathname === '/emergencias' ? 'active' : ''}`}>
            <span className="hp-pulse-dot" />
            Emergencias 24/7
          </Link>
        </nav>

        {/* Acciones y Autenticación */}
        <div className="hp-nav-actions">
          {auth ? (
            <div className="hp-user-logged">
              {staff ? (
                <Link to="/dashboard" className="hp-btn-portal-badge staff" title="Ir al Dashboard Clínico">
                  <Icon name="doctor" size={16} />
                  <span>Panel Clínico</span>
                </Link>
              ) : (
                <Link to="/propietario" className="hp-btn-portal-badge owner" title="Ir a Mi Portal de Mascotas">
                  <Icon name="paw" size={16} />
                  <span>Mis Mascotas</span>
                </Link>
              )}

              <div className="hp-user-chip">
                <span className="hp-user-avatar">
                  {user?.nombres?.charAt(0) || 'U'}
                </span>
                <span className="hp-user-name">{user?.nombres?.split(' ')[0]}</span>
              </div>

              <button onClick={handleLogout} className="hp-btn-logout" title="Cerrar sesión" aria-label="Cerrar sesión">
                <Icon name="logout" size={17} />
              </button>
            </div>
          ) : (
            <div className="hp-auth-group">
              {/* Acceso para el personal médico/clínico */}
              <Link
                to="/login?portal=staff"
                className="hp-btn-staff"
                title="Acceso exclusivo para Veterinarios, Recepción y Administrador"
              >
                <Icon name="shield" size={16} />
                <span>Portal Clínico</span>
              </Link>

              {/* Botón Principal para Clientes / Propietarios */}
              <Link to="/login" className="hp-btn-owner">
                <Icon name="paw" size={17} />
                <span>Soy Propietario</span>
              </Link>
            </div>
          )}

          {/* Botón Menú Móvil */}
          <button
            className="hp-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {mobileOpen && (
        <div className="hp-mobile-menu">
          <nav className="hp-mobile-nav">
            <Link to="/" onClick={closeMenu} className="hp-mobile-item">
              <Icon name="home" size={20} />
              <span>Inicio</span>
            </Link>
            <a href="/#tecnologia-qr" onClick={closeMenu} className="hp-mobile-item">
              <Icon name="qr" size={20} />
              <span>Placas QR Inteligentes</span>
            </a>
            <a href="/#servicios" onClick={closeMenu} className="hp-mobile-item">
              <Icon name="stethoscope" size={20} />
              <span>Servicios de la Clínica</span>
            </a>
            <a href="/#como-funciona" onClick={closeMenu} className="hp-mobile-item">
              <Icon name="spark" size={20} />
              <span>Cómo Funciona</span>
            </a>
            <Link to="/emergencias" onClick={closeMenu} className="hp-mobile-item danger">
              <Icon name="alert" size={20} />
              <span>Red de Emergencias 24/7</span>
            </Link>

            <div className="hp-mobile-divider" />

            {auth ? (
              <div className="hp-mobile-auth">
                {staff ? (
                  <Link to="/dashboard" onClick={closeMenu} className="hp-mobile-btn primary">
                    <Icon name="doctor" size={18} />
                    <span>Ir a mi Panel Clínico</span>
                  </Link>
                ) : (
                  <Link to="/propietario" onClick={closeMenu} className="hp-mobile-btn primary">
                    <Icon name="paw" size={18} />
                    <span>Ir a Mis Mascotas</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="hp-mobile-btn logout">
                  <Icon name="logout" size={18} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <div className="hp-mobile-auth">
                <Link to="/login" onClick={closeMenu} className="hp-mobile-btn primary">
                  <Icon name="paw" size={18} />
                  <span>Ingresar como Propietario</span>
                </Link>
                <Link to="/register" onClick={closeMenu} className="hp-mobile-btn outline">
                  <Icon name="plus" size={18} />
                  <span>Registrar Cuenta Propietario</span>
                </Link>
                <Link to="/login?portal=staff" onClick={closeMenu} className="hp-mobile-btn staff">
                  <Icon name="shield" size={18} />
                  <span>Acceso Personal Clínico (Vet/Admin)</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
