// Where the Sightline cloud lives. Empty string = same origin (dev proxy or
// nginx in production both serve /api and /ws). Override at build time with
// VITE_CLOUD_URL (e.g. https://cloud.sightline.app).
export const API_BASE = (import.meta.env.VITE_CLOUD_URL ?? "").replace(/\/$/, "");

export function wsUrl() {
  const explicit = import.meta.env.VITE_CLOUD_WS;
  if (explicit) return explicit;
  if (API_BASE) {
    return `${API_BASE.replace(/^http/, "ws")}/ws`;
  }
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws`;
}

// A sensible default origin (downtown San Francisco) so distance + "nearest"
// sorting work before the visitor shares their location.
export const DEFAULT_ORIGIN = { lat: 37.788, lng: -122.4074, label: "Downtown SF" };
