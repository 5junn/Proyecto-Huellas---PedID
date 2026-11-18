// src/pages/PetQRView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import CollarQRTag from '../components/CollarQRTag';
import WhatsAppChatbotModal from '../components/WhatsAppChatbotModal';
import '../styles/landing.css';

export default function PetQRView() {
  const { codigo = 'HP-4092' } = useParams();
  const [gpsSent, setGpsSent] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [showCollarView, setShowCollarView] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Buscar si la mascota existe en el almacenamiento local (creada recientemente por el usuario)
  const [pet, setPet] = useState({
    codigo: codigo.toUpperCase(),
    nombre: 'Toby',
    especie: 'Canino',
    raza: 'Beagle Tricolor',
    edad: '3 años',
    sexo: 'Macho',
    peso: '12.4 kg',
    color: 'Tricolor',
    propietario: 'Jorge Salas',
    telefono: '+51 987 654 321',
    direccion: 'Miraflores, Lima - Perú',
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
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('huellas_mascotas');
      if (stored) {
        const list = JSON.parse(stored);
        const match = list.find((m) =>
          m.codigoQR?.toUpperCase() === codigo?.toUpperCase() ||
          m.id?.toUpperCase() === codigo?.toUpperCase()
        );
        if (match) {
          setPet((prev) => ({
            ...prev,
            ...match,
            codigo: match.codigoQR || match.codigo || codigo.toUpperCase(),
            telefono: match.telefono || prev.telefono,
            propietario: match.propietario || prev.propietario,
            clinica: 'Clínica Veterinaria Huellas',
            dirClinica: 'Av. Primavera 1234, Santiago de Surco, Lima',
            telClinica: '+51 987 654 321',
            horarioClinica: 'Lunes a Domingo · Emergencias 24/7',
            vacunas: match.vacunas || prev.vacunas,
            alergias: match.alergias || prev.alergias,
          }));
          if (match.estadoExtravio) {
            setIsLost(true);
          }
        }
      }
    } catch {
      // Usar datos demo si no hay match
    }
  }, [codigo]);

  const handleSendLocation = () => {
    setGpsSent(true);
    setTimeout(() => setGpsSent(false), 4500);
  };

  return (
    <div className="hp-landing-page" style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>

        {/* ENCABEZADO CON LOGO */}
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

        {/* SWITCH SIMULADOR PARA EL VISITANTE / EVALUADOR */}
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
            <span style={{ color: '#CBD5E1', fontWeight: 600 }}>Simulador de Estado:</span>
            <button
              onClick={() => setIsLost(!isLost)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: isLost ? '#EF4444' : '#10B981',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                boxShadow: isLost ? '0 0 15px rgba(239, 68, 68, 0.5)' : '0 0 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isLost ? '¡Modo Mascota Extraviada ACTIVO!' : 'Modo Habitual / Control'}
            </button>
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

        {/* COLLAR VISUAL INTEGRADO SI ESTÁ ACTIVADO */}
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

        {/* TARJETA PÚBLICA DE LA MASCOTA */}
        <div style={{
          background: isLost ? 'rgba(26, 11, 20, 0.96)' : 'rgba(17, 24, 39, 0.92)',
          border: isLost ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '1.8rem',
          boxShadow: isLost ? '0 0 45px rgba(239, 68, 68, 0.45)' : '0 20px 45px rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(16px)'
        }}>

          {/* ========================================================
              MODO MASCOTA EXTRAVIADA (ALERTA ROJA Y DATOS DIRECTOS)
             ======================================================== */}
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
                    Mi familia me está buscando. Si me encontraste, contáctalos de inmediato:
                  </span>
                </div>
              </div>

              {/* FOTO Y DATOS MASCOTA */}
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

              {/* BOTONES DE CONTACTO DIRECTO (MODO PERDIDO TAL CUAL) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <a
                  href={`tel:${pet.telefono}`}
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
                  <span>Contactar Dueño por Chatbot WhatsApp</span>
                </button>

                <button
                  onClick={handleSendLocation}
                  disabled={gpsSent}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    padding: '0.9rem 1rem',
                    borderRadius: '14px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="pin" size={18} />
                  <span>{gpsSent ? '✓ ¡Coordenadas GPS enviadas al dueño!' : 'Compartir mi Ubicación de Rescate (GPS)'}</span>
                </button>
              </div>
            </>
          ) : (
            /* ========================================================
               MODO HABITUAL / CONTROL (LEY DE PROTECCIÓN DE DATOS N° 29733)
               NO se muestra teléfono ni dirección privada del dueño.
               Se muestra: Foto, Nombre, Alergias, Vacunas y Datos Clínica.
               ======================================================== */
            <>
              {/* BADGE DE PROTECCIÓN DE DATOS Y ESTADO NORMAL */}
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
                    Modo Control Activo. La mascota se encuentra bajo custodia de su familia.
                  </span>
                </div>
              </div>

              {/* FOTO DEL ANIMAL Y NOMBRE */}
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

              {/* SECCIÓN: DATOS DEL PROPIETARIO */}
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
                  <strong style={{ color: '#F59E0B', textTransform: 'uppercase', fontSize: '0.82rem', letterSpacing: '0.04em' }}>
                    Datos del Propietario
                  </strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: '#94A3B8' }}>Dueño:</span>
                    <strong style={{ color: '#FFFFFF' }}>{pet.propietario || 'Jorge Salas'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Distrito:</span>
                    <strong style={{ color: '#FFFFFF' }}>{pet.distrito || pet.direccion || 'Miraflores, Lima'}</strong>
                  </div>
                </div>
              </div>

              {/* CUMPLIMIENTO LEY DE PROTECCIÓN DE DATOS */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                padding: '0.7rem 0.9rem',
                fontSize: '0.74rem',
                color: '#94A3B8',
                marginBottom: '1.2rem',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <Icon name="shield" size={16} />
                <div>
                  <strong style={{ color: '#A7F3D0', display: 'block' }}>
                    Ficha Oficial Verificada (Ley N° 29733):
                  </strong>
                  Mascota vinculada oficialmente a la cuenta del propietario en la Clínica Veterinaria Huellas.
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              SECCIÓN: ALERGIAS Y CONDICIONES MÉDICAS (COMÚN A AMBOS)
             ======================================================== */}
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

          {/* ========================================================
              SECCIÓN: CARNET OFICIAL DE VACUNAS (EN MODO HABITUAL/CONTROL)
             ======================================================== */}
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

          {/* ========================================================
              SECCIÓN: DATOS DE LA CLÍNICA VETERINARIA HUELLAS
             ======================================================== */}
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

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ color: '#38BDF8', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon name="arrowLeft" size={16} />
            <span>Volver a la Página Principal de Huellas PetID</span>
          </Link>
        </div>
      </div>

      <WhatsAppChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        petName={pet.nombre}
        ownerName={pet.propietario}
        vaccineName="Alerta de Rescate y Ubicación de Mascota"
        dueDate="Reporte Inmediato"
        petCode={pet.codigo}
      />
    </div>
  );
}
