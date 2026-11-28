// Gráficos ligeros en SVG/CSS, sin librerías externas.

export function Spark({ data }) {
  const w = 120, h = 36, p = 3;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * (w - 2 * p) + p,
    h - p - ((v - min) / (max - min || 1)) * (h - 2 * p),
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path className="spark-area" d={area} fill="currentColor" />
      <path className="spark-line" d={line} pathLength="1" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BarChart({ labels, data, label }) {
  const maxVal = Math.max(...data);
  const step = Math.max(1, Math.ceil(maxVal / 4));
  const top = step * 4;
  const ticks = [4, 3, 2, 1, 0].map((t) => t * step);
  return (
    <div className="bars" role="img" aria-label={`${label}. ${labels.map((day, index) => `${day}: ${data[index]}`).join(", ")}`}>
      <div className="bars-y">{ticks.map((t) => <span key={t}>{t}</span>)}</div>
      <div className="bars-plot">
        {data.map((v, i) => (
          <div className="bar-col" key={labels[i]}>
            <div className={`bar ${v === maxVal ? 'peak' : ''}`}
              style={{ height: `${(v / top) * 100}%`, animationDelay: `${i * 45}ms` }}>
              <span className="bar-val">{v}</span>
            </div>
          </div>
        ))}
      </div>
      <span />
      <div className="bars-x">{labels.map((l) => <span key={l}>{l}</span>)}</div>
    </div>
  );
}

export function Donut({ parts, total, label }) {
  const R = 15.9155;
  const segments = parts.reduce((acc, part) => {
    const offset = acc.length === 0 ? 25 : acc[acc.length - 1].nextOffset;
    acc.push({ ...part, offset, nextOffset: offset - part.value });
    return acc;
  }, []);

  return (
    <div className="donut">
      <svg viewBox="0 0 42 42" role="img" aria-label="Distribución de pacientes por especie">
        <circle cx="21" cy="21" r={R} fill="none" style={{ stroke: 'var(--line)' }} strokeWidth="5" />
        {segments.map((p) => (
          <circle
            key={p.name}
            className="donut-seg"
            cx="21"
            cy="21"
            r={R}
            fill="none"
            style={{ stroke: p.color }}
            strokeWidth="5"
            strokeDasharray={`${p.value} ${100 - p.value}`}
            strokeDashoffset={p.offset}
          />
        ))}
      </svg>
      <div className="donut-center"><strong>{total}</strong><span>{label}</span></div>
    </div>
  );
}
