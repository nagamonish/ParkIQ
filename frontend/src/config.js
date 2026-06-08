// Operator backend (ParkIQ API). Same-origin in production (nginx), or set
// VITE_API_URL for local/dev (defaults to the dev backend on :8000).
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export const WS_URL =
  import.meta.env.VITE_WS_URL || `${API_URL.replace(/^http/, "ws")}/ws`;

export function streamUrl(cameraId) {
  if (!cameraId) return "";
  return `${API_URL}/cameras/${encodeURIComponent(cameraId)}/stream`;
}
