import { useEffect, useState } from "react";

import { Icon } from "../components/Icon.jsx";
import { api } from "../api.js";
import { navigate } from "../router.js";

const FIELDS = [
  {
    key: "confidence_threshold",
    label: "Detection confidence",
    hint: "Minimum confidence to count a vehicle. Higher = fewer false positives.",
    min: 0.1,
    max: 0.9,
    step: 0.05,
    fmt: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: "iou_threshold",
    label: "Overlap to mark occupied",
    hint: "How much a vehicle must overlap a space to fill it. Lower = more sensitive.",
    min: 0.1,
    max: 0.8,
    step: 0.05,
    fmt: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: "smoothing_window",
    label: "Smoothing window",
    hint: "Frames averaged before a space flips state. Higher = steadier, slower.",
    min: 1,
    max: 15,
    step: 1,
    fmt: (v) => `${v} frames`,
  },
];

export default function SettingsPage({ op }) {
  const { selectedId, selected, removeCamera } = op;
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    api.getSettings(selectedId).then(setSettings).catch(() => setSettings(null));
  }, [selectedId]);

  const update = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await api.updateSettings(selectedId, settings);
      setSettings(res);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setBusy(false);
    }
  };

  if (!selectedId) {
    return (
      <div className="empty-hero">
        <Icon name="settings" size={40} />
        <h2>No camera selected</h2>
        <button className="btn btn-primary btn-lg" onClick={() => navigate("cameras")}>
          Go to cameras
        </button>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-head">
        <div>
          <h2>{selected?.name || selectedId}</h2>
          <p className="page-sub">Tune how this camera decides a space is occupied.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>Detection</h3>
          {saved && <span className="saved-tag"><Icon name="check" size={14} /> Saved</span>}
        </div>
        {!settings ? (
          <p className="panel-empty">Loading settings… (the camera must be running).</p>
        ) : (
          <div className="settings-fields">
            {FIELDS.map((f) => (
              <div className="setting-row" key={f.key}>
                <div className="setting-label">
                  <span>{f.label}</span>
                  <small>{f.hint}</small>
                </div>
                <div className="setting-control">
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={settings[f.key] ?? f.min}
                    onChange={(e) => update(f.key, f.step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10))}
                  />
                  <span className="setting-value">{f.fmt(settings[f.key] ?? f.min)}</span>
                </div>
              </div>
            ))}
            <button className="btn btn-primary" onClick={save} disabled={busy}>
              <Icon name="save" size={16} /> {busy ? "Applying…" : "Apply changes"}
            </button>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Camera</h3>
        </div>
        <div className="info-rows">
          <div className="info-row">
            <span>Camera ID</span>
            <b>{selectedId}</b>
          </div>
          <div className="info-row">
            <span>Status</span>
            <b>{selected?.status || "—"}</b>
          </div>
          <div className="info-row">
            <span>Spaces</span>
            <b>{selected?.total ?? 0}</b>
          </div>
        </div>
      </section>

      <section className="panel panel-danger">
        <div className="panel-head">
          <h3>Danger zone</h3>
        </div>
        <div className="danger-row">
          <span>Remove this camera and all of its spaces.</span>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm(`Remove "${selected?.name || selectedId}"?`)) {
                removeCamera(selectedId);
                navigate("cameras");
              }
            }}
          >
            <Icon name="trash" size={15} /> Remove camera
          </button>
        </div>
      </section>
    </div>
  );
}
