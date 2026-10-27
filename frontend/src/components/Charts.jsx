// Dependency-free charts. Each has a text/table equivalent for screen readers.
const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-PK', { maximumFractionDigits: 2 }));

export function BarList({ title, rows, valueKey = 'count', labelKey = 'name', suffix = '', empty = 'No data in this range.' }) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey] || 0));
  return (
    <section className="card">
      <h2>{title}</h2>
      {rows.length === 0 ? <p className="muted">{empty}</p> : (
        <ul className="bars">{rows.map((r) => (
          <li key={r[labelKey]}>
            <span className="lab">{r[labelKey]}</span>
            <span className="track" role="img" aria-label={`${r[labelKey]}: ${fmt(r[valueKey])}${suffix}`}><span style={{ width: `${((r[valueKey] || 0) / max) * 100}%` }} /></span>
            <b>{fmt(r[valueKey])}{suffix}</b>
          </li>))}</ul>
      )}
    </section>
  );
}

export function Trend({ title, points }) {
  const w = 360, h = 110, pad = 6;
  if (!points.length) return <section className="card"><h2>{title}</h2><p className="muted">No attendance recorded in this range yet.</p></section>;
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const xy = points.map((p, i) => [pad + i * step, h - pad - (p.ratePct / 100) * (h - pad * 2)]);
  return (
    <section className="card">
      <h2>{title}</h2>
      <svg viewBox={`0 0 ${w} ${h}`} className="trend" role="img" aria-label={`Attendance rate by day, from ${fmt(points[0].ratePct)}% to ${fmt(points.at(-1).ratePct)}%`}>
        <line x1="0" x2={w} y1={h - pad} y2={h - pad} className="axis" />
        <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" className="line" />
        {xy.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3"><title>{`${points[i].date}: ${points[i].ratePct}%`}</title></circle>)}
      </svg>
      <small>{points[0].date} to {points.at(-1).date}, one point per working day (0–100%)</small>
    </section>
  );
}

export const Kpi = ({ label, value, hint }) => (
  <div className="card stat"><span>{label}</span><strong>{value ?? '—'}</strong>{hint && <small>{hint}</small>}</div>
);
