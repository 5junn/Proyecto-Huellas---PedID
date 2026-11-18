import React from 'react';
import logoImg from '../assets/logo.jpg';

export default function Logo({ size = 40, className = '' }) {
  return (
    <img
      src={logoImg}
      alt="Huellas Pet ID - Clínica Veterinaria"
      style={{
        height: typeof size === 'number' ? `${size}px` : size,
        width: 'auto',
        maxHeight: '100%',
        borderRadius: '8px',
        objectFit: 'contain',
        backgroundColor: '#FFFFFF',
        padding: '2px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
      className={className}
    />
  );
}
