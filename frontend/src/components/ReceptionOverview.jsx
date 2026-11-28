import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function ReceptionOverview({ mascotas, propietarios, recordatorios, gpsAlerts, status, onOpenSection }) {
  const pendientes = recordatorios
    .filter((reminder) => reminder.estado === 'Programado')
    .sort((first, second) => new Date(first.fecha_programada) - new Date(second.fecha_programada));
  const kpis = [
    ['paw', 'sky', 'Mascotas registradas', mascotas.length, '/mascotas'],
    ['users', 'green', 'Propietarios registrados', propietarios.length, '/auth/propietarios'],
    ['bell', 'amber', 'Recordatorios programados', pendientes.length, '/mensajeria/recordatorios'],
    ['pin', 'violet', 'Alertas GPS activas', gpsAlerts.length, '/mascotas/alertas-gps'],
  ];
  const mascotasReady = status('/mascotas') === 'ready';
  const recordatoriosReady = status('/mensajeria/recordatorios') === 'ready';

  return (
    <>
      <section className="kpis" aria-label="Resumen de recepción">
        {kpis.map(([icon, tone, label, count, path]) => (
          <article className={`kpi tone-${tone}`} key={path}>
            <span className="tile"><Icon name={icon} size={22} /></span>
            <strong className="kpi-val">{status(path) === 'ready' ? count : '—'}</strong>
            <div className="kpi-foot"><span>{label}</span></div>
          </article>
        ))}
      </section>

      <section className="grid-2-1">
        <article className="card">
          <header className="card-head">
            <h2>Mascotas recientes</h2>
            <button type="button" className="btn btn-outline sm" onClick={() => onOpenSection('mascotas')}>Ver mascotas</button>
          </header>
          {mascotasReady && (mascotas.length ? (
            <ul className="list">
              {mascotas.slice(0, 5).map((pet) => (
                <li className="row" key={pet.id_mascota}>
                  <span className="avatar"><Icon name="paw" size={16} /></span>
                  <div className="row-text">
                    <strong>{pet.nombre}</strong>
                    <span>{pet.propietario || 'Sin propietario asociado'} · {pet.especie}</span>
                  </div>
                  {pet.codigoQR && <Link className="btn btn-outline sm" to={`/pet/${pet.codigoQR}`}>Ver QR</Link>}
                </li>
              ))}
            </ul>
          ) : <p className="staff-empty-state">Todavía no hay mascotas registradas.</p>)}
        </article>

        <article className="card">
          <header className="card-head">
            <h2>Próximos recordatorios</h2>
            <button type="button" className="btn btn-outline sm" onClick={() => onOpenSection('recordatorios')}>Ver recordatorios</button>
          </header>
          {recordatoriosReady && (pendientes.length ? (
            <ul className="list">
              {pendientes.slice(0, 5).map((reminder) => (
                <li className="row" key={reminder.id}>
                  <div className="row-text">
                    <strong>{reminder.pet} · {reminder.asunto}</strong>
                    <span>{reminder.canal} · {reminder.programado}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="staff-empty-state">Todavía no hay recordatorios programados.</p>)}
        </article>
      </section>
    </>
  );
}
