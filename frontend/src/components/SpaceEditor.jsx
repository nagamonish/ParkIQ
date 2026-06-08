import { useRef, useState } from "react";

import { streamUrl as buildStreamUrl } from "../config.js";

function svgPoint(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const t = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [Number(t.x.toFixed(1)), Number(t.y.toFixed(1))];
}

function nextId(slots) {
  let n = slots.length + 1;
  const ids = new Set(slots.map((s) => s.slot_id));
  while (ids.has(`A${n}`)) n += 1;
  return `A${n}`;
}

// Precise slot polygon editor over the live (annotated) frame. Drawing tight
// polygons here is what makes occupancy detection accurate downstream.
export function SpaceEditor({ cameraId, slots, setSlots, selectedId, setSelectedId, draw, setDraw }) {
  const svgRef = useRef(null);
  const [natural, setNatural] = useState({ w: 1920, h: 1080 });
  const [drag, setDrag] = useState(null);

  const stream = cameraId ? buildStreamUrl(cameraId) : "";

  const onStageClick = (e) => {
    if (!draw || !svgRef.current) return;
    const p = svgPoint(svgRef.current, e);
    setDraw((d) => [...d, p]);
  };

  const finishDraw = () => {
    if (draw.length >= 3) {
      const slot = { slot_id: nextId(slots), polygon: draw, occupied: false };
      setSlots((s) => [...s, slot]);
      setSelectedId(slot.slot_id);
    }
    setDraw(null);
  };

  const onVertexDown = (e, slotId, idx) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedId(slotId);
    setDrag({ slotId, idx });
  };

  const onMove = (e) => {
    if (!drag || !svgRef.current) return;
    const p = svgPoint(svgRef.current, e);
    setSlots((cur) =>
      cur.map((s) =>
        s.slot_id !== drag.slotId
          ? s
          : { ...s, polygon: s.polygon.map((pt, i) => (i === drag.idx ? p : pt)) },
      ),
    );
  };

  return (
    <div
      className={`editor-stage ${draw ? "is-drawing" : ""}`}
      style={{ aspectRatio: `${natural.w} / ${natural.h}` }}
      onPointerUp={() => setDrag(null)}
    >
      {stream ? (
        <img
          className="editor-img"
          src={stream}
          alt=""
          aria-hidden="true"
          onLoad={(e) =>
            setNatural({ w: e.currentTarget.naturalWidth || 1920, h: e.currentTarget.naturalHeight || 1080 })
          }
        />
      ) : (
        <div className="editor-empty">Connect a camera first</div>
      )}

      <svg
        ref={svgRef}
        className="editor-svg"
        viewBox={`0 0 ${natural.w} ${natural.h}`}
        preserveAspectRatio="none"
        onClick={onStageClick}
        onPointerMove={onMove}
      >
        {slots.map((s) =>
          (s.polygon || []).length >= 2 ? (
            <g key={s.slot_id}>
              <polygon
                points={s.polygon.map((p) => p.join(",")).join(" ")}
                className={`ed-slot ${s.slot_id === selectedId ? "is-selected" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!draw) setSelectedId(s.slot_id);
                }}
              />
              <text x={s.polygon[0][0]} y={s.polygon[0][1] - 12} className="ed-label">
                {s.slot_id}
              </text>
              {s.slot_id === selectedId &&
                !draw &&
                s.polygon.map((p, i) => (
                  <circle
                    key={i}
                    cx={p[0]}
                    cy={p[1]}
                    r={Math.max(8, natural.w / 160)}
                    className="ed-handle"
                    onPointerDown={(e) => onVertexDown(e, s.slot_id, i)}
                  />
                ))}
            </g>
          ) : null,
        )}

        {draw && draw.length > 0 && (
          <g>
            <polyline points={draw.map((p) => p.join(",")).join(" ")} className="ed-draw-line" />
            {draw.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={Math.max(7, natural.w / 180)} className="ed-draw-pt" />
            ))}
          </g>
        )}
      </svg>

      {draw && (
        <div className="editor-draw-hint">
          <span>{draw.length} point{draw.length === 1 ? "" : "s"} — click to add, then finish</span>
          <div className="editor-draw-actions">
            <button className="btn btn-sm" onClick={() => setDraw(null)}>
              Cancel
            </button>
            <button className="btn btn-sm btn-primary" disabled={draw.length < 3} onClick={finishDraw}>
              Finish space
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
