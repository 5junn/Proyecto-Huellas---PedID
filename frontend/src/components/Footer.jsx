// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import Icon from './Icon';
import '../styles/footer.css';

export default function Footer() {
  return (
    <footer className="hp-footer">
      <div className="hp-footer-top-wave">
        <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path
            d="M0,0 C320,50 620,10 960,40 C1200,60 1360,20 1440,0 L1440,60 L0,60 Z"
            fill="#070C1D"
          />
        </svg>
      </div>

      <div className="hp-footer-content">
        <div className="hp-footer-grid">
          {/* Columna 1: Marca y Misión */}
          <div className="hp-footer-col brand">
            <div className="hp-footer-brand">
              <Logo size={42} />
              <div>
                <h3 className="hp-footer-title">Huellas PetID</h3>
                <span className="hp-footer-subtitle">Clínica Veterinaria Huellas</span>
              </div>
            </div>
            <p className="hp-footer-desc">
              Pioneros en identificación inteligente QR y gestión médica preventiva. Conectamos a familias con el equipo veterinario para cuidar la vida de tu mascota las 24 horas del día.
            </p>
            <div className="hp-footer-badges">
              <span className="hp-badge-pill">
                <Icon name="shield" size={14} /> 100% Digital & Seguro
              </span>
              <span className="hp-badge-pill">
                <Icon name="pin" size={14} /> Trazabilidad QR Inmediata
              </span>
            </div>
          </div>

          {/* Columna 2: Plataforma & Soluciones */}
          <div className="hp-footer-col">
            <h4 className="hp-footer-heading">Soluciones PetID</h4>
            <ul className="hp-footer-list">
              <li><a href="/#tecnologia-qr">Placas Inteligentes QR</a></li>
              <li><a href="/#servicios">Carnet Digital de Vacunas</a></li>
              <li><a href="/#como-funciona">Modo Mascota Extraviada</a></li>
              <li><a href="/#servicios">Historial Clínico Digital</a></li>
              <li><Link to="/pet/demo">Simulador de Placa Escaneada</Link></li>
            </ul>
          </div>

          {/* Columna 3: Accesos & Navegación */}
          <div className="hp-footer-col">
            <h4 className="hp-footer-heading">Portales del Sistema</h4>
            <ul className="hp-footer-list">
              <li>
                <Link to="/login" className="hp-footer-highlight-link">
                  <Icon name="paw" size={15} />
                  <span>Portal Propietario (Acceso / Registro)</span>
                </Link>
              </li>
              <li>
                <Link to="/register">
                  <span>Registro Nuevo Dueño de Mascota</span>
                </Link>
              </li>
              <li>
                <Link to="/login?portal=staff" className="hp-footer-staff-link">
                  <Icon name="shield" size={15} />
                  <span>Portal Personal Clínico (Veterinarios/Admin)</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard">Panel de Control Clínico</Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Atención & Emergencias */}
          <div className="hp-footer-col emergency">
            <h4 className="hp-footer-heading">Atención & Emergencias</h4>
            <div className="hp-emergency-card">
              <div className="hp-em-icon">
                <Icon name="phone" size={18} />
              </div>
              <div>
                <span className="hp-em-label">Línea de Emergencia 24/7</span>
                <strong className="hp-em-number">+51 987 654 321</strong>
              </div>
            </div>
            <div className="hp-contact-item">
              <Icon name="pin" size={16} />
              <span>Av. Primavera 1280, Santiago de Surco, Lima</span>
            </div>
            <div className="hp-contact-item">
              <Icon name="clock" size={16} />
              <span>Lunes a Sábado: 8:00 AM - 8:00 PM</span>
            </div>
            <div className="hp-contact-item">
              <Icon name="mail" size={16} />
              <span>soporte@huellaspetid.com</span>
            </div>
          </div>
        </div>

        <div className="hp-footer-bottom">
          <p>© 2026 Huellas PetID - Clínica Veterinaria Huellas. Todos los derechos reservados.</p>
          <div className="hp-footer-meta-links">
            <a href="#terminos">Términos del Servicio</a>
            <span>·</span>
            <a href="#privacidad">Política de Privacidad</a>
            <span>·</span>
            <a href="#seguridad">Seguridad QR</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
