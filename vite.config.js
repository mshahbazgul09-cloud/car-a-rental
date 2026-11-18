import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Tailwind CSS v4 runs as a Vite plugin: no tailwind.config.js or postcss.config.js needed.
// Theme tokens (colors, fonts) live in src/index.css under @theme.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // In development, /api calls go through the Vite server to FastAPI, so the browser sees one address.
  server: { proxy: { "/api": "http://127.0.0.1:8000" } },
});
