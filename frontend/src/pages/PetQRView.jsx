// src/pages/PetQRView.jsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import '../styles/landing.css';

export default function PetQRView() {
  const { codigo = 'HP-4092' } = useParams();
  const [gpsSent, setGpsSent] = useState(false);
  const [isLost, setIsLost] = useState(false);

  // Datos simulados de la mascota asociada al código QR
  const pet = {
    codigo: codigo.toUpperCase(),
    nombre: 'Toby',
    especie: 'Canino',
    raza: 'Beagle Tricolor',
    edad: '3 años',
    sexo: 'Macho',
    peso: '12.4 kg',
    propietario: 'Jorge Salas',
    telefono: '+51 987 654 321',
    direccion: 'Miraflores, Lima - Perú',
    foto: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
    clinica: 'Clínica Veterinaria Huellas (Surco, Lima)',
    telClinica: '+51 987 654 321',
    vacunas: [
      { nombre: 'Antirrábica', fecha: '14 Oct 2026', estado: 'Vigente' },
      { nombre: 'Sextuple Canina', fecha: '20 Ago 2026', estado: 'Vigente' },
    ],
    alergias: 'Alergia severa a picaduras de pulgas. No administrar derivados de penicilina.',
  };

  const handleSendLocation = () => {
    setGpsSent(true);
    setTimeout(() => setGpsSent(false), 4000);
  };

  return (
    <div className="hp-landing-page" style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
        
        {/* ENCABEZADO CON LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <Logo size={36} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
              Huellas <span style={{ color: '#38BDF8' }}>PetID</span>
            </span>
          </Link>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
            Ficha Oficial de Identificación QR · Clínica Huellas
          </div>
        </div>

        {/* SWITCH SIMULADOR PARA EL VISITANTE */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '0.7rem 1rem',
          borderRadius: '12px',
          marginBottom: '1.2rem',
          fontSize: '0.82rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <span>Simular estado de la mascota:</span>
          <button
            onClick={() => setIsLost(!isLost)}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: isLost ? '#EF4444' : '#10B981',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {isLost ? '¡Modo Extraviada Activo!' : 'Modo Normal (Segura)'}
          </button>
        </div>

        {/* TARJETA PÚBLICA DE LA MASCOTA */}
        <div style={{
          background: isLost ? 'rgba(26, 11, 20, 0.95)' : 'rgba(24, 33, 64, 0.85)',
          border: isLost ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '1.8rem',
          boxShadow: isLost ? '0 0 40px rgba(239, 68, 68, 0.4)' : '0 20px 40px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)'
        }}>
          {isLost && (
            <div style={{
              background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
              color: 'white',
              padding: '0.9rem',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              marginBottom: '1.4rem'
            }}>
              <Icon name="alert" size={26} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>¡ESTOY PERDIDO! AYÚDAME A VOLVER</strong>
                <span style={{ fontSize: '0.75rem', opacity: 0.95 }}>Mi familia me está buscando con desesperación.</span>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img
              src={pet.foto}
              alt={pet.nombre}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: isLost ? '4px solid #EF4444' : '4px solid #38BDF8',
                marginBottom: '0.6rem',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
              }}
            />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              {pet.nombre}
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              {pet.especie} · {pet.raza} · {pet.edad}
            </p>
            <span style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38BDF8',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              Placa QR Verificada: {pet.codigo}
            </span>
          </div>

          {/* BOTONES DE CONTACTO DIRECTO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <a
              href={`tel:${pet.telefono}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                background: '#EF4444',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.92rem',
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(239, 68, 68, 0.35)'
              }}
            >
              <Icon name="phone" size={18} />
              <span>Llamar al Dueño: {pet.telefono}</span>
            </a>

            <a
              href={`https://wa.me/51987654321?text=Hola%20${encodeURIComponent(pet.propietario)},%20acabo%20de%20escanear%20la%20placa%20Huellas%20PetID%20de%20${pet.nombre}.`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                background: '#10B981',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.92rem',
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Icon name="mail" size={18} />
              <span>Enviar WhatsApp al Dueño</span>
            </a>

            <button
              onClick={handleSendLocation}
              disabled={gpsSent}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                padding: '0.85rem 1rem',
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
              <span>{gpsSent ? '¡Coordenadas GPS enviadas al dueño!' : 'Compartir mi Ubicación de Rescate'}</span>
            </button>
          </div>

          {/* INFORMACIÓN MÉDICA */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '1rem',
            fontSize: '0.84rem',
            color: '#CBD5E1',
            marginBottom: '1rem'
          }}>
            <strong style={{ display: 'block', color: '#38BDF8', marginBottom: '0.3rem' }}>
              Condiciones Médicas & Alergias:
            </strong>
            <p style={{ margin: 0, lineHeight: 1.45 }}>{pet.alergias}</p>
          </div>

          {/* CLÍNICA RESPALDANTE */}
          <div style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#94A3B8',
            paddingTop: '0.8rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            Atención veterinaria asociada:
            <strong style={{ display: 'block', color: '#FFFFFF', marginTop: '0.2rem' }}>
              {pet.clinica}
            </strong>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ color: '#38BDF8', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Conoce más sobre Huellas PetID
          </Link>
        </div>
      </div>
    </div>
  );
}
