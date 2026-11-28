import { useState } from 'react';
import { BarChart, Donut } from './Charts';

const COLORS = ['#38BDF8', '#A78BFA', '#34D399', '#FBBF24', '#FB7185'];
const SERIES_LABELS = { mascotas: 'Mascotas registradas', consultas: 'Consultas atendidas', vacunas: 'Dosis aplicadas' };
const DAY_MS = 86400000;

export default function DashboardCharts({ metrics, clinical, status }) {
  const [range, setRange] = useState(7);
  const [series, setSeries] = useState(clinical ? 'consultas' : 'mascotas');

  if (status !== 'ready' || !metrics) return null;

  const rows = metrics.series?.[series];
  const byDay = new Map((rows || []).map(({ dia, cantidad }) => [dia, Number(cantidad)]));
  const grouped = range === 56;
  const binSize = grouped ? 7 : 1;
  const end = Date.parse(metrics.hoy);
  const available = Array.isArray(rows) && Number.isFinite(end);
  const bins = Array.from({ length: available ? range / binSize : 0 }, (_, index) => {
    const start = end - (range - 1 - index * binSize) * DAY_MS;
    const startDay = new Date(start).toISOString().slice(0, 10);
    const label = startDay.slice(5).split('-').reverse().join('/');
    const total = Array.from({ length: binSize }, (_, day) =>
      byDay.get(new Date(start + day * DAY_MS).toISOString().slice(0, 10)) || 0
    ).reduce((sum, count) => sum + count, 0);
    return { label, total };
  });
  const totalPets = (metrics.especies || []).reduce((total, { cantidad }) => total + Number(cantidad), 0);
  const species = (metrics.especies || []).map(({ especie, cantidad }, index) => ({
    name: especie || 'Sin especie registrada',
    count: Number(cantidad),
    value: Number(cantidad) / totalPets * 100,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <section className="grid-2-1">
      <article className="card">
        <header className="card-head dashboard-chart-header">
          <div>
            <h2>Actividad registrada</h2>
            <p>{grouped ? 'Totales por semana · últimos 56 días' : 'Totales diarios · últimos 7 días'}</p>
          </div>
          {clinical && <select className="staff-input-field" aria-label="Indicador de actividad"
            value={series} onChange={(event) => setSeries(event.target.value)}>
            {Object.entries(SERIES_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>}
        </header>
        <div className="seg dashboard-chart-range" role="group" aria-label="Rango del gráfico">
          <button type="button" className={range === 7 ? 'on' : ''} aria-pressed={range === 7} onClick={() => setRange(7)}>7 días</button>
          <button type="button" className={range === 56 ? 'on' : ''} aria-pressed={range === 56} onClick={() => setRange(56)}>8 semanas</button>
        </div>
        {available ? (
          bins.some(({ total }) => total > 0)
            ? <BarChart labels={bins.map(({ label }) => label)} data={bins.map(({ total }) => total)} label={SERIES_LABELS[series]} />
            : <p className="staff-empty-state">Sin actividad de «{SERIES_LABELS[series].toLowerCase()}» en este periodo.</p>
        ) : <p className="staff-empty-state">
          {metrics.series ? 'Este indicador todavía no está disponible.' : 'Actualiza y reinicia el backend para cargar las series del gráfico.'}
        </p>}
      </article>

      <article className="card">
        <header className="card-head"><h2>Mascotas por especie</h2></header>
        {totalPets > 0 ? (
          <>
            <Donut parts={species} total={totalPets} label="mascotas" />
            <ul className="legend">
              {species.map(({ name, color, count, value }) => (
                <li key={name}><i style={{ background: color }} />{name}<strong>{count} · {Math.round(value)}%</strong></li>
              ))}
            </ul>
          </>
        ) : <p className="staff-empty-state">
          {Array.isArray(metrics.especies) ? 'Registra una mascota para ver la distribución.' : 'No se pudo cargar la distribución.'}
        </p>}
      </article>
    </section>
  );
}
