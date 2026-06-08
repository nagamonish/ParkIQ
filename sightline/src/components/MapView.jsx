import { useMemo, useState } from "react";

import { Icon } from "./Icon.jsx";
import { statusMeta, STATUS_META } from "../lib/format.js";

const W = 1000;
const H = 640;
const PAD = 70;

export function MapView({ locations, origin, onOpen, selectedId }) {
  const [hover, setHover] = useState(null);

  const hasCoords = (l) => Number.isFinite(l.lat) && Number.isFinite(l.lng);

  const { project, hasGeo } = useMemo(() => {
    const pts = locations.filter(hasCoords).map((l) => [l.lat, l.lng]);
    if (origin) pts.push([origin.lat, origin.lng]);
    if (pts.length === 0) {
      return { project: () => [W / 2, H / 2], hasGeo: false };
    }
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const [lat, lng] of pts) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;
    const project = (lat, lng) => {
      const x = PAD + ((lng - minLng) / lngSpan) * (W - 2 * PAD);
      const y = PAD + (1 - (lat - minLat) / latSpan) * (H - 2 * PAD);
      return [x, y];
    };
    return { project, hasGeo: true };
  }, [locations, origin]);

  const maxTotal = Math.max(1, ...locations.map((l) => l.total_spaces || 0));
  const radius = (loc) => 9 + Math.sqrt((loc.total_spaces || 0) / maxTotal) * 13;

  const markers = locations
    .filter(hasCoords)
    .map((loc) => {
      const [x, y] = project(loc.lat, loc.lng);
      return { loc, x, y, meta: statusMeta(loc.availability?.status) };
    });

  const hovered = hover && markers.find((m) => m.loc.id === hover);
  const originXY = origin ? project(origin.lat, origin.lng) : null;

  return (
    <div className="mapview">
      <svg viewBox={`0 0 ${W} ${H}`} className="mapview-svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="map-bg" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#eef1f7" />
            <stop offset="100%" stopColor="#dfe3ec" />
          </radialGradient>
          <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" fill="none" stroke="rgba(20,30,80,0.06)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#map-bg)" />
        <rect width={W} height={H} fill="url(#map-grid)" />

        {/* connection lines from origin to nearest markers */}
        {originXY &&
          markers.map((m) => (
            <line
              key={`l-${m.loc.id}`}
              x1={originXY[0]}
              y1={originXY[1]}
              x2={m.x}
              y2={m.y}
              stroke="rgba(79,70,229,0.1)"
              strokeWidth="1"
            />
          ))}

        {markers.map((m) => {
          const r = radius(m.loc);
          const isSel = m.loc.id === selectedId || m.loc.id === hover;
          const live = m.loc.availability?.is_live;
          return (
            <g
              key={m.loc.id}
              transform={`translate(${m.x},${m.y})`}
              className={`map-marker ${isSel ? "is-selected" : ""}`}
              onMouseEnter={() => setHover(m.loc.id)}
              onMouseLeave={() => setHover((h) => (h === m.loc.id ? null : h))}
              onClick={() => onOpen(m.loc)}
              style={{ cursor: "pointer" }}
            >
              {live && <circle r={r + 6} fill={m.meta.color} opacity="0.18" className="marker-pulse" />}
              <circle r={r} fill={m.meta.color} opacity="0.92" stroke="rgba(255,255,255,0.85)" strokeWidth={isSel ? 3 : 1.5} />
              <text textAnchor="middle" dy="4" fontSize="13" fontWeight="700" fill="#0a0f1f">
                {m.loc.availability?.available ?? ""}
              </text>
            </g>
          );
        })}

        {originXY && (
          <g transform={`translate(${originXY[0]},${originXY[1]})`}>
            <circle r="11" fill="#7c3aed" opacity="0.25" className="marker-pulse" />
            <circle r="5" fill="#fff" stroke="#7c3aed" strokeWidth="3" />
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="map-tooltip"
          style={{ left: `${(hovered.x / W) * 100}%`, top: `${(hovered.y / H) * 100}%` }}
        >
          <div className="map-tooltip-name">{hovered.loc.name}</div>
          <div className="map-tooltip-meta">
            <span style={{ color: hovered.meta.color }}>{hovered.meta.label}</span>
            <span>· {hovered.loc.availability?.available ?? 0} free</span>
          </div>
        </div>
      )}

      <div className="map-legend">
        {Object.entries(STATUS_META)
          .filter(([k]) => k !== "unknown")
          .map(([key, meta]) => (
            <span key={key} className="legend-item">
              <span className="legend-dot" style={{ background: meta.color }} />
              {meta.label}
            </span>
          ))}
        {!hasGeo && <span className="legend-item muted">No coordinates</span>}
      </div>
    </div>
  );
}
