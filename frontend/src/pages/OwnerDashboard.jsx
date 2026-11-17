// src/pages/OwnerDashboard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import { getUser } from '../services/authService';
import '../styles/owner.css';

const MASCOTAS_INICIALES = [
  {
    id: 'hp-4092',
    nombre: 'Toby',
    especie: 'Perro',
    raza: 'Beagle',
    edad: '3 años',
    sexo: 'Macho',
    peso: '12.4 kg',
    color: 'Tricolor',
    codigoQR: 'HP-4092',
    estadoExtravio: false,
    foto: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=400&q=80',
    vacunas: [
      { nombre: 'Antirrábica', fecha: '14 Oct 2026', proxima: '14 Oct 2027', estado: 'ok', vet: 'Dra. Ana Torres' },
      { nombre: 'Sextuple Canina', fecha: '20 Ago 2026', proxima: '20 Ago 2027', estado: 'ok', vet: 'Dra. Ana Torres' },
      { nombre: 'Desparasitación Interna', fecha: '02 Nov 2026', proxima: '02 Feb 2027', estado: 'ok', vet: 'Dr. Luis Vega' },
    ],
    alergias: 'Alergia a la pulga. No administrar derivados de penicilina.',
  },
  {
    id: 'hp-8813',
    nombre: 'Luna',
    especie: 'Gato',
    raza: 'Siamés',
    edad: '1 año y medio',
    sexo: 'Hembra',
    peso: '3.8 kg',
    color: 'Crema y chocolate',
    codigoQR: 'HP-8813',
    estadoExtravio: false,
    foto: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80',
    vacunas: [
      { nombre: 'Triple Felina', fecha: '10 Sep 2026', proxima: '10 Sep 2027', estado: 'ok', vet: 'Dr. Luis Vega' },
      { nombre: 'Leucemia Felina', fecha: '15 Jul 2026', proxima: '15 Jul 2027', estado: 'ok', vet: 'Dr. Luis Vega' },
    ],
    alergias: 'Ninguna conocida.',
  }
];

