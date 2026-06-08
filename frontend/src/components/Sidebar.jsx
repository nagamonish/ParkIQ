import { Icon } from "./Icon.jsx";
import { navigate } from "../router.js";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "cameras", label: "Cameras", icon: "camera" },
  { id: "spaces", label: "Spaces", icon: "spaces" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export function Sidebar({ route, summary, onLogout }) {
  const cameraCount = summary.length;
  const online = summary.filter((c) => c.status === "connected").length;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8.5" fill="#1d1d1f" />
            <circle cx="16" cy="16" r="7" fill="none" stroke="#fff" strokeWidth="2.4" />
            <circle cx="16" cy="16" r="2.6" fill="#7c3aed" />
          </svg>
        </span>
        <div className="brand-text">
          Park<span className="brand-iq">IQ</span>
          <small>Operator</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${route === item.id ? "is-active" : ""}`}
            onClick={() => navigate(item.id)}
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-stat">
          <span className="sidebar-stat-num">{online}/{cameraCount}</span>
          <span className="sidebar-stat-label">cameras online</span>
        </div>
        <button className="sidebar-logout" onClick={onLogout}>
          <Icon name="logout" size={17} /> <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
