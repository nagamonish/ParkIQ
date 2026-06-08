import { useCallback, useEffect, useState } from "react";

import { SpaceEditor } from "../components/SpaceEditor.jsx";
import { Icon } from "../components/Icon.jsx";
import { api } from "../api.js";
import { navigate } from "../router.js";

export default function SpacesPage({ op }) {
  const { selectedId, selected, saveSlots, refresh } = op;
  const [slots, setSlots] = useState([]);
  const [selSlot, setSelSlot] = useState(null);
  const [draw, setDraw] = useState(null);
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    if (!selectedId) return;
    try {
      const s = await api.getSlots(selectedId);
      setSlots(s.map((x) => ({ slot_id: x.slot_id, polygon: x.polygon, occupied: x.occupied })));
      setSelSlot(s[0]?.slot_id || null);
    } catch {
      setSlots([]);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2600);
  };

  const autoCalibrate = async () => {
    setStatus("calibrating");
    try {
      const r = await api.calibrate(selectedId);
      const found = (r.slots || []).map((s) => ({ slot_id: s.slot_id, polygon: s.polygon, occupied: false }));
      setSlots(found);
      setSelSlot(found[0]?.slot_id || null);
      flash(found.length ? `Auto-detected ${found.length} spaces — fine-tune and save.` : "No spaces detected — draw them manually.");
    } catch (e) {
      flash(e.message || "Calibration needs a connected camera frame.");
    } finally {
      setStatus("idle");
    }
  };

  const loadSample = async () => {
    setStatus("sample");
    try {
      const r = await api.loadPklot(selectedId);
      await load();
      flash(`Loaded ${r.slots?.length ?? 0} sample spaces.`);
    } catch (e) {
      flash(e.message || "Run scripts/setup_pklot_sample.py first.");
    } finally {
      setStatus("idle");
    }
  };

  const save = async () => {
    setStatus("saving");
    try {
      await saveSlots(selectedId, slots);
      await refresh();
      flash(`Saved ${slots.length} spaces. Detection is now using them.`);
    } catch (e) {
      flash(e.message || "Save failed.");
    } finally {
      setStatus("idle");
    }
  };

  const deleteSel = () => {
    setSlots((s) => s.filter((x) => x.slot_id !== selSlot));
    setSelSlot(null);
  };

  const renameSel = (value) => {
    setSlots((s) => s.map((x) => (x.slot_id === selSlot ? { ...x, slot_id: value } : x)));
    setSelSlot(value);
  };

  if (!selectedId) {
    return (
      <div className="empty-hero">
        <Icon name="spaces" size={40} />
        <h2>Pick a camera to define spaces</h2>
        <p>Connect a camera, then draw a polygon around each parking space.</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate("cameras")}>
          <Icon name="camera" size={18} /> Go to cameras
        </button>
      </div>
    );
  }

  return (
    <div className="spaces-grid">
      <div className="spaces-main">
        <div className="spaces-toolbar">
          <button className="btn" onClick={autoCalibrate} disabled={status === "calibrating"}>
            <Icon name="wand" size={16} /> {status === "calibrating" ? "Detecting…" : "Auto-detect"}
          </button>
          <button className="btn" onClick={() => setDraw([])} disabled={!!draw}>
            <Icon name="plus" size={16} /> Draw space
          </button>
          <button className="btn" onClick={loadSample} disabled={status === "sample"}>
            <Icon name="layers" size={16} /> Load sample
          </button>
          <span className="spaces-count">{slots.length} spaces</span>
          <button className="btn btn-primary spaces-save" onClick={save} disabled={status === "saving"}>
            <Icon name="save" size={16} /> {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>

        <SpaceEditor
          cameraId={selectedId}
          slots={slots}
          setSlots={setSlots}
          selectedId={selSlot}
          setSelectedId={setSelSlot}
          draw={draw}
          setDraw={setDraw}
        />

        {msg && (
          <div className="spaces-msg">
            <Icon name="check" size={15} /> {msg}
          </div>
        )}
      </div>

      <aside className="spaces-side">
        <section className="panel">
          <div className="panel-head">
            <h3>How to get accurate detection</h3>
          </div>
          <ol className="howto">
            <li>Click <b>Auto-detect</b> to seed spaces from the painted lines, or <b>Draw space</b> to add your own.</li>
            <li>Click a space, then drag its corner handles so the polygon tightly hugs one stall.</li>
            <li><b>Save</b> — occupancy is decided by how much a detected vehicle overlaps each polygon.</li>
          </ol>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Spaces</h3>
            <span className="panel-count">{slots.length}</span>
          </div>
          {selSlot && (
            <div className="space-edit">
              <label>
                Space ID
                <input value={selSlot} onChange={(e) => renameSel(e.target.value)} />
              </label>
              <button className="btn btn-sm btn-danger" onClick={deleteSel}>
                <Icon name="trash" size={14} /> Delete
              </button>
            </div>
          )}
          <div className="space-chiplist">
            {slots.map((s) => (
              <button
                key={s.slot_id}
                className={`space-chip ${s.slot_id === selSlot ? "is-active" : ""}`}
                onClick={() => setSelSlot(s.slot_id)}
              >
                {s.slot_id}
              </button>
            ))}
            {slots.length === 0 && <p className="panel-empty">No spaces yet.</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}
