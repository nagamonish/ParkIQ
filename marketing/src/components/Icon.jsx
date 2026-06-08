// Minimal stroke-icon set (24x24, currentColor) for the marketing site.
const PATHS = {
  camera: "M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z|M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  scan: "M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M4 12h16",
  pin: "M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z|M12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  bolt: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z",
  shield: "M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3ZM9 12l2 2 4-4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  leaf: "M5 21c0-9 5-14 14-14 0 9-5 14-14 14ZM5 21c3-5 6-8 10-10",
  chart: "M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z",
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14",
  eyeoff: "M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8M9.4 5.2A9.6 9.6 0 0 1 12 5c5 0 9 4.5 9 7a12 12 0 0 1-2.2 3M6.1 6.6A12.4 12.4 0 0 0 3 12c0 2 4 7 9 7a9.3 9.3 0 0 0 3-.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chevron: "M9 6l6 6-6 6",
  check: "M5 13l4 4L19 7",
  car: "M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M5 11h14v5H5zM5 16v2M19 16v2M8 14h.01M16 14h.01",
  menu: "M4 7h16M4 12h16M4 17h16",
  x: "M6 6l12 12M18 6 6 18",
};

export function Icon({ name, size = 24, strokeWidth = 1.7, className = "", style }) {
  const data = PATHS[name];
  if (!data) return null;
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {data.split("|").map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
