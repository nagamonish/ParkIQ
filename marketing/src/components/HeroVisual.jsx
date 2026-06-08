// Top-down parking lot rendered as crisp SVG with an animated AI "scan" beam
// and live detection brackets. Self-contained — no images, no dependencies.
const COLS = 6;
const ROWS = 3;
const SLOT_W = 92;
const SLOT_H = 58;
const GAP_X = 18;
const GAP_Y = 64; // wider gap = drive aisle between rows
const PAD = 40;

// Deterministic occupancy + which detections show brackets.
const OCCUPIED = new Set([0, 1, 3, 4, 6, 9, 10, 13, 14, 15, 17]);
const BRACKETS = new Set([4, 10, 14]);

const WIDTH = PAD * 2 + COLS * SLOT_W + (COLS - 1) * GAP_X;
const HEIGHT = PAD * 2 + ROWS * SLOT_H + (ROWS - 1) * GAP_Y;

function slotXY(index) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: PAD + col * (SLOT_W + GAP_X),
    y: PAD + row * (SLOT_H + GAP_Y),
  };
}

function Car({ x, y }) {
  return (
    <g transform={`translate(${x + SLOT_W / 2}, ${y + SLOT_H / 2})`}>
      <rect x={-30} y={-19} width={60} height={38} rx={11} fill="#c9ccd6" />
      <rect x={-30} y={-19} width={60} height={38} rx={11} fill="url(#carShade)" />
      <rect x={-18} y={-12} width={36} height={24} rx={6} fill="#aeb2bf" />
    </g>
  );
}

function Brackets({ x, y }) {
  const m = 4;
  const len = 13;
  const x1 = x + m;
  const y1 = y + m;
  const x2 = x + SLOT_W - m;
  const y2 = y + SLOT_H - m;
  const corner = (cx, cy, dx, dy) =>
    `M${cx + dx * len} ${cy} L${cx} ${cy} L${cx} ${cy + dy * len}`;
  return (
    <g className="hv-bracket" stroke="#10b981" strokeWidth="2.4" fill="none" strokeLinecap="round">
      <path d={corner(x1, y1, 1, 1)} />
      <path d={corner(x2, y1, -1, 1)} />
      <path d={corner(x1, y2, 1, -1)} />
      <path d={corner(x2, y2, -1, -1)} />
    </g>
  );
}

export function HeroVisual() {
  const slots = Array.from({ length: COLS * ROWS }, (_, i) => i);
  return (
    <div className="hero-visual">
      <div className="hv-frame">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="hv-svg" role="img" aria-label="Aerial view of a parking lot with AI detecting open spaces">
          <defs>
            <linearGradient id="carShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="scanBeam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <clipPath id="lotClip">
              <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="22" />
            </clipPath>
          </defs>

          <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="22" fill="#eef0f4" />

          <g clipPath="url(#lotClip)">
            {/* drive-aisle lane markings */}
            {Array.from({ length: ROWS - 1 }, (_, r) => {
              const y = PAD + (r + 1) * SLOT_H + r * GAP_Y + GAP_Y / 2;
              return (
                <line
                  key={`lane-${r}`}
                  x1={PAD - 18}
                  y1={y}
                  x2={WIDTH - PAD + 18}
                  y2={y}
                  stroke="#d3d7e0"
                  strokeWidth="2"
                  strokeDasharray="14 12"
                />
              );
            })}

            {slots.map((i) => {
              const { x, y } = slotXY(i);
              const occupied = OCCUPIED.has(i);
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={SLOT_W}
                    height={SLOT_H}
                    rx="10"
                    fill={occupied ? "#ffffff" : "rgba(16,185,129,0.10)"}
                    stroke={occupied ? "#dfe2ea" : "#10b981"}
                    strokeWidth={occupied ? 1.5 : 2}
                  />
                  {occupied ? (
                    <Car x={x} y={y} />
                  ) : (
                    <circle cx={x + SLOT_W / 2} cy={y + SLOT_H / 2} r="5.5" fill="#10b981" className="hv-open-dot" />
                  )}
                  {BRACKETS.has(i) && <Brackets x={x} y={y} />}
                </g>
              );
            })}

            {/* sweeping AI scan beam */}
            <rect className="hv-scan" x={-160} y="0" width="160" height={HEIGHT} fill="url(#scanBeam)" />
          </g>

          <rect x="1" y="1" width={WIDTH - 2} height={HEIGHT - 2} rx="21" fill="none" stroke="#e4e7ee" />
        </svg>

        <div className="hv-chip hv-chip-1">
          <span className="hv-dot" /> 142 open now
        </div>
        <div className="hv-chip hv-chip-2">Level 2 · 38% full</div>
      </div>
    </div>
  );
}
