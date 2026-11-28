// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../services/authService';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import ReceptionOverview from '../components/ReceptionOverview';
import DashboardCharts from '../components/DashboardCharts';
import LostPetReports from '../components/LostPetReports';
import VaccineInventory from '../components/VaccineInventory';
import { getRazasPorEspecie } from '../data/razasData';
import { apiFetch } from '../services/apiClient';
import {
  fetchPredictiveAlertsAI, generateClinicalSummaryAI, sendDirectMessageDB, formatWhatsAppPhone,
} from '../services/whatsappService';
import '../styles/dashboard.css';
import '../styles/staffDashboard.css';

const MENU = [
  { group: 'General', items: [{ id: 'inicio', icon: 'home', label: 'Inicio' }] },
  {
    group: 'Gestión',
    items: [
      { id: 'mascotas', icon: 'paw', label: 'Mascotas', roles: ['Administrador', 'Veterinario', 'Recepcionista'] },
      { id: 'propietarios', icon: 'users', label: 'Propietarios', roles: ['Administrador', 'Recepcionista'] },
    ]
  },
  {
    group: 'Clínica',
    items: [
      { id: 'consultas', icon: 'clipboard', label: 'Consultas', roles: ['Administrador', 'Veterinario'] },
      { id: 'vacunas', icon: 'shield', label: 'Vacunas', roles: ['Administrador', 'Veterinario'] },
      { id: 'recordatorios', icon: 'bell', label: 'Recordatorios', roles: ['Administrador', 'Recepcionista'] },
    ]
  },
  {
    group: 'Administración',
    items: [
      { id: 'usuarios', icon: 'user', label: 'Cuentas de usuario', roles: ['Administrador'] },
    ]
  },
];

const SECTIONS = {
  inicio: { title: 'Panel General', desc: 'Resumen clínico, métricas operativas y agenda médica.' },
  mascotas: { title: 'Gestión de Mascotas', desc: 'Directorio de pacientes, códigos QR e historial médico.' },
  propietarios: { title: 'Directorio de Propietarios', desc: 'Datos de contacto, DNI y mascotas asociadas.' },
  consultas: { title: 'Consultas Médicas', desc: 'Historias clínicas, diagnósticos, recetas y atención del día.' },
  vacunas: { title: 'Carnets & Vacunación', desc: 'Registro de vacunas aplicadas, lotes y próximos refuerzos.' },
  recordatorios: { title: 'Avisos Automáticos', desc: 'Notificaciones por WhatsApp y SMS enviadas a propietarios.' },
  usuarios: { title: 'Cuentas de usuario', desc: 'Cuentas de propietarios y personal registradas en Huellas PetID.' },
};

const STATUS_TEXT = { done: 'Atendida', progress: 'En curso', waiting: 'En espera' };

const VACCINE_STATUS = { 'al-dia': 'Vigente', 'por-vencer': 'Por vencer', vencida: 'Vencida' };
const EMPTY_BATCH = { vacuna: '', lote_fabricante: '', fecha_vencimiento: '', dosis_iniciales: '' };
const dateKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima' });

