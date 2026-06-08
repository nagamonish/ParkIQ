import { useEffect, useState } from "react";

import { LiveView } from "../components/LiveView.jsx";
import { StatTiles } from "../components/StatTiles.jsx";
import { SlotList } from "../components/SlotList.jsx";
import { Icon } from "../components/Icon.jsx";
import { useCameraStream } from "../hooks/useCameraStream.js";
import { API_URL } from "../config.js";
import { navigate } from "../router.js";

function timeAgo(at) {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - at));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function DashboardPage({ op }) {
  const { selected, selectedId, selectedSlots, summary, events } = op;
  const { streamUrl, streamState, markLoaded, markError, reset } = useCameraStream(selectedId, API_URL);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    reset();
  }, [selectedId, reset]);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (summary.length === 0) {
    return (
      <div className="empty-hero">
        <Icon name="camera" size={40} />
        <h2>No cameras yet</h2>
        <p>Connect an RTSP camera to start detecting open spaces in real time.</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate("cameras")}>
          <Icon name="plus" size={18} /> Connect a camera
        </button>
      </div>
    );
  }

  const ts = clock.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const cameraEvents = events.filter((e) => e.camera_id === selectedId).slice(0, 12);

  return (
    <div className="dash-grid">
      <div className="dash-main">
        <LiveView
          camera={selected}
          slots={selectedSlots}
          streamUrl={streamUrl}
          streamState={streamState}
          onLoad={markLoaded}
          onError={markError}
          timestamp={ts}
        />
        <StatTiles summary={selected} />
      </div>

      <aside className="dash-side">
        <section className="panel">
          <div className="panel-head">
            <h3>Spaces</h3>
            <span className="panel-count">{selectedSlots.length}</span>
          </div>
          <SlotList slots={selectedSlots} />
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Recent activity</h3>
            <button className="link" onClick={() => navigate("analytics")}>
              Analytics →
            </button>
          </div>
          {cameraEvents.length === 0 ? (
            <p className="panel-empty">No state changes yet — events appear as cars come and go.</p>
          ) : (
            <ul className="event-list">
              {cameraEvents.map((e) => (
                <li key={e.id} className={e.occupied ? "is-occ" : "is-free"}>
                  <span className="event-dot" />
                  <span className="event-text">
                    <strong>{e.slot_id}</strong> {e.occupied ? "became occupied" : "freed up"}
                  </span>
                  <span className="event-time">{timeAgo(e.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
