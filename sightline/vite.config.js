import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Sightline (public site) dev server. In development we proxy API + WebSocket
// traffic to the Sightline cloud service so the app works same-origin with no
// CORS friction. In production, nginx fronts both. Override the cloud target
// with SIGHTLINE_CLOUD_TARGET when running the cloud on a different host/port.
const cloudTarget = process.env.SIGHTLINE_CLOUD_TARGET || "http://localhost:8001";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": { target: cloudTarget, changeOrigin: true },
      "/ws": { target: cloudTarget, ws: true, changeOrigin: true },
    },
  },
});
