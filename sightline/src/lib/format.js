export const STATUS_META = {
  available: { label: "Open spaces", short: "Open", color: "#10b981", glow: "16,185,129" },
  moderate: { label: "Filling up", short: "Filling", color: "#f59e0b", glow: "245,158,11" },
  busy: { label: "Busy", short: "Busy", color: "#fb7185", glow: "251,113,133" },
  full: { label: "Full", short: "Full", color: "#ef4444", glow: "239,68,68" },
  unknown: { label: "No live data", short: "Offline", color: "#64748b", glow: "100,116,139" },
};

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.unknown;
}

export const TYPE_META = {
  garage: { label: "Garage", icon: "building" },
  lot: { label: "Lot", icon: "square-park" },
  street: { label: "Street", icon: "road" },
  mall: { label: "Mall", icon: "bag" },
  airport: { label: "Airport", icon: "plane" },
  stadium: { label: "Stadium", icon: "trophy" },
  hospital: { label: "Hospital", icon: "cross" },
  university: { label: "Campus", icon: "cap" },
  transit: { label: "Transit", icon: "train" },
};

export function typeMeta(type) {
  return TYPE_META[type] || { label: type, icon: "square-park" };
}

export const AMENITY_META = {
  ev_charging: { label: "EV charging", icon: "bolt" },
  accessible: { label: "Accessible", icon: "accessible" },
  covered: { label: "Covered", icon: "umbrella" },
  open_24h: { label: "Open 24h", icon: "clock" },
  security: { label: "Security", icon: "shield" },
  valet: { label: "Valet", icon: "key" },
  motorcycle: { label: "Motorcycle", icon: "bike" },
  bike: { label: "Bike racks", icon: "bicycle" },
  car_wash: { label: "Car wash", icon: "droplet" },
  height_clearance: { label: "Tall vehicles", icon: "arrows-v" },
};

export function amenityMeta(key) {
  return AMENITY_META[key] || { label: key, icon: "check" };
}

export function timeAgo(epochSeconds) {
  if (!epochSeconds) return "—";
  const seconds = Math.max(0, Date.now() / 1000 - epochSeconds);
  if (seconds < 8) return "just now";
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

export function formatPrice(price, currency = "USD") {
  if (price === null || price === undefined) return "Free";
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${price.toFixed(price % 1 === 0 ? 0 : 2)}/hr`;
}

export function formatDistance(km) {
  if (km === null || km === undefined) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function minutesToLabel(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h < 12 ? "AM" : "PM";
  const display = h % 12 || 12;
  return m === 0 ? `${display} ${suffix}` : `${display}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatHoursToday(hours) {
  if (!hours) return "Hours unknown";
  if (hours.open_24h) return "Open 24 hours";
  const weekday = (new Date().getDay() + 6) % 7; // JS: 0=Sun -> our 0=Mon
  const window = hours.week?.[weekday];
  if (!window) return `Closed ${DAY_NAMES[weekday]}`;
  return `${minutesToLabel(window[0])} – ${minutesToLabel(window[1])}`;
}

export function isOpenNow(hours) {
  if (!hours) return null;
  if (hours.open_24h) return true;
  const now = new Date();
  const weekday = (now.getDay() + 6) % 7;
  const window = hours.week?.[weekday];
  if (!window) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= window[0] && minutes <= window[1];
}

export function directionsUrl(location) {
  const dest = location.lat && location.lng
    ? `${location.lat},${location.lng}`
    : encodeURIComponent(`${location.name} ${location.address} ${location.city}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

export function clampPct(value) {
  return Math.max(0, Math.min(100, value || 0));
}
