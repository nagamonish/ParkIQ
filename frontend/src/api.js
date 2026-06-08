import { API_URL } from "./config.js";

async function req(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      /* ignore */
    }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => req("/health"),
  listCameras: () => req("/cameras"),
  summary: () => req("/summary"),
  addCamera: (payload) => req("/cameras", { method: "POST", body: JSON.stringify(payload) }),
  deleteCamera: (id) => req(`/cameras/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getSlots: (id) => req(`/cameras/${encodeURIComponent(id)}/slots`),
  saveSlots: (id, slots) =>
    req(`/cameras/${encodeURIComponent(id)}/slots`, {
      method: "POST",
      body: JSON.stringify({ slots: slots.map(({ slot_id, polygon }) => ({ slot_id, polygon })) }),
    }),
  detections: (id) => req(`/cameras/${encodeURIComponent(id)}/detections`),
  calibrate: (id) => req(`/cameras/${encodeURIComponent(id)}/calibrate`, { method: "POST" }),
  loadPklot: (id) => req(`/cameras/${encodeURIComponent(id)}/samples/pklot`, { method: "POST" }),
  setHomography: (id, body) =>
    req(`/cameras/${encodeURIComponent(id)}/homography`, { method: "POST", body: JSON.stringify(body) }),
  getSettings: (id) => req(`/cameras/${encodeURIComponent(id)}/settings`),
  updateSettings: (id, body) =>
    req(`/cameras/${encodeURIComponent(id)}/settings`, { method: "POST", body: JSON.stringify(body) }),
  history: (id, hours = 24) => req(`/analytics/${encodeURIComponent(id)}/history?hours=${hours}`),
  peakHours: (id) => req(`/analytics/${encodeURIComponent(id)}/peak-hours`),
};
