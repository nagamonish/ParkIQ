import { Icon } from "./Icon.jsx";
import { SearchBar } from "./SearchBar.jsx";

function Stat({ value, label, accent }) {
  return (
    <div className="hero-stat">
      <div className="hero-stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="hero-stat-label">{label}</div>
    </div>
  );
}

export function Hero({ stats, searchProps, searchRef, onQuick }) {
  const quicks = [
    { label: "Near me", icon: "crosshair", action: "near" },
    { label: "Open now", icon: "clock", action: "open" },
    { label: "Most open", icon: "gauge", action: "open_spaces" },
    { label: "EV charging", icon: "bolt", action: "ev" },
  ];
  return (
    <section className="hero">
      <div className="hero-aurora" aria-hidden="true" />
      <div className="hero-inner">
        <span className="hero-eyebrow">
          <span className="pulse-dot" /> Live parking network
        </span>
        <h1 className="hero-title">
          Know before <br className="br-mobile" />
          you <span className="hero-title-accent">go.</span>
        </h1>
        <p className="hero-subtitle">
          Real-time open spaces across every garage, lot, and street — so you drive straight to a spot instead of
          circling the block.
        </p>

        <div className="hero-search" ref={searchRef}>
          <SearchBar {...searchProps} autoFocus />
        </div>

        <div className="hero-quick">
          {quicks.map((q) => (
            <button key={q.action} className="hero-chip" onClick={() => onQuick(q.action)}>
              <Icon name={q.icon} size={15} />
              {q.label}
            </button>
          ))}
        </div>

        {stats && (
          <div className="hero-stats">
            <Stat value={stats.available_now?.toLocaleString() ?? "—"} label="open spaces right now" accent="#34d399" />
            <Stat value={stats.locations ?? "—"} label="locations tracked" />
            <Stat value={stats.live_sites ?? "—"} label="live camera sites" />
            <Stat value={`${stats.avg_occupancy_pct ?? 0}%`} label="average occupancy" />
          </div>
        )}
      </div>
    </section>
  );
}
