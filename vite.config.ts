import { defineConfig } from "vite";

export default defineConfig({
  root: "frontend",
  publicDir: "static",
  build: { outDir: "../dist/client", emptyOutDir: true },
  esbuild: { jsx: "automatic" },
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": "http://127.0.0.1:8787",
      "/room-icons": "http://127.0.0.1:8787",
      "/profile-photos": "http://127.0.0.1:8787",
    },
  },
});
