// src/pages/PetQRView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import CollarQRTag from '../components/CollarQRTag';
import WhatsAppChatbotModal from '../components/WhatsAppChatbotModal';
import { isStaff } from '../services/authService';
import { apiFetch } from '../services/apiClient';
import { askEmergencyAssistantAI } from '../services/whatsappService';
import '../styles/landing.css';

const DEFAULT_PET_BASE = {
  codigo: 'HP-4092',
  nombre: 'Toby',
  especie: 'Canino',
  raza: 'Beagle Tricolor',
  edad: '3 años',
  sexo: 'Macho',
  peso: '12.4 kg',
  color: 'Tricolor',
  propietario: 'Jorge Salas',
  telefono: '+51 987 654 321',
  distrito: 'Miraflores, Lima - Perú',
  foto: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
  clinica: 'Clínica Veterinaria Huellas',
  dirClinica: 'Av. Primavera 1234, Santiago de Surco, Lima',
  telClinica: '+51 987 654 321',
  horarioClinica: 'Lunes a Domingo · Emergencias 24/7',
  vacunas: [
    { nombre: 'Antirrábica', fecha: '14 Oct 2026', proxima: '14 Oct 2027', estado: 'Vigente', vet: 'Dra. Ana Torres' },
    { nombre: 'Sextuple Canina', fecha: '20 Ago 2026', proxima: '20 Ago 2027', estado: 'Vigente', vet: 'Dra. Ana Torres' },
    { nombre: 'Desparasitación Interna', fecha: '02 Nov 2026', proxima: '02 Feb 2027', estado: 'Vigente', vet: 'Dr. Luis Vega' },
  ],
  alergias: 'Alergia severa a picaduras de pulgas. No administrar derivados de penicilina.',
};

export default function PetQRView() {
  const { codigo } = useParams();
  return <PetQRCard key={codigo} codigo={codigo} />;
}

