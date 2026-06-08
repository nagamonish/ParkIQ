import { statusMeta } from "../lib/format.js";

export function StatusPill({ availability, size = "md" }) {
  const status = availability?.status || "unknown";
  const meta = statusMeta(status);
  const live = availability?.is_live;
  return (
    <span
      className={`status-pill status-pill--${size} ${live ? "is-live" : ""}`}
      style={{ "--status": meta.color, "--status-glow": meta.glow }}
    >
      <span className="status-dot" />
      {meta.label}
    </span>
  );
}
