import { clampPct } from "../lib/format.js";

// Radial gauge: a 270° arc that fills with the share of FREE spaces and is
// tinted by the live status color. The big number is open spaces.
export function AvailabilityGauge({ availability, color, size = 168 }) {
  const { available = 0, total = 0, occupancy_pct = 0 } = availability || {};
  const freePct = clampPct(100 - occupancy_pct);
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135;
  const sweep = 270;
  const circumference = 2 * Math.PI * r;
  const arcLen = (sweep / 360) * circumference;
  const dash = (freePct / 100) * arcLen;

  const polar = (angleDeg) => {
    const a = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const [sx, sy] = polar(startAngle);
  const [ex, ey] = polar(startAngle + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  const trackPath = `M${sx.toFixed(2)} ${sy.toFixed(2)} A${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;

  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <path d={trackPath} fill="none" stroke="rgba(20,30,80,0.09)" strokeWidth={stroke} strokeLinecap="round" />
        <path
          className="gauge-arc"
          d={trackPath}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${arcLen}`}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="gauge-center">
        <div className="gauge-value" style={{ color }}>{available.toLocaleString()}</div>
        <div className="gauge-label">free of {total.toLocaleString()}</div>
      </div>
    </div>
  );
}
