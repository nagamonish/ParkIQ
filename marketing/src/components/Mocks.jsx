// Lightweight, on-brand product mockups built from divs/SVG — a phone running
// the Sightline finder, and the operator analytics dashboard.

export function PhoneMock() {
  const cards = [
    { name: "Union Square Garage", free: 142, tone: "ok", pct: 18 },
    { name: "Embarcadero Center", free: 64, tone: "ok", pct: 52 },
    { name: "Westfield Centre", free: 12, tone: "warn", pct: 88 },
  ];
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="phone-statusbar">
          <span>9:41</span>
          <span className="phone-live">
            <span className="live-dot" /> Live
          </span>
        </div>
        <div className="phone-search">
          <span className="phone-search-icon" />
          Find parking near you
        </div>
        <div className="phone-list">
          {cards.map((c) => (
            <div className="phone-card" key={c.name}>
              <div className="phone-card-top">
                <span className="phone-card-name">{c.name}</span>
                <span className={`phone-badge phone-badge-${c.tone}`}>{c.free} free</span>
              </div>
              <div className="phone-bar">
                <span style={{ width: `${c.pct}%` }} className={`phone-bar-fill tone-${c.tone}`} />
              </div>
              <div className="phone-card-meta">
                <span>{c.pct}% full</span>
                <span>0.{Math.round(c.pct / 10)} mi</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardMock() {
  const bars = [42, 55, 61, 70, 88, 95, 80, 64, 50, 44, 58, 72];
  const slots = [1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1];
  return (
    <div className="dash" aria-hidden="true">
      <div className="dash-bar">
        <span className="dash-dot" />
        <span className="dash-dot" />
        <span className="dash-dot" />
        <span className="dash-title">ParkIQ · Operator</span>
      </div>
      <div className="dash-body">
        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat-label">Occupied</span>
            <span className="dash-stat-value">312</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-label">Available</span>
            <span className="dash-stat-value ok">188</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-label">Occupancy</span>
            <span className="dash-stat-value">62%</span>
          </div>
        </div>
        <div className="dash-chart">
          {bars.map((h, i) => (
            <span key={i} className="dash-chart-bar" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="dash-grid">
          {slots.map((s, i) => (
            <span key={i} className={`dash-slot ${s ? "is-occ" : "is-free"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
