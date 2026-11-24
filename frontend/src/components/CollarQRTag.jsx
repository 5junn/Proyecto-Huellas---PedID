// src/components/CollarQRTag.jsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Icon from './Icon';

export default function CollarQRTag({
  pet,
  onScanSimulate,
  showActions = true,
  compact = false
}) {
  const [copied, setCopied] = useState(false);
  const [realQrDataUrl, setRealQrDataUrl] = useState('');
  const [generating, setGenerating] = useState(true);

  // Detección de host de red local para que el celular abra la página al escanear
  const [networkHost, setNetworkHost] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return window.location.host;
      }
    }
    return '10.165.139.250:5173';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      fetch('http://localhost:4000/api/network-ip')
        .then((r) => r.json())
        .then((data) => {
          if (data?.ip && data.ip !== 'localhost') {
            setNetworkHost(`${data.ip}:5173`);
          }
        })
        .catch(() => {});
    }
  }, []);

  if (!pet) return null;

  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const qrTargetUrl = `${protocol}//${networkHost}/pet/${pet.codigoQR || 'HP-4092'}`;

  // Generación matemática de Código QR 100% Real y Escaneable (Nivel de corrección H)
  useEffect(() => {
    setGenerating(true);
    QRCode.toDataURL(qrTargetUrl, {
      width: compact ? 200 : 260,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        setRealQrDataUrl(url);
        setGenerating(false);
      })
      .catch((err) => {
        console.error('Error generando código QR real:', err);
        setGenerating(false);
      });
  }, [qrTargetUrl, compact]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(qrTargetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`hp-collar-display ${compact ? 'compact' : ''}`} style={{ textAlign: 'center' }}>
      {/* VISTA DEL COLLAR Y PLACA */}
      <div
        className="hp-collar-rig"
        style={{
          position: 'relative',
          padding: compact ? '1rem 0.5rem' : '1.5rem 1rem',
          maxWidth: compact ? '280px' : '360px',
          margin: '0 auto'
        }}
      >
        {/* CORREA DEL COLLAR */}
        <div
          style={{
            position: 'relative',
            height: compact ? '30px' : '38px',
            background: 'linear-gradient(180deg, #334155 0%, #0F172A 100%)',
            borderRadius: '10px',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            overflow: 'hidden'
          }}
        >
          {/* Remaches decorativos */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8', boxShadow: 'inset 0 1px 2px #000' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8', boxShadow: 'inset 0 1px 2px #000' }} />
          </div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '2px', textTransform: 'uppercase' }}>
            HUELLAS COLLAR FIT
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8', boxShadow: 'inset 0 1px 2px #000' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8', boxShadow: 'inset 0 1px 2px #000' }} />
          </div>
        </div>

        {/* ARGOLLA METÁLICA DE SUSPENSIÓN */}
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            border: '5px solid #CBD5E1',
            margin: '-6px auto 0',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.6)',
            background: 'transparent',
            position: 'relative',
            zIndex: 2
          }}
        />

        {/* MEDALLA / PLACA METÁLICA INTELIGENTE CON QR REAL */}
        <div
          style={{
            position: 'relative',
            width: compact ? '220px' : '260px',
            margin: '-4px auto 0',
            background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)',
            border: '4px solid #38BDF8',
            borderRadius: '26px',
            padding: compact ? '1rem 0.8rem' : '1.3rem 1rem',
            boxShadow: '0 20px 35px -10px rgba(0,0,0,0.7), 0 0 25px rgba(56, 189, 248, 0.25)',
            zIndex: 3
          }}
        >
          {/* Remache superior */}
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#38BDF8',
              margin: '0 auto 0.5rem',
              boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.4)'
            }}
          />

          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            🐾 Huellas PetID
          </div>

          <h4
            style={{
              fontSize: compact ? '1.25rem' : '1.45rem',
              fontWeight: 900,
              color: '#FFFFFF',
              margin: '0.2rem 0 0.5rem',
              letterSpacing: '1px'
            }}
          >
            {pet.nombre?.toUpperCase() || 'MI MASCOTA'}
          </h4>

          {/* CÓDIGO QR REAL GENERADO */}
          <div
            onClick={() => {
              if (onScanSimulate) {
                onScanSimulate();
              } else {
                window.open(qrTargetUrl, '_blank');
              }
            }}
            title="Haz clic para escanear y abrir la ficha médica oficial"
            style={{
              background: '#FFFFFF',
              padding: '8px',
              borderRadius: '16px',
              display: 'inline-block',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              margin: '0.3rem 0',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {realQrDataUrl ? (
              <img
                src={realQrDataUrl}
                alt={`Código QR Real para ${pet.nombre}`}
                style={{
                  width: compact ? '130px' : '160px',
                  height: compact ? '130px' : '160px',
                  display: 'block'
                }}
              />
            ) : (
              <div
                style={{
                  width: compact ? '130px' : '160px',
                  height: compact ? '130px' : '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  fontSize: '0.75rem'
                }}
              >
                {generating ? 'Generando QR real...' : 'QR Listo'}
              </div>
            )}
          </div>

          {/* INDICADOR DE QR REAL Y ESCANEABLE */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              marginTop: '0.3rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              padding: '0.15rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: 800
            }}
          >
            <span>✓ QR Real y Escaneable (Toca para Abrir)</span>
          </div>

          <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC' }}>
            ID: <span style={{ color: '#38BDF8' }}>{pet.codigoQR || 'HP-4092'}</span>
          </div>

          <div style={{
            fontSize: '0.62rem',
            color: '#38BDF8',
            marginTop: '0.25rem',
            wordBreak: 'break-all',
            padding: '0.15rem 0.4rem',
            background: 'rgba(56, 189, 248, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            📡 Móvil / Wi-Fi: {qrTargetUrl}
          </div>

          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '0.2rem' }}>
            Clínica Veterinaria Huellas
          </div>
        </div>
      </div>

      {/* ACCIONES Y BOTONES */}
      {showActions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '360px', margin: '1rem auto 0' }}>
          <a
            href={qrTargetUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
              boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)',
              cursor: 'pointer'
            }}
          >
            <Icon name="qr" size={18} />
            <span>📱 Escanear Placa QR (Abrir Ficha Oficial ↗)</span>
          </a>

          {onScanSimulate && (
            <button
              type="button"
              onClick={onScanSimulate}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <Icon name="clipboard" size={16} />
              <span>Ver Ficha Habitual / Control en esta ventana</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem 0.8rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#CBD5E1',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Icon name="clipboard" size={15} />
              <span>{copied ? '¡Copiado!' : 'Copiar URL QR'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem 0.8rem',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Icon name="download" size={15} />
              <span>Imprimir Placa</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
