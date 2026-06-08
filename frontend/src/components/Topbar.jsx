import { Icon } from "./Icon.jsx";

const TITLES = {
  dashboard: "Live Dashboard",
  cameras: "Cameras",
  spaces: "Spaces & Calibration",
  analytics: "Analytics",
  settings: "Settings",
};

const WS_LABEL = {
  connected: "Live",
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  error: "Offline",
  closed: "Offline",
  idle: "Idle",
};

export function Topbar({ route, op }) {
  const { summary, selectedId, setSelectedId, wsStatus } = op;

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{TITLES[route] || "ParkIQ"}</h1>
      </div>

      <div className="topbar-right">
        {summary.length > 0 && (
          <label className="camera-select">
            <Icon name="camera" size={16} />
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {summary.map((c) => (
                <option key={c.camera_id} value={c.camera_id}>
                  {c.name || c.camera_id}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" size={15} className="select-caret" />
          </label>
        )}

        <span className={`ws-pill ws-${wsStatus}`} title={`Realtime: ${wsStatus}`}>
          <span className="ws-dot" /> {WS_LABEL[wsStatus] || "…"}
        </span>

        <button className="icon-btn" title="Notifications" aria-label="Notifications">
          <Icon name="bell" size={18} />
        </button>
        <a className="icon-btn" href="http://localhost:5174" target="_blank" rel="noreferrer" title="Public finder">
          <Icon name="pin" size={18} />
        </a>
      </div>
    </header>
  );
}
