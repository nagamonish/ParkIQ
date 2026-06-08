import { Icon } from "./Icon.jsx";

function duration(slot) {
  if (!slot.occupied || !slot.occupied_since) return null;
  const s = Math.max(0, Math.floor(Date.now() / 1000 - slot.occupied_since));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function SlotList({ slots = [], onSelect }) {
  if (!slots.length) {
    return (
      <div className="slotlist-empty">
        <Icon name="spaces" size={26} />
        <p>No spaces defined yet.</p>
        <a className="link" href="#/spaces">
          Define spaces →
        </a>
      </div>
    );
  }
  return (
    <div className="slotlist">
      {slots.map((s) => {
        const dur = duration(s);
        return (
          <button
            key={s.slot_id}
            className={`slotrow ${s.occupied ? "is-occ" : "is-free"}`}
            onClick={() => onSelect?.(s)}
          >
            <span className="slotrow-id">{s.slot_id}</span>
            <span className="slotrow-state">
              <span className="slotrow-dot" />
              {s.occupied ? "Occupied" : "Free"}
              {dur && <span className="slotrow-dur">· {dur}</span>}
            </span>
            <span className="slotrow-conf">{Math.round((s.confidence ?? 1) * 100)}%</span>
          </button>
        );
      })}
    </div>
  );
}
