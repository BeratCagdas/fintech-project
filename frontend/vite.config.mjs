// vite.config.mjs (Render safe version)
export default {
  plugins: [
    (await import("@vitejs/plugin-react")).default()
  ],
};