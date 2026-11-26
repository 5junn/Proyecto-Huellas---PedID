// src/pages/Emergencias.jsx
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import WhatsAppChatbotModal from '../components/WhatsAppChatbotModal';
import '../styles/landing.css';

export default function Emergencias() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [emergencyGpsStatus, setEmergencyGpsStatus] = useState(false);

  const handleShareGps = () => {
    setEmergencyGpsStatus(true);
    setTimeout(() => setEmergencyGpsStatus(false), 4000);
  };

  return (
    <div className="hp-landing-page" style={{ minHeight: '100vh' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem', width: '100%' }}>
        {/* BANNER DE ALERTA DE EMERGENCIA 24/7 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.35) 100%)',
          border: '2px solid #EF4444',
          borderRadius: '24px',
          padding: '2.5rem 1.8rem',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(239, 68, 68, 0.3)',
          marginBottom: '3rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            background: '#EF4444',
            color: '#FFFFFF',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '1rem',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFFFFF', animation: 'pulse 1s infinite' }} />
            Atención Médica Veterinaria 24/7 Activa
          </span>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 1rem' }}>
            Unidad de Cuidados Críticos & <span style={{ color: '#F87171' }}>Emergencias Veterinarias</span>
          </h1>

          <p style={{ color: '#E2E8F0', maxWidth: '750px', margin: '0 auto 2rem', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Si tu mascota sufre un accidente, intoxicación, dificultad respiratoria o convulsiones, nuestro hospital veterinario cuenta con médicos intensivistas de guardia permanente, quirófano 24 horas y ambulancia móvil.
          </p>

          {/* BOTONES DE ACCIÓN RÁPIDA DE EMERGENCIA */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="tel:+51987654321"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.7rem',
                padding: '1rem 1.8rem',
                borderRadius: '16px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1.05rem',
                textDecoration: 'none',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.5)',
                transition: 'transform 0.2s ease'
              }}
            >
              <Icon name="phone" size={22} />
              <span>Llamar a Emergencias: +51 987 654 321</span>
            </a>

            <button
              type="button"
              onClick={() => setIsChatbotOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.7rem',
                padding: '1rem 1.8rem',
                borderRadius: '16px',
                background: '#10B981',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1.05rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                transition: 'transform 0.2s ease'
              }}
            >
              <Icon name="whatsapp" size={22} />
              <span>Triage Inmediato con HuellasBot</span>
            </button>
          </div>
        </div>

        {/* 4 PILARES DEL PROTOCOLO DE URGENCIAS */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
              Servicios Especializados en Urgencias Huellas
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
              Equipamiento hospitalario de última generación disponible las 24 horas del día, los 365 días del año.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {/* CARD 1 */}
            <div style={{
              background: 'rgba(17, 24, 39, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '1.8rem',
              backdropFilter: 'blur(12px)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Icon name="alert" size={26} />
              </div>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '0.5rem' }}>UCI & Oxigenoterapia</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Monitores multiparámetro continuos, incubadoras con control térmico y aporte de oxígeno para pacientes traumatizados o en shock.
              </p>
            </div>

            {/* CARD 2 */}
            <div style={{
              background: 'rgba(17, 24, 39, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '1.8rem',
              backdropFilter: 'blur(12px)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Icon name="doctor" size={26} />
              </div>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Quirófano 24 Horas</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Cirugía de emergencia para torsiones gástricas, cesáreas de urgencia, hemostasia de hemorragias internas y trauma toracoabdominal.
              </p>
            </div>

            {/* CARD 3 */}
            <div style={{
              background: 'rgba(17, 24, 39, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '1.8rem',
              backdropFilter: 'blur(12px)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Icon name="qr" size={26} />
              </div>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Red de Rescate QR</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Lectura inmediata de medallas QR extraviadas. Acceso directo a la información médica vital, alergias graves y contacto con el dueño.
              </p>
            </div>

            {/* CARD 4 */}
            <div style={{
              background: 'rgba(17, 24, 39, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '1.8rem',
              backdropFilter: 'blur(12px)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Icon name="pin" size={26} />
              </div>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Ubicación Estratégica</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Sede central en Av. Primavera 1234, Santiago de Surco. Acceso rápido y estacionamiento para ambulancias y clientes.
              </p>
            </div>
          </div>
        </section>

        {/* GUÍA DE SIGNOS DE ALERTA: CUÁNDO ACUDIR DE URGENCIA */}
        <section style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '2rem 1.8rem',
          marginBottom: '3rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <span style={{ color: '#F59E0B' }}><Icon name="alert" size={26} /></span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              ¿Cuándo debes traer a tu mascota de emergencia inmediata?
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#EF4444', fontWeight: 800, fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#FFFFFF', display: 'block' }}>Dificultad respiratoria o asfixia</strong>
                <span style={{ fontSize: '0.84rem', color: '#94A3B8' }}>Respiración con la boca abierta en gatos o encías azuladas/pálidas.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#EF4444', fontWeight: 800, fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#FFFFFF', display: 'block' }}>Sospecha de envenenamiento</strong>
                <span style={{ fontSize: '0.84rem', color: '#94A3B8' }}>Ingestión de raticidas, chocolate oscuro, plantas tóxicas o medicamentos humanos.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#EF4444', fontWeight: 800, fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#FFFFFF', display: 'block' }}>Convulsiones o temblores involuntarios</strong>
                <span style={{ fontSize: '0.84rem', color: '#94A3B8' }}>Episodios de más de 2 minutos o ataques repetitivos en menos de 24 horas.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#EF4444', fontWeight: 800, fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#FFFFFF', display: 'block' }}>Trauma vehicular o caídas de altura</strong>
                <span style={{ fontSize: '0.84rem', color: '#94A3B8' }}>Incluso si no hay heridas externas visibles, puede existir hemorragia interna.</span>
              </div>
            </div>
          </div>
        </section>

        {/* LOCALIZACIÓN Y MAPA */}
        <section style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '24px',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <Logo size={48} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.6rem' }}>
            Clínica Veterinaria Huellas · Sede Central de Emergencias
          </h3>
          <p style={{ color: '#CBD5E1', fontSize: '0.95rem', margin: '0.4rem 0 1.2rem' }}>
            📍 Av. Primavera 1234, Santiago de Surco, Lima - Perú · Atención Continua 24 Horas
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="https://maps.google.com/?q=Av.+Primavera+1234+Santiago+de+Surco+Lima"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                background: '#0284C7',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none'
              }}
            >
              <Icon name="pin" size={17} />
              <span>Abrir en Google Maps / Waze ↗</span>
            </a>

            <button
              type="button"
              onClick={handleShareGps}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer'
              }}
            >
              <Icon name="pin" size={17} />
              <span>{emergencyGpsStatus ? '✓ ¡Coordenadas GPS enviadas a la Central!' : 'Transmitir mi Ubicación a la Central'}</span>
            </button>
          </div>
        </section>
      </main>

      <WhatsAppChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        petName="tu mascota"
        ownerName="Propietario"
        vaccineName="Alerta de Triage y Urgencia 24/7"
        dueDate="Atención Inmediata"
        petCode="EMERGENCIA-24H"
      />

      <Footer />
    </div>
  );
}
