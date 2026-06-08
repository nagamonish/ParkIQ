import { useState } from "react";

import { Icon } from "./Icon.jsx";
import { AMENITY_META, STATUS_META, TYPE_META } from "../lib/format.js";

const SORTS = [
  { key: "relevance", label: "Best match" },
  { key: "availability", label: "Most open" },
  { key: "distance", label: "Nearest" },
  { key: "price", label: "Cheapest" },
  { key: "occupancy", label: "Quietest" },
];

const QUICK = [
  { key: "openNow", label: "Open now", icon: "clock" },
  { key: "ev", label: "EV charging", icon: "bolt", amenity: "ev_charging" },
  { key: "covered", label: "Covered", icon: "umbrella", amenity: "covered" },
  { key: "accessible", label: "Accessible", icon: "accessible", amenity: "accessible" },
];

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterBar({ filters, onChange, total, loading, view, onViewChange, onReset }) {
  const [open, setOpen] = useState(false);
  const activeCount =
    filters.types.length +
    filters.amenities.length +
    filters.statuses.length +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.openNow ? 1 : 0);

  const quickActive = (q) => (q.amenity ? filters.amenities.includes(q.amenity) : filters[q.key]);
  const toggleQuick = (q) => {
    if (q.amenity) onChange({ amenities: toggle(filters.amenities, q.amenity) });
    else onChange({ [q.key]: !filters[q.key] });
  };

  return (
    <div className="filterbar">
      <div className="filterbar-row">
        <div className="result-count">
          {loading ? (
            <span className="muted">Searching…</span>
          ) : (
            <>
              <strong>{total.toLocaleString()}</strong> {total === 1 ? "location" : "locations"}
            </>
          )}
        </div>

        <div className="quick-chips">
          {QUICK.map((q) => (
            <button
              key={q.key}
              className={`chip ${quickActive(q) ? "is-on" : ""}`}
              onClick={() => toggleQuick(q)}
            >
              <Icon name={q.icon} size={14} />
              {q.label}
            </button>
          ))}
        </div>

        <div className="filterbar-controls">
          <label className="sort-select">
            <span className="muted">Sort</span>
            <select value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" size={15} />
          </label>

          <button className={`btn-filters ${activeCount ? "has-active" : ""}`} onClick={() => setOpen((o) => !o)}>
            <Icon name="sliders" size={16} />
            Filters
            {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
          </button>

          <div className="view-toggle" role="tablist" aria-label="View mode">
            <button className={view === "list" ? "is-on" : ""} onClick={() => onViewChange("list")} title="List view">
              <Icon name="list" size={17} />
            </button>
            <button className={view === "map" ? "is-on" : ""} onClick={() => onViewChange("map")} title="Map view">
              <Icon name="map" size={17} />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="filter-panel">
          <div className="filter-group">
            <div className="filter-group-title">Availability</div>
            <div className="chip-set">
              {Object.entries(STATUS_META)
                .filter(([k]) => k !== "unknown")
                .map(([key, meta]) => (
                  <button
                    key={key}
                    className={`chip chip--status ${filters.statuses.includes(key) ? "is-on" : ""}`}
                    style={{ "--status": meta.color }}
                    onClick={() => onChange({ statuses: toggle(filters.statuses, key) })}
                  >
                    <span className="status-dot" />
                    {meta.label}
                  </button>
                ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-group-title">Type</div>
            <div className="chip-set">
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button
                  key={key}
                  className={`chip ${filters.types.includes(key) ? "is-on" : ""}`}
                  onClick={() => onChange({ types: toggle(filters.types, key) })}
                >
                  <Icon name={meta.icon} size={14} />
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-group-title">Amenities</div>
            <div className="chip-set">
              {Object.entries(AMENITY_META).map(([key, meta]) => (
                <button
                  key={key}
                  className={`chip ${filters.amenities.includes(key) ? "is-on" : ""}`}
                  onClick={() => onChange({ amenities: toggle(filters.amenities, key) })}
                >
                  <Icon name={meta.icon} size={14} />
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-group-title">
              Max price {filters.maxPrice != null ? `· $${filters.maxPrice}/hr` : ""}
            </div>
            <div className="price-row">
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filters.maxPrice ?? 10}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onChange({ maxPrice: v >= 10 ? null : v });
                }}
              />
              <span className="muted">{filters.maxPrice != null ? `up to $${filters.maxPrice}` : "Any"}</span>
            </div>
          </div>

          <button className="btn-reset" onClick={onReset}>
            <Icon name="filterX" size={15} /> Reset all
          </button>
        </div>
      )}
    </div>
  );
}
