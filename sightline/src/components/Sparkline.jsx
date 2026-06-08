// Tiny dependency-free SVG sparkline. `values` are 0..100 (oldest -> newest).
export function Sparkline({ values = [], color = "#7c3aed", width = 96, height = 32 }) {
  if (!values || values.length < 2) {
    return <svg className="sparkline" width={width} height={height} aria-hidden="true" />;
  }
  const max = 100;
  const min = 0;
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((Math.max(min, Math.min(max, v)) - min) / span) * height;
    return [x, y];
  });
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const id = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;
  const [lastX, lastY] = points[points.length - 1];
  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.6" fill={color} />
    </svg>
  );
}
