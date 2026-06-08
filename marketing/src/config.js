// Where the public "find parking" CTA points (the live Sightline finder app).
// Override at build time with VITE_SIGHTLINE_URL (e.g. https://app.sightline.io).
export const SIGHTLINE_URL = import.meta.env.VITE_SIGHTLINE_URL || "http://localhost:5174";

// Where the operator console lives (login + dashboard).
export const OPERATOR_URL = import.meta.env.VITE_OPERATOR_URL || "http://localhost:5173";

// Where "Book a demo" / operator inquiries go. Front-end only for the soft launch.
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "hello@parkiq.io";

export const LAUNCH_CITY = "San Francisco";
