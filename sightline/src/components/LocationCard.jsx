import { Icon } from "./Icon.jsx";
import { Sparkline } from "./Sparkline.jsx";
import { StatusPill } from "./StatusPill.jsx";
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

export function LocationCard({ location, onOpen }) {
  const a = location.availability || {};
  const meta = statusMeta(a.status);
  const tMeta = typeMeta(location.type);
  const occupancy = clampPct(a.occupancy_pct);
  const trend = (a.trend || []).map((o) => 100 - o); // availability trend (up = freeing up)
  const open = isOpenNow(location.hours);
  const distance = formatDistance(location.distance_km);

  return (
    <article
      className="card"
      style={{ "--accent": location.accent, "--status": meta.color, "--status-glow": meta.glow }}
      onClick={() => onOpen(location)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(location);
        }
      }}
    >
      <div className="card-glow" aria-hidden="true" />
      <header className="card-top">
        <span className="card-type">
          <Icon name={tMeta.icon} size={15} />
          {tMeta.label}
        </span>
        <StatusPill availability={a} size="sm" />
      </header>

      <div className="card-body">
        <div className="card-headline">
          <h3 className="card-name">{location.name}</h3>
          <p className="card-sub">
            {location.address}
            {location.city ? ` · ${location.city}` : ""}
          </p>
        </div>
        <div className="card-metric">
          <div className="metric-figure" style={{ color: meta.color }}>
            {(a.available ?? 0).toLocaleString()}
          </div>
          <div className="metric-caption">
            free of {(location.total_spaces ?? 0).toLocaleString()}
          </div>
          <Sparkline values={trend} color={meta.color} width={92} height={28} />
        </div>
      </div>

      <div className="occ-bar" title={`${occupancy}% full`}>
        <div className="occ-fill" style={{ width: `${occupancy}%`, background: meta.color }} />
      </div>

      <div className="card-meta">
        {distance && (
          <span className="meta-chip">
            <Icon name="pin" size={14} /> {distance}
          </span>
        )}
        <span className={`meta-chip ${open === false ? "is-closed" : ""}`}>
          <Icon name="clock" size={14} /> {open === false ? "Closed" : formatHoursToday(location.hours)}
        </span>
        <span className="meta-chip">{formatPrice(location.price_per_hour, location.currency)}</span>
      </div>

      <div className="card-footer">
        <div className="amenity-row">
          {(location.amenities || []).slice(0, 4).map((key) => {
            const am = amenityMeta(key);
            return (
              <span className="amenity" key={key} title={am.label}>
                <Icon name={am.icon} size={15} />
              </span>
            );
          })}
          {location.amenities && location.amenities.length > 4 && (
            <span className="amenity amenity--more">+{location.amenities.length - 4}</span>
          )}
        </div>
        <a
          className="btn-directions"
          href={directionsUrl(location)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="navigation" size={15} /> Directions
        </a>
      </div>

      <div className="card-updated">
        {a.is_live ? <span className="live-tag">● Live</span> : <span className="stale-tag">○ Offline</span>}
        <span>Updated {timeAgo(a.updated_at)}</span>
      </div>
    </article>
  );
}
