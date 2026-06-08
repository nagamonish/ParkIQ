// Occupancy-over-time area chart (light themed, dependency-free SVG).
export function HistoryChart({ history = [], height = 220 }) {
  if (history.length < 2) {
    return <div className="chart-empty">Not enough history yet — data builds as the camera runs.</div>;
  }
  const W = 760;
  const H = height;
  const PAD_L = 34;
  const PAD_B = 26;
  const PAD_T = 12;
  const plotW = W - PAD_L;
  const plotH = H - PAD_B - PAD_T;
  const n = history.length;

  const x = (i) => PAD_L + (i / (n - 1)) * plotW;
  const y = (v) => PAD_T + (1 - Math.max(0, Math.min(100, v)) / 100) * plotH;

  const line = history.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.occupancy_pct).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)} ${PAD_T + plotH} L${PAD_L} ${PAD_T + plotH} Z`;

  const labelEvery = Math.ceil(n / 7);

  return (
    <svg className="history-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Occupancy history">
      <defs>
        <linearGradient id="histfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={PAD_L} y1={y(t)} x2={W} y2={y(t)} stroke="rgba(20,30,80,0.07)" />
          <text x={PAD_L - 8} y={y(t) + 3} textAnchor="end" className="chart-axis">
            {t}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#histfill)" />
      <path d={line} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {history.map((p, i) =>
        i % labelEvery === 0 ? (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="chart-axis">
            {new Date(p.bucket).getHours()}:00
          </text>
        ) : null,
      )}
    </svg>
  );
}
