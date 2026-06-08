import { useState } from "react";

import { Icon } from "../components/Icon.jsx";
import { navigate } from "../router.js";

function StatusBadge({ status }) {
  const tone =
    status === "connected" ? "ok" : status === "reconnecting" || status === "connecting" ? "warn" : "off";
  return (
    <span className={`cam-status cam-status-${tone}`}>
      <span className="cam-status-dot" /> {status || "stopped"}
    </span>
  );
}

export default function CamerasPage({ op }) {
  const { summary, removeCamera, addCamera, setSelectedId } = op;
  const [form, setForm] = useState({ camera_id: "", name: "", rtsp_url: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.camera_id.trim() || !form.rtsp_url.trim()) {
      setError("Camera ID and RTSP URL are required.");
      return;
    }
    setBusy(true);
    try {
      await addCamera({
        camera_id: form.camera_id.trim(),
        name: form.name.trim() || form.camera_id.trim(),
        rtsp_url: form.rtsp_url.trim(),
        slots: [],
      });
      setForm({ camera_id: "", name: "", rtsp_url: "" });
      setOpen(false);
      navigate("spaces");
    } catch (err) {
      setError(err.message || "Could not add camera.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cameras-page">
      <div className="page-head">
        <div>
          <h2>Cameras</h2>
          <p className="page-sub">Connect RTSP feeds. Each camera runs detection independently.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
          <Icon name="plus" size={17} /> Connect camera
        </button>
      </div>

      {open && (
        <form className="connect-card" onSubmit={submit}>
          <div className="connect-grid">
            <label>
              Camera ID
              <input
                placeholder="cam-northlot"
                value={form.camera_id}
                onChange={(e) => setForm({ ...form, camera_id: e.target.value })}
              />
            </label>
            <label>
              Display name
              <input
                placeholder="North Lot"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="connect-rtsp">
              RTSP URL
              <input
                placeholder="rtsp://user:pass@192.168.1.50:554/stream"
                value={form.rtsp_url}
                onChange={(e) => setForm({ ...form, rtsp_url: e.target.value })}
              />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="connect-actions">
            <span className="hint">
              <Icon name="link" size={14} /> Use an `rtsp://` URL. MediaMTX can relay webcams or files for testing.
            </span>
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy ? "Connecting…" : "Connect & calibrate"}
            </button>
          </div>
        </form>
      )}

      {summary.length === 0 ? (
        <div className="empty-hero">
          <Icon name="camera" size={40} />
          <h2>No cameras connected</h2>
          <p>Connect your first RTSP camera to begin.</p>
          <button className="btn btn-primary btn-lg" onClick={() => setOpen(true)}>
            <Icon name="plus" size={18} /> Connect a camera
          </button>
        </div>
      ) : (
        <div className="cam-grid">
          {summary.map((c) => (
            <article className="cam-card" key={c.camera_id}>
              <div className="cam-card-top">
                <div>
                  <h3>{c.name || c.camera_id}</h3>
                  <span className="cam-id">{c.camera_id}</span>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div className="cam-metrics">
                <div>
                  <span className="cam-metric-num">{c.total ?? 0}</span>
                  <span className="cam-metric-label">spaces</span>
                </div>
                <div>
                  <span className="cam-metric-num ok">{c.available ?? 0}</span>
                  <span className="cam-metric-label">free</span>
                </div>
                <div>
                  <span className="cam-metric-num">{c.occupancy_pct ?? 0}%</span>
                  <span className="cam-metric-label">full</span>
                </div>
              </div>

              {c.last_error && (
                <p className="cam-error">
                  <Icon name="alert" size={14} /> {c.last_error}
                  {c.reconnect_attempts ? ` · ${c.reconnect_attempts} reconnects` : ""}
                </p>
              )}

              <div className="cam-card-actions">
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setSelectedId(c.camera_id);
                    navigate("dashboard");
                  }}
                >
                  <Icon name="play" size={15} /> View
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setSelectedId(c.camera_id);
                    navigate("spaces");
                  }}
                >
                  <Icon name="spaces" size={15} /> Spaces
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    if (confirm(`Remove camera "${c.name || c.camera_id}"? This deletes its spaces.`)) {
                      removeCamera(c.camera_id);
                    }
                  }}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
