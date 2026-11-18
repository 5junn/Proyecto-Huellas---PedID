// src/pages/RegisterPet.jsx
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import CollarQRTag from '../components/CollarQRTag';
import WhatsAppChatbotModal from '../components/WhatsAppChatbotModal';
import { scheduleWhatsAppReminder } from '../services/whatsappService';
import { getUser } from '../services/authService';
import '../styles/landing.css';
import '../styles/auth.css';

const DEFAULT_AVATARS = [
  { label: 'Beagle', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Golden / Labrador', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80' },
  { label: 'Bulldog Francés', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80' },
  { label: 'Gato Siamés', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80' },
  { label: 'Gato Naranja', url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=400&q=80' },
  { label: 'Cachorro Mestizo', url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=80' }
];

export default function RegisterPet() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const fileInputRef = useRef(null);

  // Generamos un código QR único para la mascota
  const [generatedCode] = useState(() => 'HP-' + Math.floor(1000 + Math.random() * 9000));

  // Datos de la Mascota
  const [petData, setPetData] = useState({
    nombre: '',
    especie: 'Canino (Perro)',
    raza: '',
    edad: '',
    sexo: 'Macho',
    peso: '',
    color: '',
    alergias: '',
    foto: DEFAULT_AVATARS[0].url
  });

  // Estado de la foto cargada por el usuario
  const [isCustomPhoto, setIsCustomPhoto] = useState(false);
  const [customPhotoName, setCustomPhotoName] = useState('');

  // Datos del Dueño
  const [ownerData, setOwnerData] = useState({
    nombres: currentUser?.nombres || '',
    dni: currentUser?.dni || '',
    telefono: currentUser?.telefono || '987 654 321',
    correo: currentUser?.correo || ''
  });

  // Lógica de Negocio: Recordatorio WhatsApp por Chatbot (API)
  const [enableWhatsAppReminder, setEnableWhatsAppReminder] = useState(true);
  const [reminderType, setReminderType] = useState('vacuna');
  const [vaccineName, setVaccineName] = useState('Vacuna Antirrábica y Sextuple Canina');
  const [reminderDays, setReminderDays] = useState('30');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Estado del Registro
  const [submitted, setSubmitted] = useState(false);
  const [registeredPet, setRegisteredPet] = useState(null);

  const handlePetChange = (e) => {
    const { name, value } = e.target;
    setPetData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setOwnerData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo de carga de foto desde el dispositivo
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. El límite máximo es de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setPetData((prev) => ({ ...prev, foto: dataUrl }));
        setCustomPhotoName(file.name);
        setIsCustomPhoto(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomPhoto = () => {
    setIsCustomPhoto(false);
    setCustomPhotoName('');
    setPetData((prev) => ({ ...prev, foto: DEFAULT_AVATARS[0].url }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Abrir el Chatbot oficial de WhatsApp para simular el recordatorio
  const handleOpenChatbot = () => {
    setIsChatbotOpen(true);
  };

  // Enviar y Registrar Mascota
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!petData.nombre.trim()) return;

    const newPetRecord = {
      id: generatedCode.toLowerCase(),
      nombre: petData.nombre,
      especie: petData.especie,
      raza: petData.raza || 'Mestizo',
      edad: petData.edad || '1 año',
      sexo: petData.sexo,
      peso: petData.peso ? `${petData.peso} kg` : '10 kg',
      color: petData.color || 'Varios',
      codigoQR: generatedCode,
      estadoExtravio: false,
      foto: petData.foto,
      propietario: ownerData.nombres || 'Propietario Huellas',
      telefono: ownerData.telefono || '987 654 321',
      correo: ownerData.correo || '',
      alergias: petData.alergias.trim() || 'Sin alergias conocidas.',
      vacunas: [
        {
          nombre: vaccineName || 'Revisión y Vacunación Inicial',
          fecha: 'Hoy',
          proxima: `En ${reminderDays} días`,
          estado: 'Vigente',
          vet: 'Dra. Ana Torres (Clínica Huellas)'
        }
      ]
    };

    // Si activó el recordatorio de WhatsApp, programarlo
    if (enableWhatsAppReminder) {
      await scheduleWhatsAppReminder({
        petName: newPetRecord.nombre,
        ownerName: ownerData.nombres || 'Propietario',
        ownerPhone: ownerData.telefono,
        reminderType,
        vaccineName,
        dueDate: `En ${reminderDays} días`
      });
    }

    // Persistir en localStorage
    try {
      const stored = localStorage.getItem('huellas_mascotas');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newPetRecord);
      localStorage.setItem('huellas_mascotas', JSON.stringify(list));
    } catch {
      // Ignorar error de almacenamiento
    }

    setRegisteredPet(newPetRecord);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="hp-landing-page" style={{ minHeight: '100vh' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem', width: '100%' }}>
        {/* ENCABEZADO */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '0.8rem',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Icon name="paw" size={16} />
            <span>Registro Oficial Gratuito · Clínica Huellas PetID</span>
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
            Registra a tu Mascota y Obtén su <span className="hp-text-gradient">Placa QR Inteligente</span>
          </h1>
          <p style={{ color: '#94A3B8', maxWidth: '650px', margin: '0.8rem auto 0', fontSize: '1rem', lineHeight: 1.5 }}>
            Asocia a tu mascota a nuestra red veterinaria, genera su placa de identificación para el collar y activa recordatorios de salud con nuestro Chatbot automatizado de WhatsApp.
          </p>
        </div>

        {/* PANTALLA DE ÉXITO POST REGISTRO */}
        {submitted && registeredPet ? (
          <div style={{
            background: 'rgba(17, 24, 39, 0.95)',
            border: '2px solid #10B981',
            borderRadius: '24px',
            padding: '2.5rem 1.5rem',
            maxWidth: '680px',
            margin: '0 auto',
            textAlign: 'center',
            boxShadow: '0 20px 45px rgba(16, 185, 129, 0.25)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Icon name="check" size={34} />
            </div>

            <h2 style={{ fontSize: '1.9rem', color: '#FFFFFF', fontWeight: 800, margin: '0 0 0.5rem' }}>
              ¡{registeredPet.nombre} está Protegido(a)!
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginBottom: '1.8rem' }}>
              Se ha generado con éxito su código de trazabilidad <strong>{registeredPet.codigoQR}</strong> con un Código QR Real y se programó el recordatorio médico con HuellasBot.
            </p>

            {/* COLLAR VISUAL DE LA MASCOTA RECIÉN REGISTRADA */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '20px',
              padding: '1.5rem',
              marginBottom: '1.8rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <CollarQRTag
                pet={registeredPet}
                onScanSimulate={() => navigate(`/pet/${registeredPet.codigoQR}`)}
              />
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to={`/pet/${registeredPet.codigoQR}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Icon name="qr" size={18} />
                <span>Ver Ficha Pública (Modo Habitual / Control)</span>
              </Link>

              <button
                type="button"
                onClick={handleOpenChatbot}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Icon name="whatsapp" size={18} />
                <span>Abrir Chatbot HuellasBot 🐾</span>
              </button>

              <Link
                to="/propietario"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <Icon name="paw" size={18} />
                <span>Ir al Portal Mis Mascotas</span>
              </Link>
            </div>
          </div>
        ) : (
          /* =========================================================
             FORMULARIO DE REGISTRO DE MASCOTA CON PREVIEW EN TIEMPO REAL
             ========================================================= */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <form onSubmit={handleSubmit} style={{
              background: 'rgba(17, 24, 39, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: '2rem',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>

              {/* SECCIÓN 1: DATOS DE LA MASCOTA */}
              <div style={{ marginBottom: '1.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#10B981' }}>
                  <Icon name="paw" size={20} />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#FFFFFF' }}>1. Datos de la Mascota</h3>
                </div>

                <div className="hp-form-grid-2">
                  <div className="form-group">
                    <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Nombre de la Mascota *</label>
                    <input
                      type="text"
                      name="nombre"
                      required
                      placeholder="Ej. Toby, Luna, Max..."
                      value={petData.nombre}
                      onChange={handlePetChange}
                      className="form-input-clean"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Especie</label>
                    <select
                      name="especie"
                      value={petData.especie}
                      onChange={handlePetChange}
                      className="form-input-clean"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                    >
                      <option value="Canino (Perro)">Canino (Perro)</option>
                      <option value="Felino (Gato)">Felino (Gato)</option>
                      <option value="Conejo">Conejo</option>
                      <option value="Ave">Ave</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="hp-form-grid-2" style={{ marginTop: '0.8rem' }}>
                  <div className="form-group">
                    <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Raza</label>
                    <input
                      type="text"
                      name="raza"
                      placeholder="Ej. Beagle, Mestizo, Siamés..."
                      value={petData.raza}
                      onChange={handlePetChange}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Edad Aproximada</label>
                    <input
                      type="text"
                      name="edad"
                      placeholder="Ej. 2 años, 5 meses"
                      value={petData.edad}
                      onChange={handlePetChange}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                    />
                  </div>
                </div>

                <div className="hp-form-grid-2" style={{ marginTop: '0.8rem' }}>
                  <div className="form-group">
                    <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Sexo</label>
                    <select
                      name="sexo"
                      value={petData.sexo}
                      onChange={handlePetChange}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                    >
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Peso Aprox (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="peso"
                      placeholder="Ej. 12.5"
                      value={petData.peso}
                      onChange={handlePetChange}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                    />
                  </div>
                </div>

                {/* ========================================================
                    CAMPO PARA CARGAR FOTO REAL + SELECCIÓN DE AVATAR
                   ======================================================== */}
                <div style={{
                  marginTop: '1.2rem',
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '1.2rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                    <label style={{ color: '#E2E8F0', fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>
                      Foto de la Mascota
                    </label>
                    {isCustomPhoto && (
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        ✓ Foto Personalizada
                      </span>
                    )}
                  </div>

                  {/* ZONA DE CARGA DE ARCHIVO */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={petData.foto}
                        alt="Vista previa"
                        style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: isCustomPhoto ? '3px solid #10B981' : '3px solid #38BDF8',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                      {/* Input de archivo oculto */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        id="pet-file-uploader"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />

                      <label
                        htmlFor="pet-file-uploader"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.65rem 1.1rem',
                          borderRadius: '10px',
                          background: 'linear-flex(135deg, #38BDF8, #0284C7)',
                          backgroundColor: '#0284C7',
                          color: '#FFFFFF',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                        }}
                      >
                        <Icon name="upload" size={16} />
                        <span>Subir Foto desde tu Equipo</span>
                      </label>

                      {isCustomPhoto ? (
                        <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                            {customPhotoName || 'Imagen cargada con éxito'}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveCustomPhoto}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#EF4444',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Quitar y usar avatar
                          </button>
                        </div>
                      ) : (
                        <p style={{ color: '#64748B', fontSize: '0.72rem', margin: '0.4rem 0 0' }}>
                          Formatos admitidos: JPG, PNG, WebP (máx. 5MB)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* O SELECCIONAR UN AVATAR */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.8rem' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.76rem', display: 'block', marginBottom: '0.5rem' }}>
                      O elige uno de nuestros avatares predeterminados:
                    </span>
                    <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
                      {DEFAULT_AVATARS.map((av, idx) => (
                        <img
                          key={idx}
                          src={av.url}
                          alt={av.label}
                          title={av.label}
                          onClick={() => {
                            setIsCustomPhoto(false);
                            setCustomPhotoName('');
                            setPetData({ ...petData, foto: av.url });
                          }}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            border: petData.foto === av.url && !isCustomPhoto ? '3px solid #10B981' : '2px solid rgba(255,255,255,0.2)',
                            boxShadow: petData.foto === av.url && !isCustomPhoto ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* CONDICIONES MÉDICAS Y ALERGIAS */}
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Alergias o Cuidados Especiales</label>
                  <textarea
                    name="alergias"
                    rows="2"
                    placeholder="Ej. Alergia a picadura de pulgas, no administrar penicilina..."
                    value={petData.alergias}
                    onChange={handlePetChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* SECCIÓN 2: DATOS DEL PROPIETARIO */}
              <div style={{ marginBottom: '1.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#38BDF8' }}>
                  <Icon name="user" size={20} />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#FFFFFF' }}>2. Datos del Propietario Responsable</h3>
                </div>

                <div className="hp-form-grid-2">
                  <div className="form-group">
                    <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Nombre Completo *</label>
                    <input
                      type="text"
                      name="nombres"
                      required
                      placeholder="Ej. Lucía Paredes"
                      value={ownerData.nombres}
                      onChange={handleOwnerChange}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Teléfono WhatsApp de Contacto *</label>
                    <input
                      type="tel"
                      name="telefono"
                      required
                      placeholder="Ej. 987 654 321"
                      value={ownerData.telefono}
                      onChange={handleOwnerChange}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.8rem' }}>
                  <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>Correo Electrónico</label>
                  <input
                    type="email"
                    name="correo"
                    placeholder="propietario@gmail.com"
                    value={ownerData.correo}
                    onChange={handleOwnerChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                  />
                </div>
              </div>

              {/* SECCIÓN 3: RECORDATORIOS POR CHATBOT WHATSAPP */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '16px',
                padding: '1.2rem',
                marginBottom: '1.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981' }}>
                    <Icon name="whatsapp" size={22} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF' }}>Recordatorios con Chatbot HuellasBot</h3>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableWhatsAppReminder}
                    onChange={(e) => setEnableWhatsAppReminder(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
                  />
                </div>

                <p style={{ color: '#CBD5E1', fontSize: '0.82rem', margin: '0 0 1rem', lineHeight: 1.45 }}>
                  Gestionado mediante <strong>HuellasBot 🐾</strong>, nuestro asistente virtual automatizado. No requiere número personal real y protege la confidencialidad de tu familia.
                </p>

                {enableWhatsAppReminder && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div className="hp-form-grid-2">
                      <div>
                        <label style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>
                          Tipo de Recordatorio
                        </label>
                        <select
                          value={reminderType}
                          onChange={(e) => setReminderType(e.target.value)}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0F172A', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          <option value="vacuna">Vacuna de Refuerzo</option>
                          <option value="desparasitacion">Desparasitación Periódica</option>
                          <option value="control">Chequeo Clínico Preventivo</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>
                          Frecuencia Estimada
                        </label>
                        <select
                          value={reminderDays}
                          onChange={(e) => setReminderDays(e.target.value)}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0F172A', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                        >
                          <option value="15">En 15 días</option>
                          <option value="30">En 30 días (Recomendado)</option>
                          <option value="60">En 60 días</option>
                          <option value="90">En 3 meses</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>
                        Detalle del Tratamiento o Vacuna
                      </label>
                      <input
                        type="text"
                        value={vaccineName}
                        onChange={(e) => setVaccineName(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0F172A', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                      />
                    </div>

                    {/* BOTÓN PARA ABRIR EL CHATBOT INTERACTIVO */}
                    <button
                      type="button"
                      onClick={handleOpenChatbot}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <Icon name="whatsapp" size={18} />
                      <span>🤖 Probar Asistente Chatbot WhatsApp (HuellasBot)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* BOTÓN FINAL DE REGISTRO */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '1rem',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Icon name="check" size={20} />
                <span>Registrar Mascota y Generar Placa de Collar</span>
              </button>
            </form>

            {/* COLUMNA DERECHA: PREVISUALIZACIÓN DE LA PLACA Y COLLAR EN VIVO (CON QR REAL) */}
            <div style={{
              background: 'rgba(17, 24, 39, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '1.8rem',
              position: 'sticky',
              top: '100px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Vista Previa en Tiempo Real
                </span>
                <h3 style={{ margin: '0.2rem 0', color: '#FFFFFF', fontSize: '1.3rem' }}>
                  Placa que llevará en su Collar
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: 0 }}>
                  Código QR Real y Escaneable que puedes probar con tu cámara.
                </p>
              </div>

              <CollarQRTag
                pet={{
                  nombre: petData.nombre || 'Nombre de Mascota',
                  codigoQR: generatedCode
                }}
                showActions={false}
              />

              <div style={{
                marginTop: '1.5rem',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.78rem',
                color: '#94A3B8',
                lineHeight: 1.45
              }}>
                <strong style={{ color: '#E2E8F0', display: 'block', marginBottom: '0.2rem' }}>
                  🔒 Ley de Protección de Datos:
                </strong>
                El código QR de este collar mostrará únicamente los datos médicos de {petData.nombre || 'tu mascota'} y los de la clínica veterinaria mientras se encuentre en <strong>Modo Habitual/Control</strong>.
              </div>
            </div>

          </div>
        )}
      </main>

      {/* MODAL DEL CHATBOT DE WHATSAPP (HUELLASBOT) */}
      <WhatsAppChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        petName={petData.nombre || 'tu mascota'}
        ownerName={ownerData.nombres || 'Estimado Propietario'}
        vaccineName={vaccineName}
        dueDate={`En ${reminderDays} días`}
        petCode={generatedCode}
      />

      <Footer />
    </div>
  );
}
