import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ParkIQ marketing / soft-launch site. Static, content-only — no API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
  },
});
