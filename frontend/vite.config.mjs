import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ["fintech-frontend-8nux.onrender.com"],
    port: process.env.PORT || 10000,
    host: true,
  },
});
