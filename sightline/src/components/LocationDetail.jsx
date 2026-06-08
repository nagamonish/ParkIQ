import { useEffect, useState } from "react";

import { Icon } from "./Icon.jsx";
import { AvailabilityGauge } from "./AvailabilityGauge.jsx";
import { StatusPill } from "./StatusPill.jsx";
import { HistoryChart } from "./HistoryChart.jsx";
import { fetchLocation } from "../api.js";
import {
  amenityMeta,
  clampPct,
  directionsUrl,
  formatDistance,
  formatHoursToday,
  formatPrice,
  isOpenNow,
  statusMeta,
  timeAgo,
  typeMeta,
} from "../lib/format.js";

export function LocationDetail({ location, live, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDetail(null);
    fetchLocation(location.id, 24)
      .then((data) => active && setDetail(data))
      .catch(() => active && setDetail(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [location.id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const base = detail || location;
  const availability = live[location.id] || base.availability || {};
  const meta = statusMeta(availability.status);
  const tMeta = typeMeta(base.type);
  const open = isOpenNow(base.hours);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer"
        style={{ "--accent": base.accent, "--status": meta.color, "--status-glow": meta.glow }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={base.name}
      >
        <div className="drawer-accent" aria-hidden="true" />
        <button className="drawer-close" onClick={onClose} aria-label="Close">
          <Icon name="x" size={20} />
        </button>

        <header className="drawer-head">
          <span className="card-type">
            <Icon name={tMeta.icon} size={15} /> {tMeta.label} · {base.operator}
          </span>
          <h2>{base.name}</h2>
          <p className="drawer-address">
            <Icon name="pin" size={15} /> {base.address}
            {base.city ? `, ${base.city}` : ""}
            {base.distance_km != null && <span className="drawer-distance"> · {formatDistance(base.distance_km)} away</span>}
          </p>
        </header>

        <div className="drawer-hero">
          <AvailabilityGauge availability={availability} color={meta.color} size={172} />
          <div className="drawer-hero-side">
            <StatusPill availability={availability} size="lg" />
            <div className="drawer-occ">
              <span className="drawer-occ-num">{clampPct(availability.occupancy_pct)}%</span> full
            </div>
            <div className="drawer-updated">
              {availability.is_live ? <span className="live-tag">● Live</span> : <span className="stale-tag">○ Offline</span>}
              <span>Updated {timeAgo(availability.updated_at)}</span>
            </div>
            <a className="btn-primary" href={directionsUrl(base)} target="_blank" rel="noreferrer">
              <Icon name="navigation" size={17} /> Get directions
            </a>
          </div>
        </div>

        <section className="drawer-section">
          <h4>
            <Icon name="trending" size={16} /> Last 24 hours
          </h4>
          {loading ? <div className="chart-empty">Loading…</div> : <HistoryChart history={detail?.history || []} />}
        </section>

        {detail?.best_times?.length > 0 && (
          <section className="drawer-section">
            <h4>
              <Icon name="clock" size={16} /> Quietest times
            </h4>
            <div className="chip-set">
              {detail.best_times.map((t) => (
                <span className="chip chip--static" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="drawer-section">
          <h4>
            <Icon name="star" size={16} /> Amenities
          </h4>
          <div className="amenity-grid">
            {(base.amenities || []).map((key) => {
              const am = amenityMeta(key);
              return (
                <span className="amenity-item" key={key}>
                  <Icon name={am.icon} size={17} /> {am.label}
                </span>
              );
            })}
            {(!base.amenities || base.amenities.length === 0) && <span className="muted">No amenities listed</span>}
          </div>
        </section>

        <section className="drawer-facts">
          <div className="fact">
            <span className="fact-label">Price</span>
            <span className="fact-value">{formatPrice(base.price_per_hour, base.currency)}</span>
          </div>
          <div className="fact">
            <span className="fact-label">Hours today</span>
            <span className={`fact-value ${open === false ? "is-closed" : ""}`}>
              {open === false ? "Closed" : formatHoursToday(base.hours)}
            </span>
          </div>
          <div className="fact">
            <span className="fact-label">Capacity</span>
            <span className="fact-value">{(base.total_spaces ?? 0).toLocaleString()} spaces</span>
          </div>
        </section>

        {base.description && <p className="drawer-desc">{base.description}</p>}

        <footer className="drawer-footer">
          <Icon name="gauge" size={14} /> Live availability from ParkIQ camera detection
        </footer>
      </aside>
    </div>
  );
}
