import { useEffect, useState } from "react";

import { HistoryChart } from "../components/HistoryChart.jsx";
import { StatTiles } from "../components/StatTiles.jsx";
import { Icon } from "../components/Icon.jsx";
import { api } from "../api.js";
import { navigate } from "../router.js";

const RANGES = [
  { h: 24, label: "24h" },
  { h: 72, label: "3d" },
  { h: 168, label: "7d" },
];

function fmtHour(h) {
  const s = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}${s}`;
}

export default function AnalyticsPage({ op }) {
  const { selectedId, selected } = op;
  const [hours, setHours] = useState(24);
  const [history, setHistory] = useState([]);
  const [peak, setPeak] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setLoading(true);
    Promise.all([api.history(selectedId, hours).catch(() => []), api.peakHours(selectedId).catch(() => [])])
      .then(([h, p]) => {
        if (!active) return;
        setHistory(h || []);
        setPeak((p || []).slice(0, 8));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [selectedId, hours]);

  if (!selectedId) {
    return (
      <div className="empty-hero">
        <Icon name="analytics" size={40} />
        <h2>No camera selected</h2>
        <button className="btn btn-primary btn-lg" onClick={() => navigate("cameras")}>
          Go to cameras
        </button>
      </div>
    );
  }

  const maxPeak = Math.max(1, ...peak.map((p) => p.avg_occupancy_pct || 0));

  return (
    <div className="analytics-page">
      <div className="page-head">
        <div>
          <h2>{selected?.name || selectedId}</h2>
          <p className="page-sub">Occupancy trends from recorded detection events.</p>
        </div>
        <div className="range-toggle">
          {RANGES.map((r) => (
            <button key={r.h} className={hours === r.h ? "is-on" : ""} onClick={() => setHours(r.h)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <StatTiles summary={selected} />

      <section className="panel">
        <div className="panel-head">
          <h3>Occupancy over time</h3>
          {loading && <span className="muted">Loading…</span>}
        </div>
        <HistoryChart history={history} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Busiest hours</h3>
        </div>
        {peak.length === 0 ? (
          <p className="panel-empty">No peak-hour data yet — it builds as occupancy changes are recorded.</p>
        ) : (
          <div className="peak-list">
            {peak.map((p) => (
              <div className="peak-row" key={p.hour}>
                <span className="peak-hour">{fmtHour(p.hour)}</span>
                <div className="peak-bar">
                  <span
                    className="peak-fill"
                    style={{ width: `${((p.avg_occupancy_pct || 0) / maxPeak) * 100}%` }}
                  />
                </div>
                <span className="peak-val">{Math.round(p.avg_occupancy_pct || 0)}%</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
