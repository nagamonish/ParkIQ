export function StatTiles({ summary }) {
  const total = summary?.total ?? 0;
  const occupied = summary?.occupied ?? 0;
  const available = summary?.available ?? Math.max(0, total - occupied);
  const pct = summary?.occupancy_pct ?? (total ? Math.round((occupied / total) * 100) : 0);

  const tiles = [
    { label: "Total spaces", value: total, tone: "" },
    { label: "Available", value: available, tone: "ok" },
    { label: "Occupied", value: occupied, tone: "busy" },
    { label: "Occupancy", value: `${pct}%`, tone: pct >= 85 ? "busy" : pct >= 60 ? "warn" : "ok" },
  ];

  return (
    <div className="stat-tiles">
      {tiles.map((t) => (
        <div className="stat-tile" key={t.label}>
          <span className="stat-tile-label">{t.label}</span>
          <span className={`stat-tile-value ${t.tone}`}>{t.value}</span>
        </div>
      ))}
    </div>
  );
}
