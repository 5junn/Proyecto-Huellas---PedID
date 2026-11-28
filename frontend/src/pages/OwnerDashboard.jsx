// src/pages/OwnerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import CollarQRTag from '../components/CollarQRTag';
import ClinicContactDialog from '../components/ClinicContactDialog';
import { apiFetch } from '../services/apiClient';
import { getRazasPorEspecie } from '../data/razasData';
import '../styles/owner.css';

export default function OwnerDashboard({ user }) {
  const [mascotas, setMascotas] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [savingPet, setSavingPet] = useState(false);
  const [modalCarnetOpen, setModalCarnetOpen] = useState(false);
  const [modalNewPetOpen, setModalNewPetOpen] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');

  const [gpsAlerts, setGpsAlerts] = useState([]);

  // Estados para Modal de Vista QR & Collar
  const [modalQRViewOpen, setModalQRViewOpen] = useState(false);
  const [selectedQRPet, setSelectedQRPet] = useState(null);
  const [qrModalStage, setQrModalStage] = useState('collar'); // 'collar' | 'habitual'

  // Estados para Recordatorios por WhatsApp (API Externa + IA)
  const [modalWhatsAppOpen, setModalWhatsAppOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState({ pet: null, vaccine: null });

  // Formulario nueva mascota
  const [newPet, setNewPet] = useState({
    nombre: '',
    especie: 'Perro',
    raza: 'Beagle',
    edad: '',
    sexo: 'Macho',
    peso: '',
    color: '',
    foto: ''
  });

  const handleModalPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setNewPet((prev) => ({ ...prev, foto: event.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const loadFromBackend = React.useCallback(async (signal) => {
    const [pets, alerts] = await Promise.allSettled([
      apiFetch('/mascotas', { signal }),
      apiFetch('/mascotas/alertas-gps', { signal }),
    ]);
    if (signal?.aborted) return;
    if (pets.status === 'fulfilled') setMascotas(pets.value);
    if (alerts.status === 'fulfilled') setGpsAlerts(alerts.value);
    setLoadError(pets.reason?.message || alerts.reason?.message || '');
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => loadFromBackend(controller.signal);
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('huellas_alerta_gps_recibida', refresh);
    return () => {
      controller.abort();
      window.removeEventListener('focus', refresh);
      window.removeEventListener('huellas_alerta_gps_recibida', refresh);
    };
  }, [loadFromBackend]);

  const handleResolveGpsAlert = async (alertId) => {
    setActionError('');
    try {
      await apiFetch(`/mascotas/alertas-gps/${alertId}/resolver`, { method: 'PATCH' });
      setGpsAlerts((alerts) => alerts.filter((alert) => alert.id !== alertId));
      setAlertSuccess('Alerta de rescate archivada.');
      setTimeout(() => setAlertSuccess(''), 4500);
    } catch (error) {
      setActionError(error.message);
    }
  };

  const toggleModoExtravio = async (petId) => {
    const pet = mascotas.find((entry) => entry.id === petId);
    if (!pet) return;
    setActionError('');
    try {
      const { estadoExtravio } = await apiFetch(`/mascotas/${encodeURIComponent(pet.codigoQR)}/extravio`, {
        method: 'PATCH',
        body: JSON.stringify({ estadoExtravio: !pet.estadoExtravio }),
      });
      setMascotas((current) => current.map((entry) =>
        entry.id === petId ? { ...entry, estadoExtravio } : entry
      ));
      setAlertSuccess(`Modo extravío ${estadoExtravio ? 'activado' : 'desactivado'} para ${pet.nombre}.`);
      setTimeout(() => setAlertSuccess(''), 4500);
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleOpenQRModal = (pet) => {
    setSelectedQRPet(pet);
    setQrModalStage('collar');
    setModalQRViewOpen(true);
  };

  const handleOpenWhatsAppReminder = (pet, vaccine) => {
    setWhatsAppTarget({
      pet,
      vaccine
    });
    setModalWhatsAppOpen(true);
  };

  const handleCreatePet = async (event) => {
    event.preventDefault();
    if (!newPet.nombre.trim() || savingPet) return;
    setSavingPet(true);
    setActionError('');
    try {
      const saved = await apiFetch('/mascotas', {
        method: 'POST',
        body: JSON.stringify(newPet),
      });
      setModalNewPetOpen(false);
      setNewPet({ nombre: '', especie: 'Perro', raza: 'Beagle', edad: '', sexo: 'Macho', peso: '', color: '', foto: '' });
      setAlertSuccess(`${newPet.nombre} se registró con la placa ${saved.codigo_qr}.`);
      setTimeout(() => setAlertSuccess(''), 4500);
      await loadFromBackend();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSavingPet(false);
    }
  };

  return (
    <div className="hp-owner-page">
      <Navbar />

      <main className="hp-owner-main">
        <div className="hp-owner-container">
          {/* HEADER DE BIENVENIDA */}
          <section className="hp-owner-welcome">
            <div className="hp-welcome-left">
              <span className="hp-welcome-pill">
                <Icon name="paw" size={15} />
                <span>Portal Oficial del Propietario</span>
              </span>
              <h1>Hola, {user.nombres.split(' ')[0]}</h1>
              <p>
                Gestiona tus mascotas registradas, consulta su carnet de vacunación en la nube, visualiza las placas QR de sus collares y programa recordatorios por WhatsApp.
              </p>
            </div>

            <div className="hp-welcome-actions" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <Link
                to="/registrar-mascota"
                className="hp-btn-add-pet"
                style={{ textDecoration: 'none' }}
              >
                <Icon name="plus" size={18} />
                <span>Registrar Mascota con Placa QR</span>
              </Link>
            </div>
          </section>

          {/* ALERTA FLOTANTE DE ACCIÓN */}
          {loading && <p role="status">Cargando tus mascotas…</p>}
          {loadError && <p role="alert">{loadError} <button type="button" onClick={() => loadFromBackend()}>Reintentar</button></p>}
          {actionError && !modalNewPetOpen && <p role="alert">{actionError}</p>}
          {alertSuccess && (
            <div className="hp-owner-alert animate-fade" role="status">
              <Icon name="shield" size={20} />
              <span>{alertSuccess}</span>
            </div>
          )}

          {/* BANNER DE ALERTA GPS DE RESCATE EN TIEMPO REAL (MULTI-ALERTA) */}
          {gpsAlerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {gpsAlerts.map((alerta) => (
                <div
                  key={alerta.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.35) 100%)',
                    border: '2px solid #EF4444',
                    borderRadius: '16px',
                    padding: '1.2rem 1.5rem',
                    boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{
                        background: '#EF4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 15px rgba(239, 68, 68, 0.7)'
                      }}>
                        <Icon name="pin" size={22} />
                      </div>
                      <div>
                        <strong style={{ color: '#FCA5A5', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          🚨 ¡ALERTA DE RESCATE GPS EN VIVO RECIBIDA!
                        </strong>
                        <span style={{ color: '#E2E8F0', fontSize: '0.82rem' }}>
                          Alguien acaba de escanear la placa de tu mascota <strong>{alerta.nombreMascota}</strong> (Placa {alerta.codigoMascota}) y transmitió su ubicación de rescate vía satélite.
                        </span>
                      </div>
                    </div>
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.3)',
                      color: '#FEE2E2',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {alerta.fechaCompleta}
                    </span>
                  </div>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <span style={{ color: '#CBD5E1' }}>
                      📍 Coordenadas de rescate: <strong style={{ color: '#38BDF8' }}>{alerta.lat}, {alerta.lng}</strong> (Margen: ±{alerta.precision})
                    </span>
                    <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                      Estado: <strong style={{ color: '#34D399' }}>Activa para recuperación</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <a
                      href={alerta.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        padding: '0.65rem 1.1rem',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                      }}
                    >
                      <Icon name="pin" size={17} />
                      <span>Abrir Ubicación en Google Maps</span>
                    </a>

                    <button
                      onClick={() => handleResolveGpsAlert(alerta.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10B981',
                        color: '#34D399',
                        padding: '0.65rem 1rem',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon name="check" size={16} />
                      <span>Archivar alerta</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LISTADO DE NOTIFICACIONES DE MASCOTAS EXTRAVIADAS (UNA POR CADA MASCOTA PERDIDA) */}
          {mascotas.filter((m) => m.estadoExtravio).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
              {mascotas.filter((m) => m.estadoExtravio).map((lostPet) => {
                const petGps = gpsAlerts.find(
                  (a) =>
                    a.codigoMascota &&
                    a.codigoMascota.toUpperCase() === (lostPet.codigoQR || lostPet.id || '').toUpperCase()
                );
                return (
                  <div
                    key={lostPet.id || lostPet.codigoQR}
                    className="hp-lost-pet-banner animate-fade"
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1.2rem 1.4rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{
                          background: '#EF4444',
                          color: 'white',
                          borderRadius: '50%',
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 12px rgba(239, 68, 68, 0.7)'
                        }}>
                          <Icon name="alert" size={22} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '1.02rem', color: '#FEE2E2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🚨 ¡PROTOCOLO DE EXTRAVÍO ACTIVO: {lostPet.nombre.toUpperCase()}!
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: '#FECACA' }}>
                            {lostPet.especie} · {lostPet.raza} · Placa: <strong>{lostPet.codigoQR || lostPet.id}</strong>
                          </span>
                        </div>
                      </div>
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.35)',
                        color: '#FFFFFF',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        🔴 MODO EXTRAVIADO ACTIVO
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#F3F4F6', lineHeight: 1.5 }}>
                      La placa QR del collar de <strong>{lostPet.nombre}</strong> está transmitiendo la pantalla roja de auxilio con tus números telefónicos de contacto directo ({user.telefono || 'sin teléfono registrado'}) para llamada inmediata de rescate.
                    </p>

                    {petGps && (
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        padding: '0.6rem 0.9rem',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        color: '#93C5FD',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Icon name="pin" size={16} />
                        <span>Última ubicación GPS recibida: {petGps.fechaCompleta} ({petGps.lat}, {petGps.lng})</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                      <Link
                        to={`/pet/${lostPet.codigoQR || lostPet.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: '#2563EB',
                          color: '#FFFFFF',
                          padding: '0.55rem 1rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <Icon name="qr" size={16} />
                        <span>Ver Ficha QR de Rescate</span>
                      </Link>

                      <button
                        onClick={() => toggleModoExtravio(lostPet.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'rgba(16, 185, 129, 0.25)',
                          border: '1px solid #10B981',
                          color: '#34D399',
                          padding: '0.55rem 0.95rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="check" size={16} />
                        <span>Desactivar Extravío (Mascota Localizada)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* GRID DE MASCOTAS REGISTRADAS */}
          <section className="hp-pets-section">
            <div className="hp-section-title-row">
              <div>
                <h2>Mis Mascotas Protegidas ({mascotas.length})</h2>
                <p>Haz clic en "Vista QR" para consultar y compartir la ficha del collar, o revisa su carnet y recordatorios por WhatsApp.</p>
              </div>
            </div>

            {mascotas.length === 0 && !loading && !loadError ? (
              <div style={{
                background: 'rgba(20, 28, 44, 0.65)',
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                padding: '3rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                margin: '1.5rem 0'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon name="paw" size={32} />
                </div>
                <div>
                  <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '0.4rem' }}>
                    Aún no tienes mascotas registradas en esta cuenta ({user.correo})
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto' }}>
                    Inscribe a tu perro o gato para obtener su placa inteligente con código QR y acceder a su carnet clínico digitalizado.
                  </p>
                </div>
                <Link
                  to="/registrar-mascota"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#10B981',
                    color: '#FFFFFF',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Icon name="plus" size={18} />
                  <span>Registrar Mi Primera Mascota</span>
                </Link>
              </div>
            ) : (
              <div className="hp-pets-grid">
              {mascotas.map((pet) => (
                <article
                  key={pet.id}
                  className={`hp-pet-card-owner ${pet.estadoExtravio ? 'is-lost' : ''}`}
                >
                  <div className="hp-pet-card-top">
                    <div className="hp-pet-media">
                      {pet.foto ? <img src={pet.foto} alt={pet.nombre} className="hp-pet-photo" /> : <Icon name="paw" size={28} />}
                      {pet.estadoExtravio && (
                        <span className="hp-pet-lost-badge">
                          <Icon name="alert" size={12} />
                          <span>¡PERDIDO!</span>
                        </span>
                      )}
                    </div>

                    <div className="hp-pet-meta">
                      <div className="hp-pet-name-row">
                        <h3>{pet.nombre}</h3>
                        <span className="hp-qr-code-pill">Placa {pet.codigoQR}</span>
                      </div>
                      <span className="hp-pet-sub">
                        {pet.especie} · {pet.raza} · {pet.sexo}
                      </span>
                      <div className="hp-pet-specs">
                        <span><strong>Edad:</strong> {pet.edad}</span>
                        <span><strong>Peso:</strong> {pet.peso}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hp-pet-body">
                    {/* ESTADO DE VACUNAS */}
                    <div className="hp-vax-summary">
                      <div className="hp-vax-summary-header">
                        <span className="hp-vax-title">
                          <Icon name="shield" size={15} />
                          <span>Carnet Clínico Huellas</span>
                        </span>
                        <span className="hp-vax-status ok">
                          {pet.vacunas?.length || 0} vacunas registradas
                        </span>
                      </div>
                      <p className="hp-vax-note">
                        {pet.vacunas?.length ? `Última vacuna: ${pet.vacunas[0].nombre} (${pet.vacunas[0].fecha})` : 'Todavía no hay vacunas registradas.'}
                      </p>

                      {/* BOTÓN RÁPIDO PARA RECORDATORIO POR WHATSAPP */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppReminder(pet, pet.vacunas?.[0])}
                        style={{
                          marginTop: '0.6rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '0.35rem 0.7rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="whatsapp" size={14} />
                        <span>Consultar por WhatsApp</span>
                      </button>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="hp-pet-actions-row">
                      <button
                        className="hp-pet-btn carnet"
                        onClick={() => {
                          setSelectedPet(pet);
                          setModalCarnetOpen(true);
                        }}
                      >
                        <Icon name="clipboard" size={16} />
                        <span>Ver Carnet Digital</span>
                      </button>

                      {/* BOTÓN VISTA QR MODAL INTERACTIVO */}
                      <button
                        type="button"
                        onClick={() => handleOpenQRModal(pet)}
                        className="hp-pet-btn preview"
                        title="Ver ventana modal con el QR del collar y datos de la mascota"
                      >
                        <Icon name="qr" size={16} />
                        <span>Vista QR</span>
                      </button>
                    </div>

                    {/* SWITCH MODO EXTRAVIADO */}
                    <div className="hp-lost-toggle-box">
                      <div className="hp-lost-toggle-text">
                        <strong>Modo Mascota Extraviada</strong>
                        <span>Muestra alerta roja y teléfonos de emergencia al escanear</span>
                      </div>
                      <button
                        type="button"
                        className={`hp-switch-btn ${pet.estadoExtravio ? 'active' : ''}`}
                        onClick={() => toggleModoExtravio(pet.id)}
                        aria-pressed={pet.estadoExtravio}
                      >
                        <span className="hp-switch-handle" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          </section>

          {/* SERVICIOS DE LA CLÍNICA HUELLAS PARA EL PROPIETARIO */}
          <section className="hp-owner-clinic-card">
            <div className="hp-clinic-card-left">
              <div className="hp-clinic-icon-box">
                <Icon name="doctor" size={28} />
              </div>
              <div>
                <h3>¿Tu mascota necesita atención médica o vacunas?</h3>
                <p>
                  Los médicos de la <strong>Clínica Veterinaria Huellas</strong> están disponibles para consultas generales, desparasitaciones, cirugías y emergencias las 24 horas del día.
                </p>
              </div>
            </div>

            <div className="hp-clinic-card-right">
              <button
                type="button"
                onClick={() => {
                  setWhatsAppTarget({ pet: null, vaccine: null });
                  setModalWhatsAppOpen(true);
                }}
                className="hp-btn-whatsapp-clinic"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                <Icon name="whatsapp" size={18} />
                <span>Consultar con la clínica</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* ========================================================
          MODAL 1: VISTA QR EN EL COLLAR & ESCANEO A MODO HABITUAL/CONTROL
         ======================================================== */}
      {modalQRViewOpen && selectedQRPet && (
        <div className="hp-modal-overlay" onClick={() => setModalQRViewOpen(false)}>
          <div
            className="hp-modal-card"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="hp-modal-header">
              <div className="hp-modal-title-group">
                <Icon name="qr" size={26} />
                <div>
                  <h3>
                    {qrModalStage === 'collar'
                      ? `Placa QR en Collar de ${selectedQRPet.nombre}`
                      : `Ficha Pública: ${selectedQRPet.nombre} (Modo Habitual)`}
                  </h3>
                  <span>
                    {qrModalStage === 'collar'
                      ? 'Simulación física de la placa de identificación inteligente'
                      : 'Protegido por Ley de Protección de Datos Personales N° 29733'}
                  </span>
                </div>
              </div>
              <button
                className="hp-modal-close-btn"
                onClick={() => setModalQRViewOpen(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Pestañas de navegación interna del modal */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(15, 23, 42, 0.5)'
            }}>
              <button
                type="button"
                onClick={() => setQrModalStage('collar')}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  background: qrModalStage === 'collar' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: qrModalStage === 'collar' ? '#38BDF8' : '#94A3B8',
                  border: 'none',
                  borderBottom: qrModalStage === 'collar' ? '2px solid #38BDF8' : '2px solid transparent',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Icon name="paw" size={15} />
                <span>1. Placa en Collar</span>
              </button>

              <button
                type="button"
                onClick={() => setQrModalStage('habitual')}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  background: qrModalStage === 'habitual' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: qrModalStage === 'habitual' ? '#10B981' : '#94A3B8',
                  border: 'none',
                  borderBottom: qrModalStage === 'habitual' ? '2px solid #10B981' : '2px solid transparent',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Icon name="shield" size={15} />
                <span>2. Modo Habitual / Control</span>
              </button>
            </div>

            <div className="hp-modal-body" style={{ padding: '1.5rem' }}>
              {qrModalStage === 'collar' ? (
                /* FASE 1: COLLAR Y PLACA CON CÓDIGO QR */
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <p style={{ color: '#CBD5E1', fontSize: '0.88rem', margin: 0 }}>
                      Esta es la medalla que llevará <strong>{selectedQRPet.nombre}</strong> en su collar. Cualquier teléfono con cámara puede escanear este código QR:
                    </p>
                  </div>

                  <CollarQRTag
                    pet={selectedQRPet}
                    onScanSimulate={() => setQrModalStage('habitual')}
                  />
                </div>
              ) : (
                /* FASE 2: TRAS ESCANEAR -> MODO HABITUAL / CONTROL (LEY PROTECCIÓN DE DATOS) */
                <div style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  borderRadius: '20px',
                  padding: '1.4rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {/* Badge de estado seguro */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#10B981',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    marginBottom: '1.2rem'
                  }}>
                    <Icon name="shield" size={18} />
                    <span>
                      <strong>Escaneo Exitoso · Modo Habitual/Control</strong>: La mascota no está reportada como extraviada.
                    </span>
                  </div>

                  {/* Ficha: Foto + Nombre */}
                  <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                    <img
                      src={selectedQRPet.foto}
                      alt={selectedQRPet.nombre}
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #10B981',
                        marginBottom: '0.5rem',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                      }}
                    />
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                      {selectedQRPet.nombre}
                    </h3>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                      {selectedQRPet.especie} · {selectedQRPet.raza} · {selectedQRPet.edad} · {selectedQRPet.sexo}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '0.4rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38BDF8'
                    }}>
                      Placa Verificada: {selectedQRPet.codigoQR}
                    </span>
                  </div>

                  {/* SECCIÓN: DATOS DEL PROPIETARIO */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '14px',
                    padding: '0.85rem',
                    marginBottom: '0.85rem',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <Icon name="user" size={15} />
                      <strong style={{ color: '#F59E0B', textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                        Datos del Propietario
                      </strong>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                        <span style={{ color: '#94A3B8' }}>Dueño:</span>
                        <strong style={{ color: '#FFFFFF' }}>{selectedQRPet.propietario || user.nombres || 'Sin nombre registrado'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94A3B8' }}>Distrito:</span>
                        <strong style={{ color: '#FFFFFF' }}>{selectedQRPet.distrito || selectedQRPet.direccion || 'Miraflores, Lima'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Cumplimiento de la Ley de Protección de Datos */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.8rem',
                    fontSize: '0.74rem',
                    color: '#94A3B8',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem'
                  }}>
                    <Icon name="shield" size={15} />
                    <div>
                      <strong style={{ color: '#A7F3D0' }}>Ficha Oficial Verificada (Ley N° 29733): </strong>
                      Mascota vinculada oficialmente a la cuenta del propietario en la Clínica Veterinaria Huellas.
                    </div>
                  </div>

                  {/* Alergias */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.8rem',
                    borderRadius: '12px',
                    marginBottom: '0.8rem',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ color: '#F59E0B', fontWeight: 700, marginBottom: '0.2rem' }}>
                      ⚠️ Alergias y Cuidados Clínicos:
                    </div>
                    <p style={{ margin: 0, color: '#E2E8F0', lineHeight: 1.4 }}>
                      {selectedQRPet.alergias || 'Sin alergias médicas conocidas.'}
                    </p>
                  </div>

                  {/* Vacunas */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.8rem',
                    borderRadius: '12px',
                    marginBottom: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.82rem' }}>
                        💉 Vacunación Registrada:
                      </span>
                      <span style={{ color: '#10B981', fontSize: '0.72rem', fontWeight: 700 }}>
                        {selectedQRPet.vacunas?.length || 0} vacunas registradas
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {selectedQRPet.vacunas?.map((vax, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#CBD5E1' }}>
                          <span>• {vax.nombre}</span>
                          <span style={{ color: '#10B981' }}>✓ {vax.estado || 'Vigente'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Datos de la Clínica */}
                  <div style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    padding: '0.8rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: '#CBD5E1'
                  }}>
                    <strong style={{ color: '#38BDF8', display: 'block' }}>
                      Clínica Veterinaria Huellas (Surco, Lima)
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      <Link to="/emergencias">Ver contacto de atención</Link>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="hp-modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              {qrModalStage === 'habitual' ? (
                <button
                  type="button"
                  className="hp-modal-btn"
                  onClick={() => setQrModalStage('collar')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                >
                  <Icon name="arrowLeft" size={15} />
                  <span>Volver al Collar</span>
                </button>
              ) : (
                <div />
              )}

              <Link
                to={`/pet/${selectedQRPet.codigoQR}`}
                target="_blank"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                  color: '#38BDF8',
                  textDecoration: 'none',
                  fontWeight: 700
                }}
              >
                <span>Abrir Ficha Web Completa ↗</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: CONTACTO DE LA CLÍNICA
         ======================================================== */}
      <ClinicContactDialog
        isOpen={modalWhatsAppOpen}
        onClose={() => setModalWhatsAppOpen(false)}
        petName={whatsAppTarget.pet?.nombre}
        vaccineName={whatsAppTarget.vaccine?.nombre}
        dueDate={whatsAppTarget.vaccine?.proxima}
        petCode={whatsAppTarget.pet?.codigoQR}
      />

      {/* ========================================================
          MODAL 3: CARNET DE VACUNACIÓN DIGITAL
         ======================================================== */}
      {modalCarnetOpen && selectedPet && (
        <div className="hp-modal-overlay" onClick={() => setModalCarnetOpen(false)}>
          <div className="hp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hp-modal-header">
              <div className="hp-modal-title-group">
                <Logo size={32} />
                <div>
                  <h3>Carnet Oficial de Vacunación</h3>
                  <span>Clínica Veterinaria Huellas · Paciente: {selectedPet.nombre}</span>
                </div>
              </div>
              <button
                className="hp-modal-close-btn"
                onClick={() => setModalCarnetOpen(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="hp-modal-body">
              <div className="hp-carnet-pet-summary">
                {selectedPet.foto ? <img src={selectedPet.foto} alt={selectedPet.nombre} className="hp-carnet-avatar" /> : <Icon name="paw" size={28} />}
                <div>
                  <h4>{selectedPet.nombre} ({selectedPet.raza})</h4>
                  <p>Código de Trazabilidad: <strong>{selectedPet.codigoQR}</strong></p>
                  <p>Propietario Responsable: <strong>{user.nombres}</strong></p>
                </div>
              </div>

              <div className="hp-carnet-table-wrap">
                <table className="hp-carnet-table">
                  <thead>
                    <tr>
                      <th>Vacuna / Tratamiento</th>
                      <th>Fecha de Aplicación</th>
                      <th>Próximo Refuerzo</th>
                      <th>Veterinario Responsable</th>
                      <th>Recordatorio WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPet.vacunas?.map((vax, idx) => (
                      <tr key={idx}>
                        <td><strong>{vax.nombre}</strong></td>
                        <td>{vax.fecha}</td>
                        <td>{vax.proxima}</td>
                        <td>{vax.vet}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsAppReminder(selectedPet, vax)}
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10B981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Icon name="whatsapp" size={13} />
                            <span>Programar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="hp-carnet-medical-notes">
                <strong>Alergias y Observaciones Clínicas:</strong>
                <p>{selectedPet.alergias}</p>
              </div>
            </div>

            <div className="hp-modal-footer">
              <button
                className="hp-modal-btn print"
                onClick={() => window.print()}
              >
                <Icon name="clipboard" size={16} />
                <span>Imprimir / Exportar Carnet PDF</span>
              </button>
              <button
                className="hp-modal-btn close"
                onClick={() => setModalCarnetOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: REGISTRAR NUEVA MASCOTA RÁPIDA
         ======================================================== */}
      {modalNewPetOpen && (
        <div className="hp-modal-overlay" onClick={() => setModalNewPetOpen(false)}>
          <div className="hp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hp-modal-header">
              <div className="hp-modal-title-group">
                <Icon name="paw" size={26} />
                <div>
                  <h3>Registrar Nueva Mascota</h3>
                  <span>Vincula a tu engreído a tu cuenta de propietario</span>
                </div>
              </div>
              <button
                className="hp-modal-close-btn"
                onClick={() => setModalNewPetOpen(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePet} className="hp-modal-form">
              {actionError && <p role="alert">{actionError}</p>}
              <div className="hp-form-grid-2">
                <div className="form-group">
                  <label>Nombre de la Mascota *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rocky, Pelusa..."
                    value={newPet.nombre}
                    onChange={(e) => setNewPet({ ...newPet, nombre: e.target.value })}
                    className="form-input-clean"
                  />
                </div>

                <div className="form-group">
                  <label>Especie</label>
                  <select
                    value={newPet.especie}
                    onChange={(e) => {
                      const esp = e.target.value;
                      const rList = getRazasPorEspecie(esp);
                      setNewPet({ ...newPet, especie: esp, raza: rList[0] || 'Mestizo' });
                    }}
                    className="form-input-clean"
                  >
                    <option value="Perro">Canino (Perro)</option>
                    <option value="Gato">Felino (Gato)</option>
                    <option value="Conejo">Conejo</option>
                    <option value="Ave">Ave</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="hp-form-grid-2">
                <div className="form-group">
                  <label>Raza (Catálogo Normalizado) *</label>
                  <select
                    value={newPet.raza}
                    onChange={(e) => setNewPet({ ...newPet, raza: e.target.value })}
                    className="form-input-clean"
                  >
                    {getRazasPorEspecie(newPet.especie).map((r) => (
                      <option key={r} value={r} style={{ background: '#0F172A', color: '#FFFFFF' }}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Sexo</label>
                  <select
                    value={newPet.sexo}
                    onChange={(e) => setNewPet({ ...newPet, sexo: e.target.value })}
                    className="form-input-clean"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>
              </div>

              <div className="hp-form-grid-2">
                <div className="form-group">
                  <label>Edad Aproximada</label>
                  <input
                    type="text"
                    placeholder="Ej. 2 años, 8 meses"
                    value={newPet.edad}
                    onChange={(e) => setNewPet({ ...newPet, edad: e.target.value })}
                    className="form-input-clean"
                  />
                </div>

                <div className="form-group">
                  <label>Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej. 14.5"
                    value={newPet.peso}
                    onChange={(e) => setNewPet({ ...newPet, peso: e.target.value })}
                    className="form-input-clean"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.8rem' }}>
                <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Foto de la Mascota</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.4rem' }}>
                  {newPet.foto && (
                    <img
                      src={newPet.foto}
                      alt="Foto"
                      style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10B981' }}
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    id="modal-quick-photo"
                    onChange={handleModalPhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="modal-quick-photo"
                    style={{
                      padding: '0.5rem 0.9rem',
                      borderRadius: '8px',
                      background: '#0284C7',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Icon name="upload" size={15} />
                    <span>{newPet.foto ? 'Cambiar Foto' : 'Cargar Foto de la Mascota'}</span>
                  </label>
                </div>
              </div>

              <div className="hp-modal-footer">
                <button
                  type="button"
                  className="hp-modal-btn close"
                  onClick={() => setModalNewPetOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="hp-modal-btn primary" disabled={savingPet}>
                  <Icon name="check" size={16} />
                  <span>Guardar y Generar Placa QR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