export default function Dashboard({ user: currentUser }) {
  const navigate = useNavigate();
  const isVet = currentUser.rol === 'Veterinario';
  const isRecep = currentUser.rol === 'Recepcionista';
  const isAdmin = currentUser.rol === 'Administrador';
  const clinical = isVet || isAdmin;
  const reception = isRecep || isAdmin;
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || 'inicio';
    } catch {
      return 'inicio';
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [today, setToday] = useState(() => dateKey.format(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [consultas, setConsultas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [vacunas, setVacunas] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  const [recordatorios, setRecordatorios] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [lostPets, setLostPets] = useState([]);
  const [gpsAlerts, setGpsAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loadErrors, setLoadErrors] = useState([]);
  const [pending, setPending] = useState(true);
  const [alertsPending, setAlertsPending] = useState(true);
  const latestLoad = useRef(0);
  const latestAlerts = useRef(0);

  const [predictiveAlerts, setPredictiveAlerts] = useState(null);
  const [clinicalSummary, setClinicalSummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [modalConsultaOpen, setModalConsultaOpen] = useState(false);
  const [modalVacunaOpen, setModalVacunaOpen] = useState(false);
  const [modalBatchOpen, setModalBatchOpen] = useState(false);
  const [modalStaffOpen, setModalStaffOpen] = useState(false);
  const [modalPetOpen, setModalPetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [modalAlertasOpen, setModalAlertasOpen] = useState(false);
  const [isEditingAgenda, setIsEditingAgenda] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadAllFromBackend = React.useCallback(async (signal) => {
    const version = ++latestLoad.current;
    const requests = [
      ['/mascotas', 'Mascotas', setMascotas],
      ['/clinica/dashboard', 'Indicadores', setMetrics],
    ];
    if (clinical) requests.push(
      ['/clinica/consultas', 'Consultas', setConsultas],
      ['/clinica/vacunas', 'Vacunas', setVacunas],
      ['/clinica/lotes-vacunas', 'Lotes de vacunas', setBatches]
    );
    if (reception) requests.push(
      ['/auth/propietarios', 'Propietarios', setPropietarios],
      ['/mensajeria/recordatorios', 'Recordatorios', setRecordatorios]
    );
    if (isAdmin) requests.push(['/auth/usuarios', 'Cuentas de usuario', setAccounts]);

    const results = await Promise.allSettled(requests.map(([path]) => apiFetch(path, { signal })));
    if (signal?.aborted || version !== latestLoad.current) return;

    const errors = [];
    results.forEach((result, index) => {
      const [path, label, setValue] = requests[index];
      if (result.status === 'fulfilled') setValue(result.value);
      else errors.push({ path, label, message: result.reason?.message || 'Error al cargar los datos.' });
    });
    const paths = new Set(requests.map(([path]) => path));
    setLoadErrors((previous) => [...previous.filter(({ path }) => !paths.has(path)), ...errors]);
    setToday(dateKey.format(new Date()));
    setPending(false);
  }, [clinical, reception, isAdmin]);

  const refreshAlerts = React.useCallback(async (signal) => {
    const version = ++latestAlerts.current;
    const requests = [
      ['/mascotas/reportes/extravios', 'Mascotas extraviadas', setLostPets],
      ['/mascotas/alertas-gps', 'Alertas GPS', setGpsAlerts],
    ];
    const results = await Promise.allSettled(requests.map(([path]) => apiFetch(path, { signal })));
    if (signal?.aborted || version !== latestAlerts.current) return;
    const errors = [];
    results.forEach((result, index) => {
      const [path, label, setValue] = requests[index];
      if (result.status === 'fulfilled') setValue(result.value);
      else errors.push({ path, label, message: result.reason?.message || 'Error al cargar los reportes.' });
    });
    const paths = new Set(requests.map(([path]) => path));
    setLoadErrors((previous) => [...previous.filter(({ path }) => !paths.has(path)), ...errors]);
    setAlertsPending(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const updateAlerts = () => refreshAlerts(controller.signal);
    const refresh = () => {
      loadAllFromBackend(controller.signal);
      updateAlerts();
    };
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') updateAlerts();
    }, 20000);
    window.addEventListener('focus', refresh);
    window.addEventListener('huellas_alerta_gps_recibida', updateAlerts);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('huellas_alerta_gps_recibida', updateAlerts);
    };
  }, [loadAllFromBackend, refreshAlerts]);

  // Formulario de nueva mascota en recepción
  const [formPet, setFormPet] = useState({
    nombre: '',
    especie: 'Canino',
    raza: 'Beagle',
    id_propietario: '',
    sexo: 'Macho',
    edad: '',
    peso: '',
    alergias: ''
  });

  const [formConsulta, setFormConsulta] = useState({
    id_mascota: '', reason: '', diagnostico: '', tratamiento_receta: '', peso: '', temperatura: '',
  });
  const [formVacuna, setFormVacuna] = useState({
    id_mascota: '', id_lote: '', fecha_aplicacion: today, fecha_proximo_refuerzo: '', observaciones: '',
  });
  const [formBatch, setFormBatch] = useState(EMPTY_BATCH);
  const [formStaff, setFormStaff] = useState({
    nombres: '', correo: '', rol: 'Veterinario', password: '', especialidad: '', turno: 'Mañana (8:00 - 14:00)',
  });

  // Filtrado de menú según rol
  const allowedGroups = useMemo(
    () =>
      MENU.map((g) => ({
        ...g,
        items: g.items.filter((i) => !i.roles || i.roles.includes(currentUser.rol)),
      })).filter((g) => g.items.length),
    [currentUser.rol]
  );

  const allItems = allowedGroups.flatMap((g) => g.items);
  const currentNav = allItems.find((i) => i.id === activeTab) || allItems[0] || MENU[0].items[0];

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleResolveGpsAlert = async (id) => {
    try {
      await apiFetch(`/mascotas/alertas-gps/${id}/resolver`, { method: 'PATCH' });
      await refreshAlerts();
      showToast('Alerta de rescate archivada.');
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleGenerateClinicalDraft = async () => {
    if (!formConsulta.id_mascota || loadingAI) return;
    setLoadingAI(true);
    setFormError('');
    try {
      setClinicalSummary(await generateClinicalSummaryAI({
        id_mascota: Number(formConsulta.id_mascota),
        motivo_consulta: formConsulta.reason,
      }));
    } catch (error) {
      setFormError(error.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handlePredictiveAlerts = async () => {
    setLoadingAI(true);
    try {
      setPredictiveAlerts(await fetchPredictiveAlertsAI());
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const saveForm = async (event, path, input, onSaved) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError('');
    try {
      const result = await apiFetch(path, { method: 'POST', body: JSON.stringify(input) });
      onSaved(result);
      await loadAllFromBackend();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateConsulta = (event) => saveForm(event, '/clinica/consultas', {
    ...formConsulta, borrador_ia: clinicalSummary?.borrador_diagnostico,
  }, () => {
    setModalConsultaOpen(false);
    setClinicalSummary(null);
    setFormConsulta({ id_mascota: '', reason: '', diagnostico: '', tratamiento_receta: '', peso: '', temperatura: '' });
    showToast('Consulta guardada.');
  });

  const handleCreateVacuna = (event) => saveForm(event, '/clinica/vacunas', formVacuna, (saved) => {
    setModalVacunaOpen(false);
    setFormVacuna({ id_mascota: '', id_lote: '', fecha_aplicacion: today, fecha_proximo_refuerzo: '', observaciones: '' });
    showToast(saved.recordatorio_programado ? 'Vacuna registrada y recordatorio programado.' : 'Vacuna registrada.');
  });

  const handleCreateBatch = (event) => saveForm(event, '/clinica/lotes-vacunas', formBatch, () => {
    setModalBatchOpen(false);
    setFormBatch(EMPTY_BATCH);
    showToast('Lote registrado en el inventario.');
  });

  const handleCreatePetReception = (event) => saveForm(event, '/mascotas', formPet, (saved) => {
    setModalPetOpen(false);
    setFormPet({ nombre: '', especie: 'Canino', raza: 'Beagle', id_propietario: '', sexo: 'Macho', edad: '', peso: '', alergias: '' });
    showToast(`Paciente registrado con placa ${saved.codigo_qr}.`);
  });

  const handleCreateStaff = (event) => saveForm(event, '/auth/staff', formStaff, (saved) => {
    setModalStaffOpen(false);
    setFormStaff({ nombres: '', correo: '', rol: 'Veterinario', password: '', especialidad: '', turno: 'Mañana (8:00 - 14:00)' });
    showToast(`Cuenta creada para ${saved.nombres}.`);
  });

  const handleChangeConsultaStatus = async (id, status) => {
    try {
      await apiFetch(`/clinica/consultas/${encodeURIComponent(id)}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadAllFromBackend();
      showToast(`Estado actualizado: ${STATUS_TEXT[status]}.`);
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleResendReminder = async (reminder) => {
    try {
      const result = await sendDirectMessageDB({ id_recordatorio: reminder.id_recordatorio });
      showToast(result.external ? 'El proveedor aceptó el envío.' : 'El proveedor no confirmó el envío.');
      await loadAllFromBackend();
    } catch (error) {
      showToast(error.message);
      await loadAllFromBackend();
    }
  };

  const salir = () => {
    logout();
    navigate('/login?portal=staff', { replace: true });
  };

  const go = (id) => {
    if (id !== currentNav.id) {
      setSearchTerm('');
      setStatusFilter('all');
    }
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resourceStatus = (path) => {
    const report = path === '/mascotas/reportes/extravios' || path === '/mascotas/alertas-gps';
    if (report ? alertsPending : pending) return 'loading';
    return loadErrors.some((error) => error.path === path) ? 'error' : 'ready';
  };

  const activeOwners = propietarios.filter((owner) => owner.cuenta_estado === 'activo');
  const search = searchTerm.trim().toLowerCase();
  const visiblePets = mascotas.filter((pet) =>
    (statusFilter === 'all' || pet.especie === statusFilter) &&
    [pet.nombre, pet.codigoQR, pet.propietario, pet.raza].some((value) => value?.toLowerCase().includes(search))
  );
  const visibleOwners = propietarios.filter((owner) =>
    [owner.nombres, owner.dni, owner.telefono].some((value) => String(value ?? '').toLowerCase().includes(search))
  );
  const visibleReminders = recordatorios.filter((reminder) =>
    `${reminder.pet} ${reminder.owner}`.toLowerCase().includes(search)
  );

  const totals = resourceStatus('/clinica/dashboard') === 'ready' ? metrics?.totales : null;
  const kpis = [
    ['paw', 'sky', 'Mascotas registradas', totals?.mascotas],
    ['clipboard', 'violet', 'Consultas registradas', totals?.consultas],
    ['shield', 'amber', 'Refuerzos en los próximos 15 días', totals?.vacunasPorVencer],
    ['shield', 'amber', 'Refuerzos vencidos', totals?.vacunasVencidas],
  ];
  const agenda = consultas.filter((entry) => entry.fecha_hora && dateKey.format(new Date(entry.fecha_hora)) === today);
  const eligibleBatches = batches.filter((batch) => batch.dosis_disponibles > 0 &&
    batch.fecha_vencimiento >= formVacuna.fecha_aplicacion);
  const visibleVaccines = vacunas.filter((vaccine) =>
    [vaccine.pet, vaccine.vaccine, vaccine.lote].some((value) => value?.toLowerCase().includes(search))
  );
  const visibleAccounts = accounts.filter((account) =>
    [account.nombres, account.correo, account.rol].some((value) => value?.toLowerCase().includes(search)) &&
    (statusFilter === 'all' || account.rol === statusFilter)
  );
  const openVaccineModal = () => {
    setFormError('');
    setFormVacuna((current) => ({ ...current, fecha_aplicacion: today, id_lote: '' }));
    setModalVacunaOpen(true);
  };
  const openBatchModal = () => {
    setFormError('');
    setModalBatchOpen(true);
  };
  const patientOptions = mascotas.map((pet) => (
    <option key={pet.id_mascota} value={pet.id_mascota}>
      {pet.nombre} · {pet.codigoQR} · {pet.propietario}
    </option>
  ));

  return (
    <div className="app">
      {/* BARRA LATERAL */}
      <aside className={`side ${mobileMenuOpen ? 'is-open' : ''}`}>
        <Link to="/" className="side-brand" title="Ir al Sitio Web Principal">
          <Logo size={38} />
          <div>
            <strong>Huellas PetID</strong>
            <span>Gestión Clínica</span>
          </div>
        </Link>

        <nav className="side-nav" aria-label="Navegación principal">
          {allowedGroups.map((g) => (
            <div className="side-group" key={g.group}>
              <p>{g.group}</p>
              {g.items.map((i) => (
                <button
                  key={i.id}
                  className={`nav-item ${currentNav.id === i.id ? 'active' : ''}`}
                  aria-current={currentNav.id === i.id ? 'page' : undefined}
                  onClick={() => go(i.id)}
                >
                  <Icon name={i.icon} size={19} />
                  <span>{i.label}</span>
                </button>
              ))}
            </div>
          ))}

          <div className="side-group">
            <p>Navegación</p>
            <Link to="/" className="nav-item" style={{ textDecoration: 'none' }}>
              <Icon name="arrowLeft" size={17} />
              <span>Sitio Web Principal</span>
            </Link>
          </div>
        </nav>

        <div className="side-user">
          <span className="avatar">
            {currentUser.nombres.split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </span>
          <div className="side-user-text">
            <strong>{currentUser.nombres}</strong>
            <span>{currentUser.rol}</span>
          </div>
          <button className="icon-btn dark" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      {mobileMenuOpen && <div className="scrim" onClick={() => setMobileMenuOpen(false)} />}

      {/* ÁREA PRINCIPAL */}
      <div className="main">
        {/* HEADER SUPERIOR */}
        <header className="top">
          <button className="icon-btn menu-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menú">
            <Icon name="menu" size={20} />
          </button>

          <div className="crumbs">
            <span>Clínica Huellas</span>
            <span className="sep">/</span>
            <strong>{currentNav.label}</strong>
          </div>

          <div className="role-badge-selector">{currentUser.rol}</div>

          <label className="search">
            <Icon name="search" size={17} />
            <input
              placeholder="Buscar paciente, código QR o dueño..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar"
            />
          </label>

          <div style={{ position: 'relative' }}>
            <button
              className={`icon-btn ${gpsAlerts.length > 0 || lostPets.length > 0 ? 'has-dot' : ''}`}
              aria-label="Notificaciones"
              title="Alertas de la clínica"
              onClick={() => setModalAlertasOpen(!modalAlertasOpen)}
            >
              <Icon name="bell" size={18} />
            </button>

            {/* PANEL DESPLEGABLE DE ALERTAS CLÍNICAS */}
            {modalAlertasOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '360px',
                  maxWidth: '90vw',
                  background: '#141C2C',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.2)',
                  zIndex: 9999,
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  padding: '1rem 1.2rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon name="bell" size={18} />
                    <strong style={{ color: '#FFFFFF', fontSize: '0.92rem' }}>Centro de Alertas Clínicas</strong>
                  </div>
                  <button
                    onClick={() => setModalAlertasOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>

                <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '0.8rem' }}>
                  {/* Alertas de Mascota Perdida / GPS */}
                  {lostPets.map((lostPet) => (
                    <div
                      key={lostPet.id_mascota}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        marginBottom: '0.6rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F87171', fontWeight: 700, fontSize: '0.82rem' }}>
                        <Icon name="alert" size={15} />
                        <span>Mascota Extraviada: {lostPet.nombre}</span>
                      </div>
                      <p style={{ margin: '0.3rem 0 0.5rem', fontSize: '0.76rem', color: '#CBD5E1' }}>
                        Placa {lostPet.codigoQR} · Dueño: {lostPet.propietario}
                      </p>
                      <Link
                        to={`/pet/${lostPet.codigoQR}`}
                        onClick={() => setModalAlertasOpen(false)}
                        style={{
                          display: 'inline-block',
                          color: '#38BDF8',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textDecoration: 'underline'
                        }}
                      >
                        Ver Ficha QR de Rescate →
                      </Link>
                    </div>
                  ))}

                  {/* Consultas en Espera */}
                  {consultas.filter((c) => c.status === 'waiting').length > 0 && (
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        marginBottom: '0.6rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FBBF24', fontWeight: 700, fontSize: '0.82rem' }}>
                        <Icon name="clipboard" size={15} />
                        <span>{consultas.filter((c) => c.status === 'waiting').length} Pacientes en Espera</span>
                      </div>
                      <p style={{ margin: '0.3rem 0 0.5rem', fontSize: '0.76rem', color: '#CBD5E1' }}>
                        Hay citas programadas pendientes de atención en triaje médico.
                      </p>
                      <button
                        onClick={() => {
                          setModalAlertasOpen(false);
                          go('consultas');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#FBBF24',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        Ir a Triaje y Consultas →
                      </button>
                    </div>
                  )}

                  {clinical && vacunas.some((vaccine) => vaccine.status === 'por-vencer') && (
                    <button type="button" className="btn btn-outline sm" onClick={() => {
                      setModalAlertasOpen(false);
                      go('vacunas');
                    }}>Ver próximos refuerzos</button>
                  )}
                  {!lostPets.length && !consultas.some((entry) => entry.status === 'waiting') &&
                    !(clinical && vacunas.some((vaccine) => vaccine.status === 'por-vencer')) && (
                    <p>No hay avisos operativos en esta lista.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* TOAST DE FEEDBACK */}
        {toastMessage && (
          <div className="hp-owner-alert animate-fade" style={{ margin: '1rem 2rem 0' }}>
            <Icon name="shield" size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="page">
          {pending && <p role="status">Cargando datos de la clínica…</p>}
          {loadErrors.length > 0 && (
            <div className="staff-load-error" role="alert">
              <strong>Algunos datos no se pudieron cargar.</strong>
              <ul>
                {loadErrors.map(({ path, label, message }) => <li key={path}>{label}: {message}</li>)}
              </ul>
              <button className="btn btn-outline sm" type="button" onClick={() => { loadAllFromBackend(); refreshAlerts(); }}>Reintentar</button>
            </div>
          )}
          {/* BANNER DINÁMICO DE ACCIÓN CLÍNICA SEGÚN ROL */}
          <section className="staff-action-banner">
            <div className="staff-action-info">
              <div className={`staff-role-icon-box ${isVet ? 'vet' : isRecep ? 'recep' : 'admin'}`}>
                <Icon name={isVet ? 'doctor' : isRecep ? 'desk' : 'shield'} size={26} />
              </div>
              <div className="staff-action-text">
                <h2>{isRecep && currentNav.id === 'inicio' ? 'Panel de Recepción' : SECTIONS[currentNav.id]?.title}</h2>
                <p>
                  Bienvenido, <strong>{currentUser.nombres}</strong> ({currentUser.rol}). {isRecep && currentNav.id === 'inicio'
                    ? 'Consulta pacientes, propietarios y recordatorios.'
                    : SECTIONS[currentNav.id]?.desc}
                </p>
              </div>
            </div>

            <div className="staff-action-btns">
              {isVet && (
                <>
                  <button className="btn-staff-primary" onClick={() => { setFormError(''); setModalConsultaOpen(true); }}>
                    <Icon name="plus" size={16} />
                    <span>Nueva Consulta</span>
                  </button>
                  <button className="btn-staff-secondary" onClick={openVaccineModal}>
                    <Icon name="syringe" size={16} />
                    <span>Aplicar Vacuna</span>
                  </button>
                </>
              )}

              {isRecep && (
                <>
                  <button className="btn-staff-primary" onClick={() => { setFormError(''); setModalPetOpen(true); }}>
                    <Icon name="paw" size={16} />
                    <span>Registrar Paciente QR</span>
                  </button>
                  <button type="button" className="btn-staff-secondary" onClick={() => go('propietarios')}>
                    <Icon name="users" size={16} />
                    <span>Ver propietarios</span>
                  </button>
                </>
              )}

              {isAdmin && (
                <>
                  <button className="btn-staff-primary" onClick={() => { setFormError(''); setModalStaffOpen(true); }}>
                    <Icon name="userCheck" size={16} />
                    <span>Crear Personal</span>
                  </button>
                  <button className="btn-staff-secondary" onClick={() => go('usuarios')}>
                    <Icon name="shield" size={16} />
                    <span>Ver cuentas de usuario</span>
                  </button>
                </>
              )}
            </div>
          </section>

          {/* BANNER DE ALERTA GPS DE RESCATE EN TIEMPO REAL PARA EL PERSONAL CLÍNICO */}
          {gpsAlerts.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(185, 28, 28, 0.3) 100%)',
              border: '1.5px solid #EF4444',
              borderRadius: '16px',
              padding: '1.1rem 1.4rem',
              marginBottom: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{
                  background: '#EF4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.8)'
                }}>
                  <Icon name="alert" size={20} />
                </span>
                <div>
                  <strong style={{ color: '#FCA5A5', fontSize: '0.98rem', display: 'block' }}>
                    🚨 ¡REPORTE DE MASCOTA EXTRAVIADA CON GPS ACTIVO! ({gpsAlerts[0].nombreMascota})
                  </strong>
                  <span style={{ color: '#E2E8F0', fontSize: '0.82rem' }}>
                    Placa {gpsAlerts[0].codigoMascota} · Dueño: {gpsAlerts[0].propietario} ({gpsAlerts[0].telefono}) · Coordenadas: {gpsAlerts[0].lat}, {gpsAlerts[0].lng} (±{gpsAlerts[0].precision}) · {gpsAlerts[0].fechaCompleta}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <a
                  href={gpsAlerts[0].mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#2563EB',
                    color: 'white',
                    padding: '0.55rem 0.95rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  <Icon name="pin" size={16} />
                  <span>Ver Ubicación en Maps</span>
                </a>
                <button
                  onClick={() => handleResolveGpsAlert(gpsAlerts[0].id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: 'white',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Resolver Alerta
                </button>
              </div>
            </div>
          )}

          {/* VISTA 1: INICIO (RESUMEN GENERAL) */}
          {currentNav.id === 'inicio' && (
            <>
              {isRecep && (
                <ReceptionOverview
                  mascotas={mascotas}
                  propietarios={propietarios}
                  recordatorios={recordatorios}
                  gpsAlerts={gpsAlerts}
                  status={resourceStatus}
                  onOpenSection={go}
                />
              )}

              {clinical && <section className="kpis">
                {kpis.map(([icon, tone, label, value]) => (
                  <article className={`kpi tone-${tone}`} key={label}>
                    <span className="tile"><Icon name={icon} size={22} /></span>
                    <strong className="kpi-val">{value ?? '—'}</strong>
                    <div className="kpi-foot"><span>{label}</span></div>
                  </article>
                ))}
              </section>}

              <LostPetReports pets={lostPets} status={resourceStatus('/mascotas/reportes/extravios')} />
              {isAdmin && (
                <article className="card">
                  <header className="card-head">
                    <div>
                      <h2>Cuentas de usuario</h2>
                      {resourceStatus('/auth/usuarios') === 'ready' && <p>{accounts.length} cuentas registradas</p>}
                    </div>
                    <button type="button" className="btn btn-outline sm" onClick={() => go('usuarios')}>Ver todas las cuentas</button>
                  </header>
                </article>
              )}

              {clinical && (
                <article className="card">
                  <header className="card-head">
                    <h2>Alertas preventivas</h2>
                    <button className="btn btn-outline sm" onClick={handlePredictiveAlerts} disabled={loadingAI}>
                      {loadingAI ? 'Analizando…' : 'Analizar registros'}
                    </button>
                  </header>
                  {predictiveAlerts && (
                    <div className="row-text">
                      <strong>{predictiveAlerts.resumen_gerencial}</strong>
                      <span>Fuente: {predictiveAlerts.external ? predictiveAlerts.provider : 'Reglas clínicas locales'}</span>
                    </div>
                  )}
                </article>
              )}

              <DashboardCharts metrics={metrics} clinical={clinical} status={resourceStatus('/clinica/dashboard')} />

              {/* ACTIVIDAD & VACUNAS POR VENCER */}
              {clinical && <section className="grid-2-1">
                <article className="card">
                  <header className="card-head">
                    <div>
                      <h2>Próximas Vacunas por Vencer</h2>
                      <p>Próximos 15 días</p>
                    </div>
                    <button className="btn btn-outline sm" onClick={() => go('vacunas')}>
                      Ver Todas <Icon name="arrow" size={16} />
                    </button>
                  </header>
                  <ul className="list">
                    {resourceStatus('/clinica/vacunas') === 'ready' && !vacunas.some((v) => v.status === 'por-vencer') && (
                      <li className="staff-empty-state">No hay refuerzos en los próximos 15 días.</li>
                    )}
                    {vacunas.filter((vacuna) => vacuna.status === 'por-vencer').slice(0, 5).map((v) => (
                      <li className="row" key={v.id || v.pet}>
                        <span className="avatar" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                          <Icon name="syringe" size={16} />
                        </span>
                        <div className="row-text">
                          <strong>{v.pet}</strong>
                          <span>{v.vaccine} · {v.owner}</span>
                        </div>
                        <span className="mgmt-badge warn">{v.expire || v.when}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="card">
                  <header className="card-head">
                    <div>
                      <h2>Actividad Reciente</h2>
                      <p>Últimas consultas registradas</p>
                    </div>
                  </header>
                  <ul className="list">
                    {resourceStatus('/clinica/consultas') === 'ready' && consultas.length === 0 && (
                      <li className="staff-empty-state">Registra la primera consulta para ver actividad aquí.</li>
                    )}
                    {consultas.slice(0, 5).map((a) => (
                      <li className="row activity" key={a.id}>
                        <span className="tile sm" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' }}>
                          <Icon name="clipboard" size={16} />
                        </span>
                        <div className="row-text">
                          <strong>{a.pet} · {a.reason}</strong>
                          <span>{a.vet} · {a.time}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              </section>}

              {/* TABLA DE CITAS DEL DÍA */}
              {clinical && <article className="card">
                <header className="card-head">
                  <div>
                    <h2>Agenda Médica de Hoy</h2>
                    <p>Consultas y triajes programados</p>
                  </div>
                  <button className="btn btn-outline sm" onClick={() => go('consultas')}>
                    Ver Consultas <Icon name="arrow" size={16} />
                  </button>
                </header>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>Propietario</th>
                        <th>Motivo</th>
                        <th>Veterinario</th>
                        <th>Hora</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resourceStatus('/clinica/consultas') === 'ready' && agenda.length === 0 && (
                        <tr><td colSpan={6} className="staff-empty-state">Hoy aún no hay consultas registradas.</td></tr>
                      )}
                      {agenda.map((c) => (
                        <tr key={c.id || c.pet}>
                          <td>
                            <div className="cell-pet">
                              <span className="avatar" style={{ background: '#162438', color: '#10B981' }}>
                                <Icon name="paw" size={16} />
                              </span>
                              <div>
                                <strong>{c.pet}</strong>
                                <span>{c.breed}</span>
                              </div>
                            </div>
                          </td>
                          <td>{c.owner}</td>
                          <td>{c.reason}</td>
                          <td>{c.vet}</td>
                          <td className="num">{c.time}</td>
                          <td>
                            {isEditingAgenda ? (
                              <select
                                value={c.status}
                                onChange={(e) => handleChangeConsultaStatus(c.id || c.pet, e.target.value)}
                                style={{
                                  padding: '0.28rem 0.6rem',
                                  borderRadius: '8px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: '1px solid rgba(255, 255, 255, 0.25)',
                                  background: c.status === 'done' ? '#065F46' : c.status === 'progress' ? '#92400E' : '#7F1D1D',
                                  color: '#FFFFFF',
                                  outline: 'none'
                                }}
                              >
                                <option value="waiting" style={{ background: '#1F2937' }}>⏳ En espera</option>
                                <option value="progress" style={{ background: '#1F2937' }}>⚡ En curso</option>
                                <option value="done" style={{ background: '#1F2937' }}>✓ Atendida</option>
                              </select>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '8px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  background: c.status === 'done' ? 'rgba(16, 185, 129, 0.18)' : c.status === 'progress' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                                  border: c.status === 'done' ? '1px solid #10B981' : c.status === 'progress' ? '1px solid #F59E0B' : '1px solid #EF4444',
                                  color: c.status === 'done' ? '#34D399' : c.status === 'progress' ? '#FBBF24' : '#F87171'
                                }}
                              >
                                {c.status === 'done' ? '✓ Atendida' : c.status === 'progress' ? '⚡ En curso' : '⏳ En espera'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* BOTONES DE EDITAR Y GUARDAR ESTADOS DE AGENDA */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.8rem',
                  padding: '1rem 1.4rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  {!isEditingAgenda ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingAgenda(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.55rem 1.1rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                      }}
                    >
                      <Icon name="clipboard" size={15} />
                      <span>Editar Estados</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditingAgenda(false)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#CBD5E1',
                          borderRadius: '8px',
                          padding: '0.5rem 0.9rem',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <span>Cancelar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingAgenda(false);
                          showToast('✓ Estados de la agenda médica actualizados y guardados correctamente');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.55rem 1.15rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        <Icon name="check" size={15} />
                        <span>Guardar Cambios</span>
                      </button>
                    </>
                  )}
                </div>
              </article>}
            </>
          )}

          {/* VISTA 2: GESTIÓN DE MASCOTAS */}
          {currentNav.id === 'mascotas' && (
            <div className="mgmt-card">
              <div style={{ padding: '1.5rem 1.8rem 0' }}>
                <div className="mgmt-toolbar">
                  <div className="mgmt-search-wrapper">
                    <span className="mgmt-search-icon"><Icon name="search" size={16} /></span>
                    <input
                      className="mgmt-search-input"
                      placeholder="Buscar por paciente, raza o código QR..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="mgmt-filter-group">
                    <button
                      className={`mgmt-filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      Todos ({mascotas.length})
                    </button>
                    <button
                      className={`mgmt-filter-chip ${statusFilter === 'Canino' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('Canino')}
                    >
                      Caninos
                    </button>
                    <button
                      className={`mgmt-filter-chip ${statusFilter === 'Felino' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('Felino')}
                    >
                      Felinos
                    </button>

                    {reception && <button
                      type="button"
                      onClick={() => { setFormError(''); setModalPetOpen(true); }}
                      style={{
                        marginLeft: 'auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.9rem',
                        background: '#0284C7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Icon name="plus" size={14} />
                      <span>+ Registrar Paciente QR</span>
                    </button>}
                  </div>
                </div>
              </div>

              <div className="mgmt-table-wrap">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Paciente</th>
                      <th>Especie & Raza</th>
                      <th>Propietario</th>
                      <th>Código Placa QR</th>
                      <th>Microchip</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePets.length === 0 && resourceStatus('/mascotas') === 'ready' && (
                      <tr><td colSpan={7} className="staff-empty-state">
                        {mascotas.length ? 'No encontramos mascotas con estos filtros.' : 'Todavía no hay mascotas registradas.'}
                      </td></tr>
                    )}
                    {visiblePets.map((m) => (
                        <tr key={m.id}>
                          <td><code>{m.id}</code></td>
                          <td>
                            <div className="mgmt-patient-cell">
                              <span className={`mgmt-patient-avatar ${m.especie === 'Canino' ? 'dog' : 'cat'}`}>
                                <Icon name={m.especie === 'Canino' ? 'dog' : 'cat'} size={17} />
                              </span>
                              <div>
                                <strong style={{ color: '#FFFFFF' }}>{m.nombre}</strong>
                                <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{m.sexo} · {m.edad}</div>
                              </div>
                            </div>
                          </td>
                          <td>{m.especie} · {m.raza}</td>
                          <td>{m.propietario}</td>
                          <td><span className="mgmt-qr-tag">{m.codigoQR}</span></td>
                          <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{m.chip}</span></td>
                          <td>
                            <span className="mgmt-badge ok">
                              <Icon name="check" size={12} /> {m.estado}
                            </span>
                          </td>
                          <td>
                            <Link to={`/pet/${m.codigoQR}`} className="btn-staff-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}>
                              <Icon name="qr" size={13} />
                              <span>Ver Placa</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA 3: CONSULTAS MÉDICAS */}
          {currentNav.id === 'consultas' && (
            <div className="mgmt-card">
              <div style={{ padding: '1.5rem 1.8rem 0' }}>
                <div className="mgmt-toolbar">
                  <div className="mgmt-search-wrapper">
                    <span className="mgmt-search-icon"><Icon name="search" size={16} /></span>
                    <input
                      className="mgmt-search-input"
                      placeholder="Filtrar consultas por paciente, motivo o doctor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="mgmt-filter-group">
                    <button
                      className={`mgmt-filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      Todas ({consultas.length})
                    </button>
                    <button
                      className={`mgmt-filter-chip ${statusFilter === 'done' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('done')}
                    >
                      Atendidas
                    </button>
                    <button
                      className={`mgmt-filter-chip ${statusFilter === 'waiting' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('waiting')}
                    >
                      En Espera
                    </button>
                  </div>
                </div>
              </div>

              <div className="mgmt-table-wrap">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Paciente</th>
                      <th>Propietario</th>
                      <th>Motivo de Consulta</th>
                      <th>Diagnóstico / Observación</th>
                      <th>Veterinario</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultas
                      .filter((c) => {
                        const match =
                          c.pet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.owner.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchF = statusFilter === 'all' || c.status === statusFilter;
                        return match && matchF;
                      })
                      .map((c) => (
                        <tr key={c.id || c.pet}>
                          <td><strong>{c.time}</strong></td>
                          <td>
                            <strong style={{ color: '#FFFFFF' }}>{c.pet}</strong>
                            <div style={{ fontSize: '0.76rem', color: '#9CA3AF' }}>{c.breed}</div>
                          </td>
                          <td>{c.owner}</td>
                          <td><strong>{c.reason}</strong></td>
                          <td><span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>{c.diagnostico}</span></td>
                          <td>{c.vet}</td>
                          <td>
                            <select
                              value={c.status}
                              onChange={(e) => handleChangeConsultaStatus(c.id || c.pet, e.target.value)}
                              style={{
                                padding: '0.3rem 0.65rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                background: c.status === 'done' ? '#065F46' : c.status === 'progress' ? '#92400E' : '#7F1D1D',
                                color: '#FFFFFF',
                                outline: 'none'
                              }}
                            >
                              <option value="waiting" style={{ background: '#1F2937' }}>⏳ En espera</option>
                              <option value="progress" style={{ background: '#1F2937' }}>⚡ En curso</option>
                              <option value="done" style={{ background: '#1F2937' }}>✓ Atendida</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA 4: CARNETS & VACUNACIÓN */}
          {currentNav.id === 'vacunas' && (
            <>
            <VaccineInventory batches={batches} today={today} onCreate={openBatchModal}
              status={resourceStatus('/clinica/lotes-vacunas')} />
            <div className="mgmt-card">
              <div style={{ padding: '1.5rem 1.8rem 0' }}>
                <h2>Carnet de vacunación</h2>
                <div className="mgmt-toolbar">
                  <div className="mgmt-search-wrapper">
                    <span className="mgmt-search-icon"><Icon name="search" size={16} /></span>
                    <input
                      className="mgmt-search-input"
                      placeholder="Buscar por vacuna, paciente o lote..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <button className="btn-staff-primary" onClick={openVaccineModal}>
                    <Icon name="syringe" size={16} />
                    <span>Aplicar Dosis</span>
                  </button>
                </div>
              </div>

              <div className="mgmt-table-wrap">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th>Lote</th>
                      <th>Paciente</th>
                      <th>Propietario</th>
                      <th>Vacuna Administrada</th>
                      <th>Fecha de Aplicación</th>
                      <th>Próximo Refuerzo</th>
                      <th>Veterinario</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleVaccines.length === 0 && resourceStatus('/clinica/vacunas') === 'ready' && (
                      <tr><td colSpan={8} className="staff-empty-state">
                        {vacunas.length ? 'No hay resultados para esa búsqueda.' : 'El carnet se llena al aplicar la primera dosis.'}
                      </td></tr>
                    )}
                    {visibleVaccines                      .map((v) => (
                        <tr key={v.id || v.pet}>
                          <td><code>{v.lote}</code></td>
                          <td><strong style={{ color: '#FFFFFF' }}>{v.pet}</strong></td>
                          <td>{v.owner}</td>
                          <td><strong>{v.vaccine}</strong></td>
                          <td>{v.applied || 'Sin fecha'}</td>
                          <td><strong>{v.expire || 'Sin fecha'}</strong></td>
                          <td>{v.vet}</td>
                          <td>
                            <span className={`mgmt-badge ${v.status === 'al-dia' ? 'ok' : 'warn'}`}>
                              <Icon name="shield" size={12} /> {VACCINE_STATUS[v.status] || 'Sin refuerzo registrado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          )}

          {/* VISTA 5: DIRECTORIO DE PROPIETARIOS */}
          {currentNav.id === 'propietarios' && (
            <div className="mgmt-card">
              <div style={{ padding: '1.5rem 1.8rem 0' }}>
                <div className="mgmt-toolbar">
                  <div className="mgmt-search-wrapper">
                    <span className="mgmt-search-icon"><Icon name="search" size={16} /></span>
                    <input
                      className="mgmt-search-input"
                      placeholder="Buscar por nombre, DNI o teléfono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mgmt-table-wrap">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th>Propietario</th>
                      <th>DNI</th>
                      <th>Teléfono Celular</th>
                      <th>Correo Electrónico</th>
                      <th>Dirección</th>
                      <th>Mascotas Registradas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOwners.length === 0 && resourceStatus('/auth/propietarios') === 'ready' && (
                      <tr><td colSpan={6} className="staff-empty-state">
                        {propietarios.length ? 'No encontramos propietarios con esa búsqueda.' : 'Aquí aparecerán los propietarios registrados en Huellas PetID.'}
                      </td></tr>
                    )}
                    {visibleOwners.map((p) => (
                        <tr key={p.id_propietario}>
                          <td><strong style={{ color: '#FFFFFF' }}>{p.nombres}</strong></td>
                          <td><code>{p.dni}</code></td>
                          <td>
                            {formatWhatsAppPhone(p.telefono) ? <a
                              href={`https://wa.me/${formatWhatsAppPhone(p.telefono)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#34D399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Icon name="phone" size={14} />
                              <span>{p.telefono}</span>
                            </a> : p.telefono || 'Sin teléfono registrado'}
                          </td>
                          <td>{p.correo}</td>
                          <td>{p.direccion}</td>
                          <td>
                            {p.mascotas.map((m, idx) => (
                              <span key={idx} className="mgmt-badge ok" style={{ marginRight: '0.4rem' }}>
                                {m}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA 6: RECORDATORIOS AUTOMÁTICOS */}
          {currentNav.id === 'recordatorios' && (
            <div className="mgmt-card">
              <div style={{ padding: '1.5rem 1.8rem 0' }}>
                <div className="mgmt-toolbar">
                  <div className="mgmt-search-wrapper">
                    <span className="mgmt-search-icon"><Icon name="search" size={16} /></span>
                    <input
                      className="mgmt-search-input"
                      placeholder="Buscar por mascota o dueño..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mgmt-table-wrap">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Paciente</th>
                      <th>Propietario</th>
                      <th>Canal de Envío</th>
                      <th>Asunto / Notificación</th>
                      <th>Fecha programada</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleReminders.length === 0 && resourceStatus('/mensajeria/recordatorios') === 'ready' && (
                      <tr><td colSpan={8} className="staff-empty-state">
                        {recordatorios.length ? 'No encontramos recordatorios con esa búsqueda.' : 'Todavía no hay recordatorios registrados.'}
                      </td></tr>
                    )}
                    {visibleReminders.map((r) => (
                      <tr key={r.id}>
                        <td><code>{r.id}</code></td>
                        <td><strong style={{ color: '#FFFFFF' }}>{r.pet}</strong></td>
                        <td>{r.owner}</td>
                        <td>
                          <span className="mgmt-badge ok">
                            {r.canal}
                          </span>
                        </td>
                        <td>{r.asunto}</td>
                        <td>{r.programado}</td>
                        <td>
                          <span className={`mgmt-badge ${r.estado === 'Enviado' ? 'ok' : 'warn'}`}>
                            {r.estado}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-staff-secondary"
                            style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}
                            onClick={() => handleResendReminder(r)}
                          >
                            <Icon name="refresh" size={13} /> Reenviar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA 7: USUARIOS STAFF (SOLO ADMIN) */}
          {currentNav.id === 'usuarios' && (
            <div className="mgmt-card">
              <div style={{ padding: '1.5rem 1.8rem 0' }}>
                <div className="mgmt-toolbar">
                  <div className="mgmt-search-wrapper">
                    <span className="mgmt-search-icon"><Icon name="search" size={16} /></span>
                    <input
                      className="mgmt-search-input"
                      placeholder="Buscar por nombre, correo o rol..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select className="staff-input-field" aria-label="Filtrar cuentas por rol"
                    value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">Todos los roles</option>
                    {['Administrador', 'Veterinario', 'Recepcionista', 'Propietario'].map((role) =>
                      <option key={role} value={role}>{role}</option>
                    )}
                  </select>
                  <button className="btn-staff-primary" onClick={() => { setFormError(''); setModalStaffOpen(true); }}>
                    <Icon name="plus" size={16} />
                    <span>Crear cuenta de personal</span>
                  </button>
                </div>
              </div>

              <div className="mgmt-table-wrap">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol en el Sistema</th>
                      <th>Especialidad / Área</th>
                      <th>Turno</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAccounts.length === 0 && resourceStatus('/auth/usuarios') === 'ready' && (
                      <tr><td colSpan={6} className="staff-empty-state">No hay cuentas que coincidan con los filtros.</td></tr>
                    )}
                    {visibleAccounts                      .map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div className="mgmt-patient-cell">
                              <span className="mgmt-patient-avatar" style={{ background: '#1F2937', color: '#10B981' }}>
                                <Icon name="user" size={16} />
                              </span>
                              <div>
                                <strong style={{ color: '#FFFFFF' }}>{u.nombres}</strong>
                              </div>
                            </div>
                          </td>
                          <td>{u.correo}</td>
                          <td>
                            <span className={`mgmt-badge ${u.rol === 'Veterinario' ? 'ok' : u.rol === 'Administrador' ? 'warn' : 'other'}`}>
                              {u.rol}
                            </span>
                          </td>
                          <td>{u.especialidad}</td>
                          <td>{u.turno}</td>
                          <td>
                            <span className={`mgmt-badge ${u.estado === 'activo' ? 'ok' : 'other'}`}>
                              <Icon name="check" size={12} /> {u.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: REGISTRAR NUEVA CONSULTA MÉDICA */}
      {modalConsultaOpen && (
        <div className="staff-modal-overlay" onClick={() => setModalConsultaOpen(false)}>
          <div className="staff-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>Registrar Consulta Médica</h3>
              <button onClick={() => setModalConsultaOpen(false)} style={{ color: '#9CA3AF' }}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateConsulta}>
              {formError && <p role="alert">{formError}</p>}
              <div className="staff-modal-body">
                <label>
                  Paciente *
                  <select className="staff-input-field" required value={formConsulta.id_mascota}
                    onChange={(event) => {
                      setClinicalSummary(null);
                      setFormConsulta({ ...formConsulta, id_mascota: event.target.value });
                    }}>
                    <option value="">Selecciona un paciente</option>
                    {patientOptions}
                  </select>
                </label>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                    Motivo Principal de Consulta *
                  </label>
                  <input
                    className="staff-input-field"
                    required
                    placeholder="Ej. Control dermatológico, vómitos, cojera..."
                    value={formConsulta.reason}
                    onChange={(e) => setFormConsulta({ ...formConsulta, reason: e.target.value })}
                  />
                </div>

                <div className="staff-modal-form-grid">
                  <label>Peso (kg)
                    <input className="staff-input-field" type="number" min="0.01" max="999.99" step="0.01"
                      value={formConsulta.peso} onChange={(event) => setFormConsulta({ ...formConsulta, peso: event.target.value })} />
                  </label>
                  <label>Temperatura (°C)
                    <input className="staff-input-field" type="number" min="0.01" max="99.99" step="0.01"
                      value={formConsulta.temperatura} onChange={(event) => setFormConsulta({ ...formConsulta, temperatura: event.target.value })} />
                  </label>
                </div>
                <button type="button" className="btn-staff-secondary"
                  disabled={loadingAI || !formConsulta.id_mascota} onClick={handleGenerateClinicalDraft}>
                  {loadingAI ? 'Generando…' : 'Generar borrador clínico'}
                </button>
                {clinicalSummary && (
                  <div>
                    <p>Revisa el borrador antes de incorporarlo a la consulta.</p>
                    <p>{clinicalSummary.borrador_diagnostico}</p>
                    <p>{clinicalSummary.indicaciones_sugeridas}</p>
                    <button type="button" className="btn-staff-secondary" onClick={() => setFormConsulta({
                      ...formConsulta,
                      diagnostico: clinicalSummary.borrador_diagnostico,
                      tratamiento_receta: clinicalSummary.indicaciones_sugeridas,
                    })}>Copiar al formulario</button>
                  </div>
                )}
                <label>Diagnóstico clínico
                  <textarea className="staff-input-field" rows="3" value={formConsulta.diagnostico}
                    onChange={(event) => setFormConsulta({ ...formConsulta, diagnostico: event.target.value })} />
                </label>
                <label>Tratamiento o receta
                  <textarea className="staff-input-field" rows="3" value={formConsulta.tratamiento_receta}
                    onChange={(event) => setFormConsulta({ ...formConsulta, tratamiento_receta: event.target.value })} />
                </label>
              </div>

              <div className="staff-modal-footer">
                <button type="button" className="btn-staff-secondary" onClick={() => setModalConsultaOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-staff-primary" disabled={saving}>
                  <Icon name="check" size={16} /> Guardar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APLICAR VACUNA */}
      {modalVacunaOpen && (
        <div className="staff-modal-overlay" onClick={() => setModalVacunaOpen(false)}>
          <div className="staff-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>Aplicar Dosis de Vacuna</h3>
              <button onClick={() => setModalVacunaOpen(false)} style={{ color: '#9CA3AF' }}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateVacuna}>
              {formError && <p role="alert">{formError}</p>}
              <div className="staff-modal-body">
                <label>
                  Paciente *
                  <select className="staff-input-field" required value={formVacuna.id_mascota}
                    onChange={(event) => setFormVacuna({ ...formVacuna, id_mascota: event.target.value })}>
                    <option value="">Selecciona un paciente</option>
                    {patientOptions}
                  </select>
                </label>

                <div className="staff-modal-form-grid">
                  <label>Fecha de aplicación
                    <input className="staff-input-field" required type="date" max={today}
                      value={formVacuna.fecha_aplicacion}
                      onChange={(event) => setFormVacuna({ ...formVacuna, fecha_aplicacion: event.target.value, id_lote: '' })} />
                  </label>
                  <label>Fecha de próximo refuerzo
                    <input className="staff-input-field" required type="date" value={formVacuna.fecha_proximo_refuerzo}
                      onChange={(event) => setFormVacuna({ ...formVacuna, fecha_proximo_refuerzo: event.target.value })} />
                  </label>
                </div>
                <label>Vacuna y lote
                  <select className="staff-input-field" required value={formVacuna.id_lote}
                    onChange={(event) => setFormVacuna({ ...formVacuna, id_lote: event.target.value })}>
                    <option value="">Selecciona un lote</option>
                    {eligibleBatches.map((batch) => (
                      <option key={batch.id_lote} value={batch.id_lote}>
                        {batch.vacuna} · {batch.lote_fabricante} · {batch.dosis_disponibles} disponibles
                      </option>
                    ))}
                  </select>
                </label>
                {resourceStatus('/clinica/lotes-vacunas') === 'ready' && eligibleBatches.length === 0 && (
                  <p>No hay lotes disponibles para esa fecha.{' '}
                    <button type="button" className="btn btn-outline sm" onClick={() => {
                      setModalVacunaOpen(false);
                      openBatchModal();
                    }}>Registrar un lote</button>
                  </p>
                )}
                <label>Observaciones
                  <textarea className="staff-input-field" rows="2" maxLength={255} value={formVacuna.observaciones}
                    onChange={(event) => setFormVacuna({ ...formVacuna, observaciones: event.target.value })} />
                </label>
              </div>

              <div className="staff-modal-footer">
                <button type="button" className="btn-staff-secondary" onClick={() => setModalVacunaOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-staff-primary" disabled={saving || !eligibleBatches.length || !mascotas.length}>
                  <Icon name="check" size={16} /> Registrar en Carnet Digital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalBatchOpen && (
        <div className="staff-modal-overlay" onClick={() => setModalBatchOpen(false)}>
          <div className="staff-modal-box" role="dialog" aria-modal="true" aria-labelledby="batch-title"
            onClick={(event) => event.stopPropagation()}>
            <div className="staff-modal-header">
              <h3 id="batch-title">Registrar lote de vacunas</h3>
              <button type="button" aria-label="Cerrar" onClick={() => setModalBatchOpen(false)}><Icon name="close" size={20} /></button>
            </div>
            <form onSubmit={handleCreateBatch}>
              {formError && <p role="alert">{formError}</p>}
              <div className="staff-modal-body">
                <label>Nombre de la vacuna
                  <input className="staff-input-field" required maxLength={120} value={formBatch.vacuna}
                    onChange={(event) => setFormBatch({ ...formBatch, vacuna: event.target.value })} />
                </label>
                <label>Número de lote del fabricante
                  <input className="staff-input-field" required maxLength={60} value={formBatch.lote_fabricante}
                    onChange={(event) => setFormBatch({ ...formBatch, lote_fabricante: event.target.value })} />
                </label>
                <div className="staff-modal-form-grid">
                  <label>Fecha de vencimiento
                    <input className="staff-input-field" required type="date" min={today} value={formBatch.fecha_vencimiento}
                      onChange={(event) => setFormBatch({ ...formBatch, fecha_vencimiento: event.target.value })} />
                  </label>
                  <label>Dosis recibidas
                    <input className="staff-input-field" required type="number" min="1" max="1000000" value={formBatch.dosis_iniciales}
                      onChange={(event) => setFormBatch({ ...formBatch, dosis_iniciales: event.target.value })} />
                  </label>
                </div>
              </div>
              <div className="staff-modal-footer">
                <button type="button" className="btn-staff-secondary" onClick={() => setModalBatchOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-staff-primary" disabled={saving}>Guardar lote</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREAR PERSONAL (ADMIN) */}
      {modalStaffOpen && (
        <div className="staff-modal-overlay" onClick={() => setModalStaffOpen(false)}>
          <div className="staff-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>Crear Cuenta de Personal Clínico</h3>
              <button onClick={() => setModalStaffOpen(false)} style={{ color: '#9CA3AF' }}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateStaff}>
              {formError && <p role="alert">{formError}</p>}
              <div className="staff-modal-body">
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                    Nombres y Apellidos Completos *
                  </label>
                  <input
                    className="staff-input-field"
                    required
                    placeholder="Ej. Dr. Mario Vargas"
                    value={formStaff.nombres}
                    onChange={(e) => setFormStaff({ ...formStaff, nombres: e.target.value })}
                  />
                </div>

                <div className="staff-modal-form-grid">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Correo Institucional *
                    </label>
                    <input
                      className="staff-input-field"
                      required
                      type="email"
                      placeholder="mario.vargas@huellas.com"
                      value={formStaff.correo}
                      onChange={(e) => setFormStaff({ ...formStaff, correo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Rol Autorizado
                    </label>
                    <select
                      className="staff-input-field"
                      value={formStaff.rol}
                      onChange={(e) => setFormStaff({ ...formStaff, rol: e.target.value })}
                    >
                      <option value="Veterinario">Veterinario</option>
                      <option value="Recepcionista">Recepcionista</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="staff-modal-form-grid">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Especialidad / Área
                    </label>
                    <input
                      className="staff-input-field"
                      placeholder="Ej. Cirugía, Vacunación, Admisión"
                      value={formStaff.especialidad}
                      onChange={(e) => setFormStaff({ ...formStaff, especialidad: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Turno Asignado
                    </label>
                    <input
                      className="staff-input-field"
                      value={formStaff.turno}
                      onChange={(e) => setFormStaff({ ...formStaff, turno: e.target.value })}
                    />
                  </div>
                </div>
                <label>Contraseña inicial *
                  <input className="staff-input-field" type="password" autoComplete="new-password" required
                    minLength="12" maxLength="128" value={formStaff.password}
                    onChange={(event) => setFormStaff({ ...formStaff, password: event.target.value })} />
                </label>
              </div>

              <div className="staff-modal-footer">
                <button type="button" className="btn-staff-secondary" onClick={() => setModalStaffOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-staff-primary" disabled={saving}>
                  <Icon name="check" size={16} /> Emitir Credenciales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REGISTRAR PACIENTE QR (RECEPCIÓN & ADMIN) */}
      {modalPetOpen && (
        <div className="staff-modal-overlay" onClick={() => setModalPetOpen(false)}>
          <div className="staff-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="staff-modal-header">
              <div>
                <h3>Registrar Paciente con Placa QR</h3>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                  Sincronización en tiempo real con el portal del propietario
                </span>
              </div>
              <button onClick={() => setModalPetOpen(false)} style={{ color: '#9CA3AF', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePetReception}>
              {formError && <p role="alert">{formError}</p>}
              <div className="staff-modal-body">
                <div className="staff-modal-form-grid">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Nombre del Paciente *
                    </label>
                    <input
                      className="staff-input-field"
                      required
                      placeholder="Ej. Balto, Misi, Toby..."
                      value={formPet.nombre}
                      onChange={(e) => setFormPet({ ...formPet, nombre: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Propietario Responsable *
                    </label>
                    <select className="staff-input-field" required value={formPet.id_propietario}
                      onChange={(event) => setFormPet({ ...formPet, id_propietario: event.target.value })}>
                      <option value="">Selecciona un propietario registrado</option>
                      {activeOwners.map((owner) => (
                        <option key={owner.id_propietario} value={owner.id_propietario}>{owner.nombres} · {owner.correo}</option>
                      ))}
                    </select>
                    {resourceStatus('/auth/propietarios') === 'ready' && activeOwners.length === 0 && (
                      <p className="staff-empty-state">El propietario debe completar su registro antes de que puedas asignarle una mascota.</p>
                    )}
                  </div>
                </div>

                <div className="staff-modal-form-grid">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Especie
                    </label>
                    <select
                      className="staff-input-field"
                      value={formPet.especie}
                      onChange={(e) => {
                        const esp = e.target.value;
                        const rList = getRazasPorEspecie(esp);
                        setFormPet({ ...formPet, especie: esp, raza: rList[0] || 'Mestizo' });
                      }}
                    >
                      <option value="Canino">Canino (Perro)</option>
                      <option value="Felino">Felino (Gato)</option>
                      <option value="Conejo">Conejo</option>
                      <option value="Ave">Ave</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Raza (Catálogo Normalizado) *
                    </label>
                    <select
                      className="staff-input-field"
                      value={formPet.raza}
                      onChange={(e) => setFormPet({ ...formPet, raza: e.target.value })}
                    >
                      {getRazasPorEspecie(formPet.especie).map((r) => (
                        <option key={r} value={r} style={{ background: '#0F172A', color: '#FFFFFF' }}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="staff-modal-form-grid">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Sexo
                    </label>
                    <select
                      className="staff-input-field"
                      value={formPet.sexo}
                      onChange={(e) => setFormPet({ ...formPet, sexo: e.target.value })}
                    >
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                  </div>
                </div>

                <div className="staff-modal-form-grid">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Edad Aproximada
                    </label>
                    <input
                      className="staff-input-field"
                      placeholder="Ej. 2 años"
                      value={formPet.edad}
                      onChange={(e) => setFormPet({ ...formPet, edad: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Peso (kg)
                    </label>
                    <input
                      className="staff-input-field"
                      type="number"
                      step="0.1"
                      placeholder="Ej. 11.5"
                      value={formPet.peso}
                      onChange={(e) => setFormPet({ ...formPet, peso: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                    Alergias / Observaciones Médicas
                  </label>
                  <input
                    className="staff-input-field"
                    placeholder="Ej. Alergia a picadura de pulgas, sensibilidad estomacal..."
                    value={formPet.alergias}
                    onChange={(e) => setFormPet({ ...formPet, alergias: e.target.value })}
                  />
                </div>
              </div>

              <div className="staff-modal-footer">
                <button type="button" className="btn-staff-secondary" onClick={() => setModalPetOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-staff-primary" disabled={saving}>
                  <Icon name="check" size={16} /> Registrar y Emitir Placa QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
