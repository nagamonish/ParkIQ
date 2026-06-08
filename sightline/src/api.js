import { API_BASE } from "./config.js";

async function getJSON(path, params) {
  const url = new URL(`${API_BASE}/api${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, value);
      }
    }
  }
  const response = await fetch(url.toString().replace(window.location.origin, API_BASE || ""));
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

export function searchLocations(query) {
  // query: { q, lat, lng, radius_km, type[], amenity[], status[], max_price, open_now, sort, limit }
  return getJSON("/locations", query);
}

// Resolve a free-text place/neighborhood/address to a point. Returns
// { query, place: { label, lat, lng, source } | null }.
export function geocodePlace(q) {
  return getJSON("/geocode", { q });
}

export function fetchLocation(id, historyHours = 24) {
  return getJSON(`/locations/${encodeURIComponent(id)}`, { history_hours: historyHours });
}

export function fetchStats() {
  return getJSON("/stats");
}