function PetQRCard({ codigo }) {
  const navigate = useNavigate();
  const demo = codigo.toLowerCase() === 'demo';
  const [pet, setPet] = useState(demo ? { ...DEFAULT_PET_BASE, codigo: 'demo', telefono: null } : null);
  const [loadError, setLoadError] = useState('');
  const [gpsError, setGpsError] = useState('');
  const isLost = Boolean(pet?.estadoExtravio);
  const [gpsSent, setGpsSent] = useState(false);
  const [gpsSending, setGpsSending] = useState(false);
  const [gpsSentData, setGpsSentData] = useState(null);
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [showCollarView, setShowCollarView] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Estado del Asistente de Emergencia IA
  const [emergencyGuide, setEmergencyGuide] = useState(null);
  const [emergencyQuestion, setEmergencyQuestion] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    apiFetch(`/mascotas/${encodeURIComponent(codigo)}`, { authenticated: false, signal: controller.signal })
      .then(setPet)
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError(error.status === 404 ? 'Placa QR no encontrada.' : error.message);
      });
    return () => controller.abort();
  }, [codigo, demo]);

  // Actualizar guía del Asistente de Emergencia IA al cambiar modo o mascota
  useEffect(() => {
    if (!pet) return;
    let active = true;
    askEmergencyAssistantAI({
      codigo_qr: demo ? undefined : pet.codigo,
      petName: pet.nombre,
      especie: pet.especie,
      raza: pet.raza,
      alergias: pet.alergias,
      isLost,
      question: ''
    })
      .then((res) => {
        if (active && res) setEmergencyGuide(res);
      })
      .catch(() => {
        if (!active) return;
        setEmergencyGuide({
          pasos_inmediatos: isLost
            ? [
                `1. Resguarda a ${pet.nombre} en un lugar tranquilo con agua fresca.`,
                '2. Pulsa "Compartir mi Ubicación de Rescate (GPS)" para alertar al dueño.',
                `3. Si está herido, llama directo a la Clínica Huellas (${pet.telClinica}).`
              ]
            : [
                `1. ${pet.nombre} se encuentra en Modo Control Seguro.`,
                `2. Revisa sus alergias médicas antes de darle cualquier alimento.`,
                `3. Ante una urgencia médica, llama directamente a la Clínica Huellas (${pet.telClinica}).`
              ],
          respuesta_asistente: isLost
            ? `Protocolo de Rescate activo para ${pet.nombre}. Usa el botón de GPS o llamada directa.`
            : `Modo Control Seguro: la privacidad del dueño está protegida (Ley N° 29733).`,
          boton_llamada_clinica: {
            etiqueta: `Llamar a Clínica Huellas 24/7 (${pet.telClinica})`,
            tel: `tel:${(pet.telClinica || '+51987654321').replace(/[^0-9+]/g, '')}`,
          },
          privacidad_aplicada: isLost
            ? 'Modo Mascota Perdida activo: domicilio oculto; rescate habilitado.'
            : 'Ley N° 29733: teléfono privado y dirección del propietario protegidos.',
          provider: 'Asistente de Emergencia Huellas',
        });
      });

    return () => {
      active = false;
    };
  }, [pet, isLost, demo]);

  const handleAskEmergencyAI = async (e, customQ = null) => {
    if (e) e.preventDefault();
    const q = (customQ ?? emergencyQuestion).trim();
    if (!q) return;
    setEmergencyLoading(true);
    try {
      const res = await askEmergencyAssistantAI({
        codigo_qr: demo ? undefined : pet.codigo,
        petName: pet.nombre,
        especie: pet.especie,
        raza: pet.raza,
        alergias: pet.alergias,
        isLost,
        question: q,
      });
      setEmergencyGuide(res);
      if (!customQ) setEmergencyQuestion('');
    } catch {
      // Mantener guía actual
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleSendLocation = () => {
    if (!isLost || demo || gpsSending) return;
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Tu navegador no permite compartir la ubicación.');
      return;
    }

    setGpsSending(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const saved = await apiFetch(`/mascotas/${encodeURIComponent(pet.codigo)}/alerta-gps`, {
          authenticated: false,
          method: 'POST',
          body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude, precision_metros: Math.round(coords.accuracy) }),
        });
        setGpsSentData({
          nombreMascota: pet.nombre,
          lat: coords.latitude.toFixed(6),
          lng: coords.longitude.toFixed(6),
          precision: `${Math.round(coords.accuracy)} metros`,
          mapsUrl: saved.mapsUrl,
          notified: saved.notificacion_enviada,
        });
        setGpsSent(true);
        setGpsModalOpen(true);
        window.dispatchEvent(new Event('huellas_alerta_gps_recibida'));
      } catch (error) {
        setGpsError(error.message);
      } finally {
        setGpsSending(false);
      }
    }, () => {
      setGpsError('No se pudo obtener tu ubicación. Comprueba los permisos de GPS e inténtalo de nuevo.');
      setGpsSending(false);
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
  };

  if (!pet) {
    return (
      <main className="hp-landing-page">
        {loadError ? <p role="alert">{loadError}</p> : <p role="status">Buscando placa QR…</p>}
        <Link to="/">Volver al inicio</Link>
      </main>
    );
  }

  return (
    <div className="hp-landing-page" style={{ minHeight: '100vh', justifyContent: 'flex-start', alignItems: 'center', padding: '1rem 0.5rem' }}>
      <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.9rem' }}>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else if (isStaff()) {
                navigate('/dashboard?tab=mascotas');
              } else {
                navigate('/propietario');
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.95rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Volver a la vista anterior"
          >
            <Icon name="arrowLeft" size={16} />
            <span>Volver atrás</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <Logo size={36} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
              Huellas <span style={{ color: '#38BDF8' }}>PetID</span>
            </span>
          </Link>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.3rem' }}>
            Plataforma Oficial de Trazabilidad QR · Clínica Huellas
          </div>
        </div>

        {/* SWITCH SIMULADOR */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '0.9rem 1rem',
          borderRadius: '16px',
          marginBottom: '1.2rem',
          fontSize: '0.82rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#CBD5E1', fontWeight: 600 }}>{demo ? 'Placa de demostración' : 'Estado de placa QR'}</span>
            <span
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: isLost ? '#EF4444' : '#10B981',
                color: 'white',
                border: 'none',
                boxShadow: isLost ? '0 0 15px rgba(239, 68, 68, 0.5)' : '0 0 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isLost ? '¡Modo Mascota Perdida ACTIVO!' : 'Modo Habitual / Control'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.5rem' }}>
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Ver cómo se ve en su collar físico:</span>
            <button
              onClick={() => setShowCollarView(!showCollarView)}
              style={{
                background: 'transparent',
                color: '#38BDF8',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {showCollarView ? 'Ocultar Collar' : 'Ver Collar & Placa QR'}
            </button>
          </div>
        </div>

        {showCollarView && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '1.2rem',
            marginBottom: '1.2rem'
          }}>
            <CollarQRTag pet={{ ...pet, codigoQR: pet.codigo }} showActions={false} compact={true} />
          </div>
        )}

        <div style={{
          background: isLost ? 'rgba(26, 11, 20, 0.96)' : 'rgba(17, 24, 39, 0.92)',
          border: isLost ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '1.8rem',
          boxShadow: isLost ? '0 0 45px rgba(239, 68, 68, 0.45)' : '0 20px 45px rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(16px)'
        }}>

          {isLost ? (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                color: 'white',
                padding: '1rem',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)'
              }}>
                <Icon name="alert" size={28} />
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem', letterSpacing: '0.5px' }}>
                    ¡ESTOY PERDIDO! AYÚDAME A VOLVER
                  </strong>
                  <span style={{ fontSize: '0.78rem', opacity: 0.95 }}>
                    Mi familia me está buscando. Si me encontraste, contáctalos o llama a la clínica:
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <img
                  src={pet.foto}
                  alt={pet.nombre}
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #EF4444',
                    marginBottom: '0.6rem',
                    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.35)'
                  }}
                />
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  {pet.nombre}
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#CBD5E1', marginTop: '0.2rem' }}>
                  {pet.especie} · {pet.raza} · {pet.edad}
                </p>
                <span style={{
                  display: 'inline-block',
                  marginTop: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.8rem',
                  borderRadius: '999px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#F87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)'
                }}>
                  🚨 Código de Búsqueda: {pet.codigo}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {pet.telefono && (
                  <a
                    href={`tel:${pet.telefono.replace(/\s+/g, '')}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      padding: '0.9rem 1rem',
                      borderRadius: '14px',
                      background: '#EF4444',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      textDecoration: 'none',
                      boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    <Icon name="phone" size={19} />
                    <span>Llamar al Dueño: {pet.telefono}</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setIsChatbotOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    padding: '0.9rem 1rem',
                    borderRadius: '14px',
                    background: '#10B981',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Icon name="whatsapp" size={19} />
                  <span>Contactar por Asistente de Rescate WhatsApp</span>
                </button>

                <button
                  onClick={handleSendLocation}
                  disabled={gpsSending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    padding: '0.9rem 1rem',
                    borderRadius: '14px',
                    background: gpsSent ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                    color: gpsSent ? '#34D399' : '#38BDF8',
                    border: gpsSent ? '1px solid #10B981' : '1px solid rgba(56, 189, 248, 0.35)',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: gpsSending ? 'wait' : 'pointer'
                  }}
                >
                  <Icon name="pin" size={18} />
                  <span>
                    {gpsSending
                      ? 'Obteniendo satélites GPS...'
                      : gpsSent
                      ? '✓ Ubicación guardada'
                      : 'Compartir mi Ubicación de Rescate (GPS)'}
                  </span>
                </button>
              </div>

              {gpsError && <p role="alert">{gpsError}</p>}
              {gpsModalOpen && gpsSentData && (
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '1rem'
                }}>
                  <div style={{
                    background: '#0F172A',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '20px',
                    padding: '1.8rem',
                    maxWidth: '480px',
                    width: '100%',
                    color: '#FFFFFF'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Icon name="check" size={22} />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>¡Ubicación GPS Transmitida!</h3>
                      </div>
                      <button
                        onClick={() => setGpsModalOpen(false)}
                        style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                      >
                        <Icon name="close" size={20} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                      Las coordenadas exactas para rescatar a <strong>{gpsSentData.nombreMascota}</strong> se guardaron. {gpsSentData.notified && 'Se envió la alerta al dueño.'}
                    </p>
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      fontSize: '0.8rem'
                    }}>
                      <div>Coordenadas: <strong>{gpsSentData.lat}, {gpsSentData.lng}</strong></div>
                      <div>Precisión: ±{gpsSentData.precision}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <a
                        href={gpsSentData.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.8rem 1rem',
                          borderRadius: '12px',
                          background: '#2563EB',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <Icon name="pin" size={17} />
                        <span>Abrir punto en Google Maps</span>
                      </a>
                      <button
                        onClick={() => setGpsModalOpen(false)}
                        style={{
                          padding: '0.7rem',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#CBD5E1',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10B981',
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1.4rem',
                fontSize: '0.82rem'
              }}>
                <Icon name="shield" size={20} />
                <div>
                  <strong style={{ display: 'block' }}>Ficha Médica Habitual · Mascota Segura</strong>
                  <span style={{ fontSize: '0.74rem', color: '#A7F3D0' }}>
                    Modo Control Activo. Privacidad del dueño protegida (Ley N° 29733).
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
                <img
                  src={pet.foto}
                  alt={pet.nombre}
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #10B981',
                    marginBottom: '0.6rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                  }}
                />
                <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  {pet.nombre}
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                  {pet.especie} · {pet.raza} · {pet.edad} · {pet.sexo}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    Placa QR: {pet.codigo}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#CBD5E1'
                  }}>
                    Peso: {pet.peso}
                  </span>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <Icon name="user" size={17} />
                  <strong style={{ color: '#F59E0B', textTransform: 'uppercase', fontSize: '0.82rem' }}>
                    Propietario Registrado (Privacidad Protegida)
                  </strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: '#94A3B8' }}>Dueño:</span>
                    <strong style={{ color: '#FFFFFF' }}>{pet.propietario || 'Protegido'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Zona:</span>
                    <strong style={{ color: '#FFFFFF' }}>{pet.distrito || 'Protegida'}</strong>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ASISTENTE DE EMERGENCIA IA (PASOS SENCILLOS + LLAMADA DIRECTA A LA CLÍNICA + PRIVACIDAD) */}
          {emergencyGuide && (
            <div style={{
              background: isLost ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.08)',
              border: isLost ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: isLost ? '#FCA5A5' : '#38BDF8', fontWeight: 800, fontSize: '0.88rem' }}>
                  <Icon name="spark" size={17} />
                  <span>Asistente de Emergencia IA</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{emergencyGuide.provider}</span>
              </div>

              <p style={{ margin: '0 0 0.7rem', fontSize: '0.82rem', color: '#E2E8F0', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                {emergencyGuide.respuesta_asistente}
              </p>

              {Array.isArray(emergencyGuide.pasos_inmediatos) && emergencyGuide.pasos_inmediatos.length > 0 && (
                <ul style={{ margin: '0 0 0.8rem', paddingLeft: '1.1rem', fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                  {emergencyGuide.pasos_inmediatos.map((paso, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{paso}</li>
                  ))}
                </ul>
              )}

              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                {['¿Está herido, qué hago?', '¿Qué cuidados o alergias tiene?', '¿Puedo ver el teléfono del dueño?'].map((qChip) => (
                  <button
                    key={qChip}
                    type="button"
                    onClick={() => handleAskEmergencyAI(null, qChip)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      color: '#CBD5E1',
                      borderRadius: '999px',
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    {qChip}
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => handleAskEmergencyAI(e)} style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  value={emergencyQuestion}
                  onChange={(e) => setEmergencyQuestion(e.target.value)}
                  placeholder="Pregunta al asistente (ej. qué darle, dónde llevarlo)..."
                  style={{
                    flex: 1,
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    padding: '0.5rem 0.75rem',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={emergencyLoading}
                  style={{
                    background: '#0284C7',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {emergencyLoading ? '...' : 'Consultar'}
                </button>
              </form>

              <a
                href={emergencyGuide.boton_llamada_clinica?.tel || `tel:${pet.telClinica.replace(/[^0-9+]/g, '')}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
                  boxSizing: 'border-box'
                }}
              >
                <Icon name="phone" size={17} />
                <span>{emergencyGuide.boton_llamada_clinica?.etiqueta || `Llamar Directo a Clínica (${pet.telClinica})`}</span>
              </a>

              <div style={{ marginTop: '0.55rem', fontSize: '0.7rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Icon name="shield" size={13} />
                <span>{emergencyGuide.privacidad_aplicada}</span>
              </div>
            </div>
          )}

          {/* ALERGIAS Y CONDICIONES MÉDICAS */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '1rem',
            fontSize: '0.85rem',
            color: '#CBD5E1',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Icon name="heart" size={16} />
              <strong style={{ color: '#F59E0B' }}>
                Condiciones Médicas & Alergias:
              </strong>
            </div>
            <p style={{ margin: 0, lineHeight: 1.5, color: '#E2E8F0' }}>
              {pet.alergias || 'Sin alergias ni afecciones médicas reportadas.'}
            </p>
          </div>

          {/* CARNET OFICIAL DE VACUNAS */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="syringe" size={16} />
                <strong style={{ fontSize: '0.85rem', color: '#38BDF8' }}>
                  Carnet de Vacunación Oficial
                </strong>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
                {pet.vacunas?.length || 0} Vacunas al día
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pet.vacunas && pet.vacunas.length > 0 ? (
                pet.vacunas.map((vax, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#FFFFFF', display: 'block' }}>{vax.nombre}</strong>
                      <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                        Aplicada: {vax.fecha} · Refuerzo: {vax.proxima || 'Anual'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#10B981',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px'
                    }}>
                      ✓ {vax.estado || 'Vigente'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Registro inicial en proceso.</div>
              )}
            </div>
          </div>

          {/* DATOS DE LA CLÍNICA VETERINARIA HUELLAS */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '14px',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: '#CBD5E1'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#38BDF8', fontWeight: 700, marginBottom: '0.3rem' }}>
              <Icon name="doctor" size={17} />
              <span>{pet.clinica}</span>
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
              📍 {pet.dirClinica} · {pet.horarioClinica}
            </div>
            <a
              href={`tel:${pet.telClinica.replace(/[^0-9+]/g, '')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.3rem',
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                fontWeight: 700,
                fontSize: '0.82rem',
                textDecoration: 'none'
              }}
            >
              <Icon name="phone" size={15} />
              <span>Contactar Clínica: {pet.telClinica}</span>
            </a>
          </div>
        </div>
      </div>

      <WhatsAppChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        idMascota={pet.id_mascota || null}
        idPropietario={pet.id_propietario || null}
        petName={pet.nombre}
        ownerName={pet.propietario}
        ownerPhone={isLost ? (pet.telefono || '') : ''}
        petAllergies={pet.alergias}
        mode={isLost ? 'rescue' : 'routine'}
        vaccineName="Alerta de Rescate y Ubicación de Mascota"
        dueDate="Reporte Inmediato"
        petCode={pet.codigo}
      />
    </div>
  );
}
