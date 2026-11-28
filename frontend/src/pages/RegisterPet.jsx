// src/pages/RegisterPet.jsx
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import CollarQRTag from '../components/CollarQRTag';
import ClinicContactDialog from '../components/ClinicContactDialog';
import { apiFetch } from '../services/apiClient';
import { getRazasPorEspecie } from '../data/razasData';
import { getVacunaSugerida, getListaVacunasPorEspecie } from '../data/vacunasData';
import '../styles/landing.css';
import '../styles/auth.css';

export default function RegisterPet({ user }) {
  const fileInputRef = useRef(null);

  // Datos de la Mascota
  const [petData, setPetData] = useState({
    nombre: '',
    especie: 'Canino (Perro)',
    raza: 'Beagle',
    edad: '',
    sexo: 'Macho',
    peso: '',
    color: '',
    alergias: '',
    foto: ''
  });

  // Estado de la foto cargada por el usuario
  const [customPhotoName, setCustomPhotoName] = useState('');

  const [enableWhatsAppReminder, setEnableWhatsAppReminder] = useState(false);
  const [reminderType, setReminderType] = useState('vacuna');
  const [vaccineName, setVaccineName] = useState(() => getVacunaSugerida('Canino'));
  const [reminderDays, setReminderDays] = useState('30');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Estado del Registro
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [registeredPet, setRegisteredPet] = useState(null);

  const handlePetChange = (e) => {
    const { name, value } = e.target;
    if (name === 'especie') {
      const razas = getRazasPorEspecie(value);
      const vacunaAdecuada = getVacunaSugerida(value);
      setVaccineName(vacunaAdecuada);
      setPetData((prev) => ({
        ...prev,
        especie: value,
        raza: razas[0] || 'Mestizo'
      }));
    } else {
      setPetData((prev) => ({ ...prev, [name]: value }));
    }
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
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomPhoto = () => {
    setCustomPhotoName('');
    setPetData((prev) => ({ ...prev, foto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Abrir la guía del recordatorio registrado
  const handleOpenChatbot = () => {
    setIsChatbotOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!petData.nombre.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const topics = { vacuna: vaccineName, desparasitacion: 'desparasitación', control: 'un control preventivo' };
      const saved = await apiFetch('/mascotas', {
        method: 'POST',
        body: JSON.stringify({
          ...petData,
          recordatorio_preventivo: enableWhatsAppReminder ? topics[reminderType] : undefined,
          reminderDays: Number(reminderDays),
        }),
      });
      setRegisteredPet({ ...petData, codigoQR: saved.codigo_qr, id_recordatorio: saved.id_recordatorio });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
        {registeredPet ? (
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
              Se guardó tu mascota con el código <strong>{registeredPet.codigoQR}</strong>.
              {registeredPet.id_recordatorio && ' La solicitud de recordatorio quedó programada.'}
            </p>

            {/* COLLAR VISUAL DE LA MASCOTA RECIÉN REGISTRADA */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '20px',
              padding: '1.5rem',
              marginBottom: '1.8rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <CollarQRTag pet={registeredPet} />
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
                <span>Contactar a la clínica</span>
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
                    <label style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>
                      Raza (Catálogo Normalizado) *
                    </label>
                    <select
                      name="raza"
                      value={petData.raza}
                      onChange={handlePetChange}
                      className="form-input-clean"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                    >
                      {getRazasPorEspecie(petData.especie).map((r) => (
                        <option key={r} value={r} style={{ background: '#0F172A', color: '#FFFFFF' }}>{r}</option>
                      ))}
                    </select>
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

                <div className="hp-pet-photo-input">
                  <label htmlFor="pet-file-uploader">Foto de la mascota (opcional)</label>
                  <input type="file" id="pet-file-uploader" ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoUpload} />
                  {petData.foto && (
                    <div>
                      <img src={petData.foto} alt="Foto seleccionada" width={74} height={74} />
                      <span>{customPhotoName}</span>
                      <button type="button" className="btn btn-outline sm" onClick={handleRemoveCustomPhoto}>Quitar foto</button>
                    </div>
                  )}
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

              <p>Propietario: <strong>{user.nombres}</strong> · {user.correo}</p>
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
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF' }}>Recordatorios preventivos</h3>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableWhatsAppReminder}
                    onChange={(e) => setEnableWhatsAppReminder(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
                  />
                </div>

                <p style={{ color: '#CBD5E1', fontSize: '0.82rem', margin: '0 0 1rem', lineHeight: 1.45 }}>
                  Si lo activas, se programará un aviso preventivo para el número registrado en tu cuenta.
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

                    <div hidden={reminderType !== 'vacuna'}>
                      <label style={{ color: '#94A3B8', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>
                        Tratamiento o Vacuna (Específico para {petData.especie})
                      </label>
                      <select
                        value={vaccineName}
                        onChange={(e) => setVaccineName(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0F172A', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        {getListaVacunasPorEspecie(petData.especie).map((vac, idx) => (
                          <option key={idx} value={vac}>{vac}</option>
                        ))}
                      </select>
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
                      <span>Ver contacto de la clínica</span>
                    </button>
                  </div>
                )}
              </div>

              {error && <p role="alert">{error}</p>}
              <button
                type="submit"
                disabled={saving}
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
                  El código QR se genera al guardar la mascota.
                </p>
              </div>

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

      {/* CONTACTO DE LA CLÍNICA */}
      <ClinicContactDialog
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        petName={registeredPet?.nombre}
        vaccineName={registeredPet?.id_recordatorio ? vaccineName : null}
        dueDate={`En ${reminderDays} días`}
        petCode={registeredPet?.codigoQR}
      />

      <Footer />
    </div>
  );
}
