import { statusMeta } from "../lib/format.js";

// Hourly occupancy over the recent window. Taller = busier; bars are tinted by
// the congestion tier so a glance reads "when is it free".
export function HistoryChart({ history = [] }) {
  if (!history.length) {
    return <div className="chart-empty">No history yet — check back soon.</div>;
  }
  const W = 560;
  const H = 150;
  const PAD_B = 22;
  const PAD_T = 10;
  const n = history.length;
  const barW = (W / n) * 0.62;
  const gap = (W / n) * 0.38;

  const statusFor = (occ) => {
    if (occ >= 100) return "full";
    if (occ >= 85) return "busy";
    if (occ >= 60) return "moderate";
    return "available";
  };

  const ticks = [0, 25, 50, 75, 100];

  return (
    <svg className="history-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Occupancy history">
      {ticks.map((t) => {
        const y = PAD_T + (1 - t / 100) * (H - PAD_T - PAD_B);
        return (
          <g key={t}>
            <line x1="0" y1={y} x2={W} y2={y} stroke="rgba(20,30,80,0.07)" strokeWidth="1" />
          </g>
        );
      })}
      {history.map((point, i) => {
        const occ = Math.max(0, Math.min(100, point.occupancy_pct));
        const h = (occ / 100) * (H - PAD_T - PAD_B);
        const x = i * (barW + gap) + gap / 2;
        const y = H - PAD_B - h;
        const color = statusMeta(statusFor(occ)).color;
        const date = new Date(point.bucket);
        const hour = date.getHours();
        const showLabel = i === 0 || hour % 6 === 0;
        return (
          <g key={point.bucket}>
            <rect x={x} y={y} width={barW} height={Math.max(2, h)} rx="2" fill={color} opacity="0.85">
              <title>{`${hour}:00 — ${occ}% full · ${point.available} free`}</title>
            </rect>
            {showLabel && (
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="rgba(20,30,80,0.45)">
                {hour === 0 ? "12a" : hour === 12 ? "12p" : hour > 12 ? `${hour - 12}p` : `${hour}a`}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
