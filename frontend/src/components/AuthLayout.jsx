// src/components/AuthLayout.jsx
import React from 'react';
import Logo from './Logo';
import '../styles/theme.css';
import '../styles/auth.css';

export default function AuthLayout({ children, showcaseTitle, showcaseDescription }) {
  return (
    <div className="auth-wrapper">
      {/* Panel Izquierdo Visual */}
      <aside className="auth-showcase">
        {/* Patrón SVG decorativo de fondo */}
        <svg className="auth-showcase-bg" viewBox="0 0 800 800" fill="none" aria-hidden="true">
          <circle cx="650" cy="150" r="260" stroke="white" strokeWidth="2" strokeDasharray="12 12" />
          <circle cx="650" cy="150" r="180" stroke="white" strokeWidth="1.5" />
          <circle cx="140" cy="680" r="220" stroke="white" strokeWidth="2" />
          <path d="M0 400 Q 400 300 800 450" stroke="white" strokeWidth="1.5" />
        </svg>

        <div className="auth-brand-header">
          <div className="auth-brand-logo-box">
            <Logo size={42} />
          </div>
          <div>
            <div className="auth-brand-title">Huellas PetID</div>
            <div className="auth-brand-subtitle">Clínica Veterinaria Huellas</div>
          </div>
        </div>

        <div className="auth-showcase-content">
          <div className="auth-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Plataforma Clínica y Trazabilidad QR</span>
          </div>

          <h1>{showcaseTitle}</h1>
          <p>{showcaseDescription}</p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2" />
              </svg>
              <div>
                <strong>Identificación QR Instantánea</strong>
                <div style={{ fontSize: '0.82rem', opacity: 0.88 }}>
                  Acceso inmediato a datos vitales y vacunas sin aplicaciones externas.
                </div>
              </div>
            </div>

            <div className="auth-feature-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <div>
                <strong>Historial Clínico Centralizado</strong>
                <div style={{ fontSize: '0.82rem', opacity: 0.88 }}>
                  Trazabilidad médica en tiempo real para veterinarios y recepción.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-showcase-footer">
          <span>Sistema de Gestión Veterinaria</span>
          <span>Seguridad y Protección de Datos</span>
        </div>
      </aside>

      {/* Panel Derecho: Formulario */}
      <main className="auth-form-section">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <Logo size={36} />
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              Huellas PetID
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
