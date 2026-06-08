// Stroke-icon set (24x24, currentColor) for the operator console.
const PATHS = {
  dashboard: "M4 13h7V4H4zM13 20h7v-9h-7zM13 4v4h7V4zM4 20h7v-4H4z",
  camera: "M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z|M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  spaces: "M4 5h7v6H4zM13 5h7v6h-7zM4 13h7v6H4zM13 13h7v6h-7z",
  analytics: "M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z|M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V19a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H4a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 5.2 5.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6",
  play: "M7 5l12 7-12 7z",
  pause: "M8 5h3v14H8zM13 5h3v14h-3z",
  refresh: "M21 12a9 9 0 1 1-3-6.7L21 8M21 4v4h-4",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0",
  pin: "M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z|M12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  alert: "M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  check: "M5 13l4 4L19 7",
  x: "M6 6l12 12M18 6 6 18",
  chevronRight: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  expand: "M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3",
  zoomIn: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3M11 8v6M8 11h6",
  zoomOut: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3M8 11h6",
  bolt: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z",
  signal: "M5 18v-3M10 18v-7M15 18v-11M20 18V5",
  layers: "M12 3l9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  save: "M5 3h12l4 4v14H5zM8 3v6h8V3M8 21v-6h8v6",
  link: "M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 6 6l1-1",
  wand: "M5 19 15 9M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2ZM19 11l.6 1.2 1.4.6-1.4.6L19 15l-.6-1.2L17 13l1.4-.6Z",
  car: "M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M5 11h14v5H5zM5 16v2M19 16v2M8 14h.01M16 14h.01",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

export function Icon({ name, size = 20, strokeWidth = 1.7, className = "", style }) {
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
