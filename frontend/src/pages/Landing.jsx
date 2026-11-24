// src/pages/Landing.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import WhatsAppChatbotModal from '../components/WhatsAppChatbotModal';
import { isAuthenticated } from '../services/authService';
import '../styles/landing.css';

export default function Landing() {
  const [simulatorMode, setSimulatorMode] = useState('normal'); // 'normal' | 'lost'
  const [alertSent, setAlertSent] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const auth = isAuthenticated();

  const handleSimulateScan = () => {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 3500);
  };

  return (
    <div className="hp-landing-page">
      <Navbar />

      {/* HERO SECTION */}
      <section className="hp-hero">
        <div className="hp-hero-glow-bg" />
        <div className="hp-hero-container">
          <div className="hp-hero-content">
            <div className="hp-hero-badge">
              <span className="hp-badge-dot" />
              <span>Tecnología de Trazabilidad QR 2026 · Clínica Veterinaria Huellas</span>
            </div>

            <h1 className="hp-hero-title">
              Identificación Inteligente y <span className="hp-text-gradient">Cuidado Médico</span> para tu Mascota
            </h1>

            <p className="hp-hero-desc">
              Placas con código QR de lectura instantánea desde cualquier teléfono, carnet de vacunación digital en la nube y conexión directa con el equipo médico veterinario. Máxima seguridad sin necesidad de baterías ni aplicaciones extras.
            </p>

            <div className="hp-hero-actions">
              {auth ? (
                <Link to="/registrar-mascota" className="hp-hero-btn primary" title="Registrar una nueva mascota con placa QR">
                  <Icon name="paw" size={20} />
                  <span>Registrar Mascota Gratis</span>
                </Link>
              ) : (
                <Link
                  to="/login?redirect=/registrar-mascota&msg=auth_required"
                  className="hp-hero-btn primary"
                  title="Inicia sesión o regístrate para inscribir a tu mascota"
                >
                  <Icon name="user" size={20} />
                  <span>Iniciar Sesión para Registrar Mascota</span>
                </Link>
              )}

              <a href="#simulador" className="hp-hero-btn secondary">
                <Icon name="qr" size={20} />
                <span>Probar Demo de Placa</span>
              </a>
            </div>

            <div className="hp-hero-trust">
              <div className="hp-trust-avatars">
                <span className="hp-avatar t1" title="Caninos protegidos">
                  <Icon name="dog" size={18} />
                </span>
                <span className="hp-avatar t2" title="Felinos protegidos">
                  <Icon name="cat" size={18} />
                </span>
                <span className="hp-avatar t3" title="Trazabilidad QR">
                  <Icon name="paw" size={18} />
                </span>
              </div>
              <div className="hp-trust-text">
                <strong>+1,280 mascotas protegidas</strong>
                <span>Respaldado por médicos veterinarios colegiados</span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL: TARJETA 3D INTERACTIVA */}
          <div className="hp-hero-visual">
            <div className="hp-pet-card-3d">
              <div className="hp-pet-card-header">
                <div className="hp-pet-header-left">
                  <div className="hp-pet-avatar">
                    <img
                      src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80"
                      alt="Toby Beagle"
                      className="hp-pet-img"
                    />
                    <span className="hp-pet-online-dot" />
                  </div>
                  <div>
                    <h3 className="hp-pet-name">Toby</h3>
                    <span className="hp-pet-breed">Beagle · 3 años</span>
                  </div>
                </div>
                <div className="hp-pet-status-pill">
                  <Icon name="check" size={14} />
                  <span>Activo</span>
                </div>
              </div>

              <div className="hp-pet-qr-box">
                <div className="hp-qr-code-mockup">
                  <svg viewBox="0 0 100 100" className="hp-qr-svg">
                    <rect width="100" height="100" fill="white" rx="12" />
                    {/* Marcador superior izquierdo */}
                    <rect x="10" y="10" width="24" height="24" fill="#0A1128" rx="4" />
                    <rect x="15" y="15" width="14" height="14" fill="white" rx="2" />
                    <rect x="18" y="18" width="8" height="8" fill="#2563EB" rx="1.5" />
                    {/* Marcador superior derecho */}
                    <rect x="66" y="10" width="24" height="24" fill="#0A1128" rx="4" />
                    <rect x="71" y="15" width="14" height="14" fill="white" rx="2" />
                    <rect x="74" y="18" width="8" height="8" fill="#2563EB" rx="1.5" />
                    {/* Marcador inferior izquierdo */}
                    <rect x="10" y="66" width="24" height="24" fill="#0A1128" rx="4" />
                    <rect x="15" y="71" width="14" height="14" fill="white" rx="2" />
                    <rect x="18" y="74" width="8" height="8" fill="#2563EB" rx="1.5" />
                    {/* Patrón de datos */}
                    <rect x="40" y="14" width="6" height="6" fill="#0A1128" />
                    <rect x="50" y="20" width="8" height="6" fill="#06B6D4" />
                    <rect x="42" y="32" width="16" height="6" fill="#0A1128" />
                    <rect x="14" y="42" width="8" height="12" fill="#0A1128" />
                    <rect x="26" y="46" width="8" height="8" fill="#2563EB" />
                    <rect x="38" y="46" width="24" height="8" fill="#0A1128" />
                    <rect x="68" y="42" width="18" height="8" fill="#06B6D4" />
                    <rect x="46" y="64" width="12" height="12" fill="#0A1128" />
                    <rect x="64" y="68" width="10" height="8" fill="#2563EB" />
                    <rect x="78" y="64" width="12" height="12" fill="#0A1128" />
                    <circle cx="50" cy="50" r="6" fill="#10B981" />
                  </svg>
                </div>
                <div className="hp-pet-qr-info">
                  <span className="hp-qr-id-tag">Placa #HP-4092</span>
                  <strong>Escanea con cualquier celular</strong>
                  <p>Muestra contacto, vacunas y dirección del dueño al instante.</p>
                </div>
              </div>

              <div className="hp-pet-quick-stats">
                <div className="hp-quick-stat">
                  <Icon name="shield" size={16} />
                  <span>Vacunas al día (5/5)</span>
                </div>
                <div className="hp-quick-stat">
                  <Icon name="doctor" size={16} />
                  <span>Dra. Ana Torres</span>
                </div>
              </div>

              <div className="hp-floating-badge badge-lost">
                <div className="hp-pulse-red" />
                <span>Modo Mascota Perdida Listo</span>
              </div>

              <div className="hp-floating-badge badge-clinic">
                <Icon name="paw" size={16} />
                <span>Clínica Huellas Conectada</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="hp-stats-strip">
        <div className="hp-stats-container">
          <div className="hp-stat-item">
            <span className="hp-stat-number">+1,280</span>
            <span className="hp-stat-label">Mascotas con Placa QR Activa</span>
          </div>
          <div className="hp-stat-item">
            <span className="hp-stat-number">99.8%</span>
            <span className="hp-stat-label">Éxito en Reunificación de Mascotas</span>
          </div>
          <div className="hp-stat-item">
            <span className="hp-stat-number">0 Apps</span>
            <span className="hp-stat-label">Requeridas para el que escanea</span>
          </div>
          <div className="hp-stat-item">
            <span className="hp-stat-number">24/7</span>
            <span className="hp-stat-label">Atención Médica y Soporte</span>
          </div>
        </div>
      </section>

      {/* SIMULADOR INTERACTIVO QR */}
      <section id="simulador" className="hp-sim-section">
        <div className="hp-sim-container">
          <div className="hp-section-header center">
            <div className="hp-section-pill">
              <Icon name="qr" size={14} />
              <span>Simulador en Tiempo Real</span>
            </div>
            <h2>¿Qué ocurre cuando alguien escanea la placa de tu mascota?</h2>
            <p>
              Cualquier persona que encuentre a tu mascota puede escanear su medalla con la cámara de su celular. No necesita descargar aplicaciones. Pruébalo tú mismo aquí:
            </p>
          </div>

          <div className="hp-sim-wrapper">
            {/* Controles del simulador */}
            <div className="hp-sim-controls">
              <button
                className={`hp-sim-mode-btn ${simulatorMode === 'normal' ? 'active' : ''}`}
                onClick={() => setSimulatorMode('normal')}
              >
                <Icon name="shield" size={18} />
                <div>
                  <strong>Modo Habitual / Control</strong>
                  <span>Carnet de vacunas, datos médicos y dueño</span>
                </div>
              </button>

              <button
                className={`hp-sim-mode-btn danger ${simulatorMode === 'lost' ? 'active' : ''}`}
                onClick={() => setSimulatorMode('lost')}
              >
                <Icon name="alert" size={18} />
                <div>
                  <strong>Modo Mascota Extraviada</strong>
                  <span>Alerta máxima urgente y contacto inmediato</span>
                </div>
              </button>

              <div className="hp-sim-explanation">
                <h4>
                  <Icon name="spark" size={18} />
                  ¿Cómo funciona la geolocalización?
                </h4>
                <p>
                  Cuando la placa es escaneada en Modo Extraviada, el navegador solicita un toque para enviar la ubicación aproximada por GPS al teléfono del dueño en tiempo real.
                </p>
                <button
                  className="hp-btn-test-scan"
                  onClick={handleSimulateScan}
                  disabled={alertSent}
                >
                  <Icon name="bell" size={16} />
                  <span>{alertSent ? '¡Notificación enviada al dueño!' : 'Simular escaneo en la calle'}</span>
                </button>
                {alertSent && (
                  <div className="hp-sim-toast">
                    <Icon name="check" size={16} />
                    <span>¡Alerta enviada! "Toby fue escaneado en Miraflores".</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mockup de Celular con la pantalla pública */}
            <div className="hp-sim-phone">
              <div className="hp-phone-frame">
                <div className="hp-phone-notch">
                  <span className="hp-phone-speaker" />
                  <span className="hp-phone-camera" />
                </div>

                <div className={`hp-phone-screen ${simulatorMode === 'lost' ? 'lost-mode' : ''}`}>
                  {simulatorMode === 'lost' ? (
                    /* PANTALLA EN MODO EXTRAVIADO */
                    <div className="hp-screen-emergency animate-fade">
                      <div className="hp-emergency-banner">
                        <Icon name="alert" size={24} />
                        <div>
                          <strong>¡ESTOY PERDIDO, AYÚDAME!</strong>
                          <span>Recompensa ofrecida por mi familia</span>
                        </div>
                      </div>

                      <div className="hp-screen-pet-profile">
                        <img
                          src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80"
                          alt="Toby"
                          className="hp-screen-avatar"
                        />
                        <h3>Toby</h3>
                        <p>Beagle Macho · 3 años</p>
                        <span className="hp-screen-badge-danger">¡Favor retenerlo con cuidado!</span>
                      </div>

                      <div className="hp-emergency-actions">
                        <a href="tel:+51987654321" className="hp-screen-btn call">
                          <Icon name="phone" size={18} />
                          <span>Llamar al Dueño (Jorge Salas)</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setIsChatbotOpen(true)}
                          className="hp-screen-btn whatsapp"
                          style={{ border: 'none', cursor: 'pointer' }}
                        >
                          <Icon name="whatsapp" size={18} />
                          <span>Contactar mediante HuellasBot</span>
                        </button>
                      </div>

                      <div className="hp-screen-info-card">
                        <strong>Condiciones médicas especiales:</strong>
                        <p>Requiere medicación diaria para alergia en la piel. Es muy amigable y responde a su nombre.</p>
                      </div>

                      <div className="hp-screen-clinic-card">
                        <span>Clínica de cabecera:</span>
                        <strong>Clínica Veterinaria Huellas · Tel: 01 445 9090</strong>
                      </div>
                    </div>
                  ) : (
                    /* PANTALLA EN MODO NORMAL */
                    <div className="hp-screen-normal animate-fade">
                      <div className="hp-screen-header-normal">
                        <Logo size={28} />
                        <span>Ficha Oficial Huellas PetID</span>
                      </div>

                      <div className="hp-screen-pet-profile">
                        <img
                          src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80"
                          alt="Toby"
                          className="hp-screen-avatar"
                        />
                        <h3>Toby</h3>
                        <p>Beagle · Color Tricolor</p>
                        <span className="hp-screen-chip-ok">Placa Activa & Verificada</span>
                      </div>

                      <div className="hp-screen-section">
                        <h4>Datos del Propietario</h4>
                        <div className="hp-info-row">
                          <span>Dueño:</span>
                          <strong>Jorge Salas</strong>
                        </div>
                        <div className="hp-info-row">
                          <span>Distrito:</span>
                          <strong>Miraflores, Lima</strong>
                        </div>
                      </div>

                      <div className="hp-screen-section">
                        <h4>Carnet de Vacunación</h4>
                        <div className="hp-vax-pill">
                          <Icon name="check" size={14} />
                          <span>Antirrábica: Vigente (Nov 2026)</span>
                        </div>
                        <div className="hp-vax-pill">
                          <Icon name="check" size={14} />
                          <span>Sextuple Canina: Al día</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILARES / CARACTERÍSTICAS */}
      <section id="tecnologia-qr" className="hp-features-section">
        <div className="hp-features-container">
          <div className="hp-section-header center">
            <div className="hp-section-pill">
              <Icon name="spark" size={14} />
              <span>Innovación en Salud Animal</span>
            </div>
            <h2>Todo lo que tu mascota necesita en una sola placa</h2>
            <p>
              Combinamos la practicidad de la tecnología sin contacto con el rigor de un sistema clínico hospitalario.
            </p>
          </div>

          <div className="hp-features-grid">
            <div className="hp-feature-card">
              <div className="hp-feat-icon blue">
                <Icon name="qr" size={28} />
              </div>
              <h3>Placa QR Indestructible</h3>
              <p>
                Fabricadas con polímeros y aluminio de grado aeroespacial. No usan pilas, son 100% resistentes al agua y al barro. Cualquier persona puede escanearlas sin instalar apps.
              </p>
              <ul className="hp-card-bullet-list">
                <li><Icon name="check" size={15} /> Lectura rápida en menos de 2 segundos</li>
                <li><Icon name="check" size={15} /> Sin cuotas mensuales de mantenimiento</li>
              </ul>
            </div>

            <div className="hp-feature-card">
              <div className="hp-feat-icon green">
                <Icon name="shield" size={28} />
              </div>
              <h3>Carnet Digital de Vacunas</h3>
              <p>
                Lleva en tu bolsillo el registro verificado de antirrábica, desparasitaciones y vacunas anuales. Con recordatorios automáticos antes de cada vencimiento.
              </p>
              <ul className="hp-card-bullet-list">
                <li><Icon name="check" size={15} /> Aceptado para viajes y aerolíneas</li>
                <li><Icon name="check" size={15} /> Alertas de próximas dosis</li>
              </ul>
            </div>

            <div className="hp-feature-card">
              <div className="hp-feat-icon teal">
                <Icon name="doctor" size={28} />
              </div>
              <h3>Historial Clínico Huellas</h3>
              <p>
                Conexión directa con los veterinarios de la Clínica Huellas. Diagnósticos, tratamientos, alergias y recetas quedan sincronizados en tiempo real.
              </p>
              <ul className="hp-card-bullet-list">
                <li><Icon name="check" size={15} /> Trazabilidad médica completa</li>
                <li><Icon name="check" size={15} /> Consulta diagnósticos anteriores</li>
              </ul>
            </div>

            <div className="hp-feature-card">
              <div className="hp-feat-icon red">
                <Icon name="alert" size={28} />
              </div>
              <h3>Alerta GPS de Mascota Perdida</h3>
              <p>
                Activa el "Modo Extravío" desde tu panel con un solo clic. En cuanto alguien escanee la medalla, el sistema te notificará la ubicación exacta en el mapa.
              </p>
              <ul className="hp-card-bullet-list">
                <li><Icon name="check" size={15} /> Notificación instantánea al dueño</li>
                <li><Icon name="check" size={15} /> Botón de contacto directo por WhatsApp</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="hp-steps-section">
        <div className="hp-steps-container">
          <div className="hp-section-header center">
            <div className="hp-section-pill">
              <Icon name="paw" size={14} />
              <span>Sencillo y Rápido</span>
            </div>
            <h2>Protege a tu peludo en 3 simples pasos</h2>
          </div>

          <div className="hp-steps-grid">
            <div className="hp-step-card">
              <div className="hp-step-number">01</div>
              <h3>Crea tu cuenta de propietario</h3>
              <p>
                Regístrate gratis con tus datos de contacto y completa la ficha de tu mascota (nombre, raza, edad y foto).
              </p>
            </div>

            <div className="hp-step-card">
              <div className="hp-step-number">02</div>
              <h3>Vincula la placa con código QR</h3>
              <p>
                Escanea el código de la medalla Huellas PetID para enlazarla permanentemente al perfil de tu engreído.
              </p>
            </div>

            <div className="hp-step-card">
              <div className="hp-step-number">03</div>
              <h3>Tranquilidad médica 24/7</h3>
              <p>
                Tu mascota estará protegida. Revisa su historial, recibe avisos de vacunas y protégela de cualquier extravío.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN PORTALES: PROPIETARIOS VS PERSONAL CLÍNICO */}
      <section id="servicios" className="hp-roles-section">
        <div className="hp-roles-container">
          <div className="hp-section-header center">
            <div className="hp-section-pill">
              <Icon name="users" size={14} />
              <span>Ecosistema Integral</span>
            </div>
            <h2>Dos portales diseñados para cada necesidad</h2>
            <p>
              Una experiencia clara, intuitiva y especializada tanto para los dueños de mascotas como para el equipo médico de la clínica.
            </p>
          </div>

          <div className="hp-roles-grid">
            {/* PORTAL PROPIETARIOS */}
            <div className="hp-role-box owner-box">
              <div className="hp-role-badge owner">
                <Icon name="paw" size={16} />
                <span>Para Propietarios y Familias</span>
              </div>
              <h3>Portal del Dueño de Mascota</h3>
              <p>
                Accede desde tu teléfono o computadora para gestionar la vida de tus animales de compañía.
              </p>
              <ul className="hp-role-features">
                <li><Icon name="check" size={16} /> <strong>Registro Libre:</strong> Crea tu cuenta de forma instantánea.</li>
                <li><Icon name="check" size={16} /> <strong>Ficha de Mascotas:</strong> Modifica teléfonos de contacto y dirección cuando quieras.</li>
                <li><Icon name="check" size={16} /> <strong>Carnet de Vacunación:</strong> Descarga y muestra certificados médicos actualizados.</li>
                <li><Icon name="check" size={16} /> <strong>Modo Extravío:</strong> Activa el protocolo de búsqueda ante emergencias.</li>
              </ul>
              <div className="hp-role-cta">
                <Link to="/register" className="hp-role-btn owner">
                  <span>Crear Cuenta de Propietario</span>
                  <Icon name="arrow" size={18} />
                </Link>
                <Link to="/login" className="hp-role-link">
                  ¿Ya tienes cuenta? Iniciar Sesión
                </Link>
              </div>
            </div>

            {/* PORTAL CLÍNICO */}
            <div className="hp-role-box staff-box">
              <div className="hp-role-badge staff">
                <Icon name="shield" size={16} />
                <span>Personal Clínico Autorizado</span>
              </div>
              <h3>Portal Médico & Administración</h3>
              <p>
                Herramienta de gestión hospitalaria para Veterinarios, Recepción y Dirección Médica.
              </p>
              <ul className="hp-role-features">
                <li><Icon name="check" size={16} /> <strong>Acceso Protegido:</strong> Cuentas institucionales creadas por administración.</li>
                <li><Icon name="check" size={16} /> <strong>Historias Clínicas:</strong> Diagnósticos, prescripciones y tratamientos.</li>
                <li><Icon name="check" size={16} /> <strong>Agenda y Consultas:</strong> Control de citas del día y pacientes en espera.</li>
                <li><Icon name="check" size={16} /> <strong>Control de Vacunas:</strong> Registro oficial de lotes, marcas y fechas de refuerzo.</li>
              </ul>
              <div className="hp-role-cta">
                <Link to="/login?portal=staff" className="hp-role-btn staff">
                  <Icon name="doctor" size={18} />
                  <span>Acceso al Portal Clínico</span>
                </Link>
                <span className="hp-role-subtext">
                  Roles: Veterinario · Recepcionista · Administrador
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN EMERGENCIAS 24/7 EN LANDING */}
      <section id="emergencias" style={{
        padding: '4rem 1.5rem',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(26, 11, 20, 0.95) 100%)',
        borderTop: '1px solid rgba(239, 68, 68, 0.25)',
        borderBottom: '1px solid rgba(239, 68, 68, 0.25)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.9rem',
            borderRadius: '999px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#F87171',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
            Hospital de Urgencias Médicas 24/7
          </span>

          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.8rem' }}>
            Atención Inmediata de <span style={{ color: '#F87171' }}>Emergencias Críticas</span>
          </h2>

          <p style={{ color: '#CBD5E1', maxWidth: '700px', margin: '0 auto 2rem', fontSize: '1rem', lineHeight: 1.6 }}>
            Si tu mascota presenta vómitos continuos, dificultad para respirar, traumatismos o convulsiones, acude a nuestra sede central en Surco con médicos intensivistas de guardia permanente.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <a
              href="tel:+51987654321"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.9rem 1.6rem',
                borderRadius: '14px',
                background: '#EF4444',
                color: 'white',
                fontWeight: 800,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.45)'
              }}
            >
              <Icon name="phone" size={20} />
              <span>Central 24 Horas: +51 987 654 321</span>
            </a>

            <button
              type="button"
              onClick={() => setIsChatbotOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.9rem 1.6rem',
                borderRadius: '14px',
                background: '#10B981',
                color: 'white',
                fontWeight: 800,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Icon name="whatsapp" size={20} />
              <span>Triage Inmediato HuellasBot</span>
            </button>

            <Link
              to="/emergencias"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.9rem 1.6rem',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none'
              }}
            >
              <Icon name="alert" size={18} />
              <span>Ver Guía Completa de Emergencias ↗</span>
            </Link>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '16px',
            padding: '1.2rem',
            maxWidth: '650px',
            margin: '0 auto',
            color: '#94A3B8',
            fontSize: '0.86rem'
          }}>
            📍 <strong>Sede de Emergencias:</strong> Av. Primavera 1234, Santiago de Surco, Lima · Estacionamiento para ambulancias y clientes.
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="hp-cta-section">
        <div className="hp-cta-container">
          <div className="hp-cta-card">
            <div className="hp-cta-content">
              <h2>¿Listo para brindarle la mejor protección a tu mascota?</h2>
              <p>
                Únete a miles de familias que ya confían en Huellas PetID y en la Clínica Veterinaria Huellas para mantener a sus mascotas saludables y seguras.
              </p>
              <div className="hp-cta-btns">
                <Link to="/register" className="hp-cta-btn primary">
                  <Icon name="paw" size={18} />
                  <span>Registrarme como Propietario</span>
                </Link>
                <Link to="/login?portal=staff" className="hp-cta-btn outline">
                  <Icon name="shield" size={18} />
                  <span>Ingreso Personal Clínico</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhatsAppChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        petName="Toby"
        ownerName="Jorge Salas"
        vaccineName="Alerta de Rescate Huellas PetID"
        dueDate="Inmediato"
        petCode="HP-4092"
      />

      <Footer />
    </div>
  );
}
