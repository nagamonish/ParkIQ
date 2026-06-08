// Compact stroke-icon set (24x24, currentColor). Keeps the whole app
// dependency-free while still looking crisp at any size.
const PATHS = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  pin: "M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z|M12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  navigation: "M3 11l18-8-8 18-2-8-8-2Z",
  crosshair: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 3v3M12 18v3M3 12h3M18 12h3",
  x: "M6 6l12 12M18 6 6 18",
  sliders: "M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4|M14 6a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM6 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM12 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z|M9 4v14M15 6v14",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  chevron: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  star: "M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.6l1.1-6L3.4 9.4l6-.8L12 3Z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  trending: "M3 17l6-6 4 4 8-8M21 7h-5M21 7v5",
  building: "M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M5 21h14M19 21V9h2M9 7h2M9 11h2M9 15h2",
  "square-park": "M4 5h16v14H4zM4 9h16M9 19V9",
  road: "M8 3 4 21M16 3l4 18M12 4v2M12 10v2M12 16v2",
  bag: "M6 8h12l-1 12H7L6 8ZM9 8V6a3 3 0 0 1 6 0v2",
  plane: "M3 13l8-2V5a1.5 1.5 0 0 1 3 0v6l8 2v2l-8-1.5V18l2 1.5V21l-3.5-1L9 21v-1.5L11 18v-3.5L3 16v-3Z",
  trophy: "M7 4h10v4a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 17h6M10 21h4M12 17v-2",
  cross: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z",
  cap: "M3 9l9-4 9 4-9 4-9-4ZM7 11v5c0 1 2 2 5 2s5-1 5-2v-5",
  train: "M6 4h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM4 11h16M8 20l-2 2M16 20l2 2M9 16h.01M15 16h.01",
  bolt: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z",
  accessible: "M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 9h6l-1 4h2l2 7M9 9l-1 5a4 4 0 0 0 7 3",
  umbrella: "M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9ZM12 12v7a2 2 0 0 0 4 0",
  shield: "M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3ZM9 12l2 2 4-4",
  key: "M14 7a4 4 0 1 0-3.5 4l1.5 1.5 2 0 0 2 2 0 0 2 2.5-2.5A4 4 0 0 0 14 7Z",
  bike: "M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 15l3-7h3l2 7M11 8 9 6",
  bicycle: "M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9 15l3-6h4M9 9h3M16 9l2 6",
  droplet: "M12 3s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10Z",
  "arrows-v": "M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4",
  check: "M5 13l4 4L19 7",
  car: "M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M5 11h14v5H5zM5 16v2M19 16v2M8 14h.01M16 14h.01",
  layers: "M12 3l9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
  refresh: "M21 12a9 9 0 1 1-3-6.7L21 8M21 4v4h-4",
  gauge: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18ZM12 14l4-4",
  filterX: "M3 5h18M6 12h12M10 19h4",
};

export function Icon({ name, size = 20, strokeWidth = 1.8, className = "", style }) {
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