export default function OwnerDashboard() {
  const user = getUser() || { nombres: 'Lucía Paredes', correo: 'propietario@gmail.com', rol: 'Propietario', telefono: '987 654 321' };
  
  const [mascotas, setMascotas] = useState(MASCOTAS_INICIALES);
  const [selectedPet, setSelectedPet] = useState(mascotas[0]);
  const [modalCarnetOpen, setModalCarnetOpen] = useState(false);
  const [modalNewPetOpen, setModalNewPetOpen] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');

  // Formulario nueva mascota
  const [newPet, setNewPet] = useState({
    nombre: '',
    especie: 'Perro',
    raza: '',
    edad: '',
    sexo: 'Macho',
    peso: '',
    color: '',
  });

  const toggleModoExtravio = (petId) => {
    setMascotas((prev) =>
      prev.map((pet) => {
        if (pet.id === petId) {
          const nuevoEstado = !pet.estadoExtravio;
          const msg = nuevoEstado
            ? `¡ALERTA ACTIVADA! ${pet.nombre} está ahora en Modo Mascota Perdida. Cualquier escaneo QR notificará tus datos de emergencia.`
            : `Modo Extravío desactivado para ${pet.nombre}. Todo seguro.`;
          setAlertSuccess(msg);
          setTimeout(() => setAlertSuccess(''), 5000);
          return { ...pet, estadoExtravio: nuevoEstado };
        }
        return pet;
      })
    );
  };

  const handleCreatePet = (e) => {
    e.preventDefault();
    if (!newPet.nombre.trim()) return;

    const nueva = {
      id: 'hp-' + Math.floor(1000 + Math.random() * 9000),
      nombre: newPet.nombre,
      especie: newPet.especie,
      raza: newPet.raza || 'Mestizo',
      edad: newPet.edad || '1 año',
      sexo: newPet.sexo,
      peso: newPet.peso ? `${newPet.peso} kg` : 'N/A',
      color: newPet.color || 'Varios',
      codigoQR: 'HP-' + Math.floor(1000 + Math.random() * 9000),
      estadoExtravio: false,
      foto: newPet.especie === 'Gato'
        ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
      vacunas: [
        { nombre: 'Revisión Inicial Clínica Huellas', fecha: 'Hoy', proxima: 'En 30 días', estado: 'ok', vet: 'Dra. Ana Torres' }
      ],
      alergias: 'Por evaluar en consulta médica.',
    };

    setMascotas([...mascotas, nueva]);
    setModalNewPetOpen(false);
    setNewPet({ nombre: '', especie: 'Perro', raza: '', edad: '', sexo: 'Macho', peso: '', color: '' });
    setAlertSuccess(`¡${nueva.nombre} ha sido registrada con éxito en tu cuenta de propietario!`);
    setTimeout(() => setAlertSuccess(''), 4500);
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
                Gestiona tus mascotas registradas, consulta su carnet de vacunación en la nube y mantén sus placas QR actualizadas.
              </p>
            </div>

            <div className="hp-welcome-actions">
              <button
                className="hp-btn-add-pet"
                onClick={() => setModalNewPetOpen(true)}
              >
                <Icon name="plus" size={18} />
                <span>Registrar Nueva Mascota</span>
              </button>
            </div>
          </section>

          {/* ALERTA FLOTANTE DE ACCIÓN */}
          {alertSuccess && (
            <div className="hp-owner-alert animate-fade" role="status">
              <Icon name="shield" size={20} />
              <span>{alertSuccess}</span>
            </div>
          )}

          {/* BANNER DE EMERGENCIA GLOBAL SI HAY ALGUNA MASCOTA PERDIDA */}
          {mascotas.some((m) => m.estadoExtravio) && (
            <div className="hp-lost-pet-banner animate-fade">
              <div className="hp-lost-pulse-ring" />
              <div className="hp-lost-banner-content">
                <Icon name="alert" size={24} />
                <div>
                  <strong>¡PROTOCOLO DE MASCOTA EXTRAVIADA ACTIVO!</strong>
                  <p>
                    La placa QR de {mascotas.filter((m) => m.estadoExtravio).map((m) => m.nombre).join(', ')} está transmitiendo en modo de rescate prioritario con tus números de contacto directo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* GRID DE MASCOTAS REGISTRADAS */}
          <section className="hp-pets-section">
            <div className="hp-section-title-row">
              <div>
                <h2>Mis Mascotas Protegidas ({mascotas.length})</h2>
                <p>Haz clic en cualquier mascota para ver o descargar su carnet y gestionar su placa.</p>
              </div>
            </div>

            <div className="hp-pets-grid">
              {mascotas.map((pet) => (
                <article
                  key={pet.id}
                  className={`hp-pet-card-owner ${pet.estadoExtravio ? 'is-lost' : ''}`}
                >
                  <div className="hp-pet-card-top">
                    <div className="hp-pet-media">
                      <img src={pet.foto} alt={pet.nombre} className="hp-pet-photo" />
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
                          {pet.vacunas.length} vacunas vigentes
                        </span>
                      </div>
                      <p className="hp-vax-note">
                        Última vacuna: {pet.vacunas[0]?.nombre} ({pet.vacunas[0]?.fecha})
                      </p>
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

                      <Link
                        to={`/pet/${pet.codigoQR}`}
                        className="hp-pet-btn preview"
                        title="Ver cómo ve el público la ficha de tu mascota"
                      >
                        <Icon name="qr" size={16} />
                        <span>Vista QR</span>
                      </Link>
                    </div>

                    {/* SWITCH MODO EXTRAVIADO */}
                    <div className="hp-lost-toggle-box">
                      <div className="hp-lost-toggle-text">
                        <strong>Modo Mascota Extraviada</strong>
                        <span>Muestra alerta roja y recompensa al escanear</span>
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
              <a
                href="https://wa.me/51987654321?text=Hola,%20deseo%20agendar%20una%20cita%20veterinaria%20para%20mi%20mascota"
                target="_blank"
                rel="noreferrer"
                className="hp-btn-whatsapp-clinic"
              >
                <Icon name="phone" size={18} />
                <span>Agendar Cita por WhatsApp</span>
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* MODAL CARNET DE VACUNACIÓN DIGITAL */}
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
                <img src={selectedPet.foto} alt={selectedPet.nombre} className="hp-carnet-avatar" />
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
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPet.vacunas.map((vax, idx) => (
                      <tr key={idx}>
                        <td><strong>{vax.nombre}</strong></td>
                        <td>{vax.fecha}</td>
                        <td>{vax.proxima}</td>
                        <td>{vax.vet}</td>
                        <td>
                          <span className="hp-carnet-chip ok">
                            <Icon name="check" size={13} />
                            <span>Vigente</span>
                          </span>
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

      {/* MODAL REGISTRAR NUEVA MASCOTA */}
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
                    onChange={(e) => setNewPet({ ...newPet, especie: e.target.value })}
                    className="form-input-clean"
                  >
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Conejo">Conejo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="hp-form-grid-2">
                <div className="form-group">
                  <label>Raza</label>
                  <input
                    type="text"
                    placeholder="Ej. Golden, Mestizo, Siamés"
                    value={newPet.raza}
                    onChange={(e) => setNewPet({ ...newPet, raza: e.target.value })}
                    className="form-input-clean"
                  />
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

              <div className="hp-modal-footer">
                <button
                  type="button"
                  className="hp-modal-btn close"
                  onClick={() => setModalNewPetOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="hp-modal-btn primary">
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
