// src/pages/Dashboard.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUser, logout } from '../services/authService';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import { Spark, BarChart, Donut } from '../components/Charts';
import {
  KPIS,
  WEEK,
  MONTH,
  SPECIES,
  VACCINES,
  ACTIVITY,
  CONSULTS,
  MASCOTAS_CLINICA,
  PROPIETARIOS_CLINICA,
  USUARIOS_STAFF,
  RECORDATORIOS_CLINICA
} from '../data/data';
import '../styles/Dashboard.css';
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
      { id: 'usuarios', icon: 'user', label: 'Usuarios Staff', roles: ['Administrador'] },
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
  usuarios: { title: 'Personal Clínico', desc: 'Cuentas institucionales, roles y control de acceso del personal.' },
};

const STATUS_TEXT = { done: 'Atendida', progress: 'En curso', waiting: 'En espera' };
const STATUS_CLASS = { done: 'ok', progress: 'warn', waiting: 'danger' };

export default function Dashboard() {
  const navigate = useNavigate();
  const initialUser = getUser() || { nombres: 'Dra. Ana Torres', rol: 'Veterinario', correo: 'veterinario@huellas.com' };
  
  // Estado del usuario activo (permite simular roles fácilmente para pruebas)
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState('inicio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chartRange, setChartRange] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Listas interactivas
  const [consultas, setConsultas] = useState(CONSULTS);
  const [mascotas, _setMascotas] = useState(MASCOTAS_CLINICA);
  const [vacunas, setVacunas] = useState(VACCINES);
  const [personal, setPersonal] = useState(USUARIOS_STAFF);

  // Estados de modales
  const [modalConsultaOpen, setModalConsultaOpen] = useState(false);
  const [modalVacunaOpen, setModalVacunaOpen] = useState(false);
  const [modalStaffOpen, setModalStaffOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Formularios
  const [formConsulta, setFormConsulta] = useState({
    pet: '',
    breed: '',
    owner: '',
    reason: '',
    diagnostico: '',
    vet: currentUser.nombres,
    time: 'Ahora'
  });

  const [formVacuna, setFormVacuna] = useState({
    pet: '',
    owner: '',
    vaccine: 'Antirrábica Rabisin',
    lote: 'LT-9941',
    expire: 'En 1 año',
    vet: currentUser.nombres
  });

  const [formStaff, setFormStaff] = useState({
    nombres: '',
    correo: '',
    rol: 'Veterinario',
    especialidad: '',
    turno: 'Mañana (8:00 - 14:00)'
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

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    let newNombres = 'Dra. Ana Torres';
    let newEmail = 'veterinario@huellas.com';
    if (newRole === 'Recepcionista') {
      newNombres = 'Carlos Mendoza';
      newEmail = 'recepcion@huellas.com';
    } else if (newRole === 'Administrador') {
      newNombres = 'Administrador General';
      newEmail = 'admin@huellas.com';
    }
    const updated = { ...currentUser, rol: newRole, nombres: newNombres, correo: newEmail };
    setCurrentUser(updated);
    setActiveTab('inicio');
    setToastMessage(`Simulando vista para rol: ${newRole}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleCreateConsulta = (e) => {
    e.preventDefault();
    if (!formConsulta.pet || !formConsulta.reason) return;
    const nueva = {
      id: 'C-' + Math.floor(10 + Math.random() * 90),
      pet: formConsulta.pet,
      breed: formConsulta.breed || 'Mestizo',
      owner: formConsulta.owner || 'Propietario',
      reason: formConsulta.reason,
      vet: currentUser.nombres,
      time: '12:45',
      status: 'progress',
      diagnostico: formConsulta.diagnostico || 'Atención en curso en consultorio.'
    };
    setConsultas([nueva, ...consultas]);
    setModalConsultaOpen(false);
    setFormConsulta({ pet: '', breed: '', owner: '', reason: '', diagnostico: '', vet: currentUser.nombres, time: 'Ahora' });
    showToast(`Consulta registrada exitosamente para ${nueva.pet}`);
  };

  const handleCreateVacuna = (e) => {
    e.preventDefault();
    if (!formVacuna.pet) return;
    const nueva = {
      id: 'V-' + Math.floor(100 + Math.random() * 900),
      pet: formVacuna.pet,
      owner: formVacuna.owner || 'Propietario',
      vaccine: formVacuna.vaccine,
      lote: formVacuna.lote,
      applied: 'Hoy',
      expire: 'En 1 año',
      status: 'al-dia',
      vet: currentUser.nombres
    };
    setVacunas([nueva, ...vacunas]);
    setModalVacunaOpen(false);
    showToast(`Dosis de ${nueva.vaccine} aplicada a ${nueva.pet}`);
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!formStaff.nombres || !formStaff.correo) return;
    const nuevo = {
      id: 'U-' + Math.floor(10 + Math.random() * 90),
      nombres: formStaff.nombres,
      correo: formStaff.correo,
      rol: formStaff.rol,
      especialidad: formStaff.especialidad || 'Atención General',
      turno: formStaff.turno,
      estado: 'activo'
    };
    setPersonal([...personal, nuevo]);
    setModalStaffOpen(false);
    showToast(`Cuenta institucional creada para ${nuevo.nombres}`);
  };

  const salir = () => {
    logout();
    navigate('/login');
  };

  const go = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chart = chartRange === 'week' ? WEEK : MONTH;
  const isVet = currentUser.rol === 'Veterinario';
  const isRecep = currentUser.rol === 'Recepcionista';
  const isAdmin = currentUser.rol === 'Administrador';

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

          {/* SIMULADOR DE ROL EN TIEMPO REAL */}
          <div className="role-badge-selector" title="Prueba rápida de perfiles de personal">
            <span>Rol Clínico:</span>
            <select value={currentUser.rol} onChange={handleRoleChange}>
              <option value="Veterinario">Veterinario</option>
              <option value="Recepcionista">Recepcionista</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>

          <label className="search">
            <Icon name="search" size={17} />
            <input
              placeholder="Buscar paciente, código QR o dueño..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar"
            />
          </label>

          <button className="icon-btn has-dot" aria-label="Notificaciones" title="Alertas de la clínica">
            <Icon name="bell" size={18} />
          </button>
        </header>

        {/* TOAST DE FEEDBACK */}
        {toastMessage && (
          <div className="hp-owner-alert animate-fade" style={{ margin: '1rem 2rem 0' }}>
            <Icon name="shield" size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="page">
          {/* BANNER DINÁMICO DE ACCIÓN CLÍNICA SEGÚN ROL */}
          <section className="staff-action-banner">
            <div className="staff-action-info">
              <div className={`staff-role-icon-box ${isVet ? 'vet' : isRecep ? 'recep' : 'admin'}`}>
                <Icon name={isVet ? 'doctor' : isRecep ? 'desk' : 'shield'} size={26} />
              </div>
              <div className="staff-action-text">
                <h2>{SECTIONS[currentNav.id]?.title}</h2>
                <p>
                  Bienvenido, <strong>{currentUser.nombres}</strong> ({currentUser.rol}). {SECTIONS[currentNav.id]?.desc}
                </p>
              </div>
            </div>

            <div className="staff-action-btns">
              {isVet && (
                <>
                  <button className="btn-staff-primary" onClick={() => setModalConsultaOpen(true)}>
                    <Icon name="plus" size={16} />
                    <span>Nueva Consulta</span>
                  </button>
                  <button className="btn-staff-secondary" onClick={() => setModalVacunaOpen(true)}>
                    <Icon name="syringe" size={16} />
                    <span>Aplicar Vacuna</span>
                  </button>
                </>
              )}

              {isRecep && (
                <>
                  <button className="btn-staff-primary" onClick={() => go('mascotas')}>
                    <Icon name="paw" size={16} />
                    <span>Registrar Paciente QR</span>
                  </button>
                  <button className="btn-staff-secondary" onClick={() => go('consultas')}>
                    <Icon name="clipboard" size={16} />
                    <span>Ingresar a Espera</span>
                  </button>
                </>
              )}

              {isAdmin && (
                <>
                  <button className="btn-staff-primary" onClick={() => setModalStaffOpen(true)}>
                    <Icon name="userCheck" size={16} />
                    <span>Crear Personal</span>
                  </button>
                  <button className="btn-staff-secondary" onClick={() => go('usuarios')}>
                    <Icon name="shield" size={16} />
                    <span>Auditoría de Roles</span>
                  </button>
                </>
              )}
            </div>
          </section>

          {/* VISTA 1: INICIO (RESUMEN GENERAL) */}
          {currentNav.id === 'inicio' && (
            <>
              {/* KPIS DE RENDIMIENTO CLÍNICO */}
              <section className="kpis">
                {KPIS.map((k) => (
                  <article className={`kpi tone-${k.tone}`} key={k.id}>
                    <div className="kpi-top">
                      <span className="tile"><Icon name={k.icon} size={22} /></span>
                      <span className={`delta ${k.good ? 'good' : 'bad'}`}>{k.delta}</span>
                    </div>
                    <strong className="kpi-val">{k.value}</strong>
                    <div className="kpi-foot">
                      <span>{k.label}</span>
                      <Spark data={k.trend} />
                    </div>
                  </article>
                ))}
              </section>

              {/* ALERTA DE MASCOTA EXTRAVIADA DETECTADA */}
              <section className="strip" role="status">
                <span className="strip-ico"><Icon name="alert" size={20} /></span>
                <p>
                  <strong>Modo Mascota Extraviada Activo.</strong> Toby (Beagle #HP-4092) fue escaneado en Miraflores. El sistema notificó automáticamente al propietario Jorge Salas vía WhatsApp.
                </p>
                <Link to="/pet/HP-4092" className="btn btn-outline sm">
                  Ver Ficha QR
                </Link>
              </section>

              {/* GRÁFICOS */}
              <section className="grid-2-1">
                <article className="card">
                  <header className="card-head">
                    <div>
                      <h2>Consultas Médicas Atendidas</h2>
                      <p>{chartRange === 'week' ? 'Semana en curso' : 'Últimas 8 semanas'}</p>
                    </div>
                    <div className="seg" role="group" aria-label="Rango del gráfico">
                      <button className={chartRange === 'week' ? 'on' : ''} onClick={() => setChartRange('week')}>
                        7 días
                      </button>
                      <button className={chartRange === 'month' ? 'on' : ''} onClick={() => setChartRange('month')}>
                        8 semanas
                      </button>
                    </div>
                  </header>
                  <BarChart key={chartRange} labels={chart.labels} data={chart.data} />
                </article>

                <article className="card">
                  <header className="card-head">
                    <div>
                      <h2>Distribución por Especie</h2>
                      <p>1,284 pacientes activos</p>
                    </div>
                  </header>
                  <Donut parts={SPECIES} total="1,284" label="pacientes" />
                  <ul className="legend">
                    {SPECIES.map((s) => (
                      <li key={s.name}>
                        <i style={{ background: s.color }} />
                        {s.name}
                        <strong>{s.value}%</strong>
                      </li>
                    ))}
                  </ul>
                </article>
              </section>

              {/* ACTIVIDAD & VACUNAS POR VENCER */}
              <section className="grid-2-1">
                <article className="card">
                  <header className="card-head">
                    <div>
                      <h2>Próximas Vacunas por Vencer</h2>
                      <p>Dosis con recordatorio pendiente</p>
                    </div>
                    <button className="btn btn-outline sm" onClick={() => go('vacunas')}>
                      Ver Todas <Icon name="arrow" size={16} />
                    </button>
                  </header>
                  <ul className="list">
                    {vacunas.slice(0, 5).map((v) => (
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
                      <p>Eventos clínicos del día</p>
                    </div>
                  </header>
                  <ul className="list">
                    {ACTIVITY.map((a, idx) => (
                      <li className="row activity" key={idx}>
                        <span className="tile sm" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' }}>
                          <Icon name={a.icon} size={16} />
                        </span>
                        <div className="row-text">
                          <strong>{a.text}</strong>
                          <span>{a.by} · {a.time}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              </section>

              {/* TABLA DE CITAS DEL DÍA */}
              <article className="card">
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
                      {consultas.map((c) => (
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
                            <span className={`chip ${c.status}`}>
                              {STATUS_TEXT[c.status] || c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
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
                    {mascotas
                      .filter((m) => {
                        const matchSearch =
                          m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.codigoQR.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.propietario.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchFilter = statusFilter === 'all' || m.especie === statusFilter;
                        return matchSearch && matchFilter;
                      })
                      .map((m) => (
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
                            <span className={`mgmt-badge ${STATUS_CLASS[c.status] || 'ok'}`}>
                              {STATUS_TEXT[c.status] || c.status}
                            </span>
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
            <div className="mgmt-card">
              <div style={{ padding: '1.5rem 1.8rem 0' }}>
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

                  <button className="btn-staff-primary" onClick={() => setModalVacunaOpen(true)}>
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
                    {vacunas
                      .filter((v) =>
                        v.pet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.vaccine.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.lote.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((v) => (
                        <tr key={v.id || v.pet}>
                          <td><code>{v.lote}</code></td>
                          <td><strong style={{ color: '#FFFFFF' }}>{v.pet}</strong></td>
                          <td>{v.owner}</td>
                          <td><strong>{v.vaccine}</strong></td>
                          <td>{v.applied}</td>
                          <td><strong>{v.expire}</strong></td>
                          <td>{v.vet}</td>
                          <td>
                            <span className={`mgmt-badge ${v.status === 'por-vencer' ? 'warn' : 'ok'}`}>
                              <Icon name="shield" size={12} /> {v.status === 'por-vencer' ? 'Por Vencer' : 'Vigente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
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
                    {PROPIETARIOS_CLINICA
                      .filter((p) =>
                        p.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.dni.includes(searchTerm) ||
                        p.telefono.includes(searchTerm)
                      )
                      .map((p) => (
                        <tr key={p.id}>
                          <td><strong style={{ color: '#FFFFFF' }}>{p.nombres}</strong></td>
                          <td><code>{p.dni}</code></td>
                          <td>
                            <a
                              href={`https://wa.me/51${p.telefono.replace(/\s+/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#34D399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Icon name="phone" size={14} />
                              <span>{p.telefono}</span>
                            </a>
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
                      <th>Fecha Programada</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECORDATORIOS_CLINICA.map((r) => (
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
                            onClick={() => showToast(`Notificación reenviada a ${r.owner}`)}
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
                      placeholder="Buscar miembros del equipo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <button className="btn-staff-primary" onClick={() => setModalStaffOpen(true)}>
                    <Icon name="plus" size={16} />
                    <span>Crear Nuevo Usuario Staff</span>
                  </button>
                </div>
              </div>

              <div className="mgmt-table-wrap">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th>Profesional</th>
                      <th>Correo Institucional</th>
                      <th>Rol en el Sistema</th>
                      <th>Especialidad / Área</th>
                      <th>Turno</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personal
                      .filter((u) =>
                        u.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.correo.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((u) => (
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
                            <span className="mgmt-badge ok">
                              <Icon name="check" size={12} /> Activo
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
              <div className="staff-modal-body">
                <div className="staff-modal-form-grid">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Nombre del Paciente *
                    </label>
                    <input
                      className="staff-input-field"
                      required
                      placeholder="Ej. Toby, Max..."
                      value={formConsulta.pet}
                      onChange={(e) => setFormConsulta({ ...formConsulta, pet: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Raza / Especie
                    </label>
                    <input
                      className="staff-input-field"
                      placeholder="Ej. Beagle, Siamés..."
                      value={formConsulta.breed}
                      onChange={(e) => setFormConsulta({ ...formConsulta, breed: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                    Propietario Responsable
                  </label>
                  <input
                    className="staff-input-field"
                    placeholder="Ej. Jorge Salas"
                    value={formConsulta.owner}
                    onChange={(e) => setFormConsulta({ ...formConsulta, owner: e.target.value })}
                  />
                </div>

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

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                    Diagnóstico Clínico & Receta Médica
                  </label>
                  <textarea
                    className="staff-input-field"
                    rows="3"
                    placeholder="Observaciones de triaje, signos vitales y tratamiento prescrito..."
                    value={formConsulta.diagnostico}
                    onChange={(e) => setFormConsulta({ ...formConsulta, diagnostico: e.target.value })}
                  />
                </div>
              </div>

              <div className="staff-modal-footer">
                <button type="button" className="btn-staff-secondary" onClick={() => setModalConsultaOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-staff-primary">
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
              <div className="staff-modal-body">
                <div className="staff-modal-form-grid">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Paciente *
                    </label>
                    <input
                      className="staff-input-field"
                      required
                      placeholder="Nombre de la mascota"
                      value={formVacuna.pet}
                      onChange={(e) => setFormVacuna({ ...formVacuna, pet: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Propietario
                    </label>
                    <input
                      className="staff-input-field"
                      placeholder="Nombre del dueño"
                      value={formVacuna.owner}
                      onChange={(e) => setFormVacuna({ ...formVacuna, owner: e.target.value })}
                    />
                  </div>
                </div>

                <div className="staff-modal-form-grid">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Biológico / Vacuna *
                    </label>
                    <select
                      className="staff-input-field"
                      value={formVacuna.vaccine}
                      onChange={(e) => setFormVacuna({ ...formVacuna, vaccine: e.target.value })}
                    >
                      <option value="Antirrábica Rabisin">Antirrábica Rabisin</option>
                      <option value="Sextuple Vanguard Plus">Sextuple Vanguard Plus</option>
                      <option value="Triple Felina Felocell">Triple Felina Felocell</option>
                      <option value="KC Bronchicine">KC Bronchicine (Tos de las perreras)</option>
                      <option value="Parvovirus Nobivac">Parvovirus Nobivac</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.3rem', display: 'block' }}>
                      Número de Lote *
                    </label>
                    <input
                      className="staff-input-field"
                      required
                      value={formVacuna.lote}
                      onChange={(e) => setFormVacuna({ ...formVacuna, lote: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="staff-modal-footer">
                <button type="button" className="btn-staff-secondary" onClick={() => setModalVacunaOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-staff-primary">
                  <Icon name="check" size={16} /> Registrar en Carnet Digital
                </button>
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
              </div>

              <div className="staff-modal-footer">
                <button type="button" className="btn-staff-secondary" onClick={() => setModalStaffOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-staff-primary">
                  <Icon name="check" size={16} /> Emitir Credenciales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
