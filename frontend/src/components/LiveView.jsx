import { useState } from "react";

import { Icon } from "./Icon.jsx";

function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function occupiedFor(slot) {
  if (!slot.occupied || !slot.occupied_since) return "Available";
  const s = Math.max(0, Math.floor(Date.now() / 1000 - slot.occupied_since));
  if (s < 60) return `Occupied ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `Occupied ${m}m`;
  return `Occupied ${Math.floor(m / 60)}h ${m % 60}m`;
}

// Annotated MJPEG feed (the backend burns slot + vehicle overlays into the
// frame) with a transparent, perfectly-aligned SVG layer for hover-to-identify.
export function LiveView({ camera, slots = [], streamUrl, streamState, onLoad, onError, timestamp }) {
  const [natural, setNatural] = useState({ w: 16, h: 9 });
  const [hover, setHover] = useState(null);
  const [pointer, setPointer] = useState(null);

  const handleMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * natural.w;
    const py = ((e.clientY - rect.top) / rect.height) * natural.h;
    const match = slots.find((s) => (s.polygon || []).length >= 3 && pointInPolygon(px, py, s.polygon));
    setHover(match || null);
    setPointer(match ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  };

  return (
    <div className="liveview">
      <div className="liveview-bar">
        <div className="liveview-cam">
          <span className="eyebrow">Camera</span>
          <h3>{camera?.name || camera?.camera_id || "No camera selected"}</h3>
        </div>
        <span className={`stream-badge stream-${streamState}`}>
          <span className="stream-dot" /> {streamState}
        </span>
      </div>

      <div className="liveview-stage" style={{ aspectRatio: `${natural.w} / ${natural.h}` }}>
        {streamUrl ? (
          <img
            className="liveview-img"
            src={streamUrl}
            alt="live camera feed"
            onLoad={(e) => {
              setNatural({ w: e.currentTarget.naturalWidth || 16, h: e.currentTarget.naturalHeight || 9 });
              onLoad?.();
            }}
            onError={onError}
          />
        ) : (
          <div className="liveview-empty">
            <Icon name="camera" size={34} />
            <p>Select or connect a camera to see the live feed.</p>
          </div>
        )}

        {streamUrl && (
          <svg
            className="liveview-overlay"
            viewBox={`0 0 ${natural.w} ${natural.h}`}
            preserveAspectRatio="none"
            onPointerMove={handleMove}
            onPointerLeave={() => {
              setHover(null);
              setPointer(null);
            }}
          >
            {slots.map((s) =>
              (s.polygon || []).length >= 3 ? (
                <polygon
                  key={s.slot_id}
                  points={s.polygon.map((p) => p.join(",")).join(" ")}
                  className={`ov-slot ${hover?.slot_id === s.slot_id ? "is-hover" : ""}`}
                />
              ) : null,
            )}
          </svg>
        )}

        {pointer && hover && (
          <div className="liveview-tip" style={{ left: pointer.x, top: pointer.y }}>
            <strong>{hover.slot_id}</strong>
            <span className={hover.occupied ? "occ" : "free"}>{occupiedFor(hover)}</span>
          </div>
        )}

        {streamUrl && (
          <div className="liveview-ts">
            <Icon name="clock" size={14} /> {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}
