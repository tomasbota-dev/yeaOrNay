import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: "frontend",
  publicDir: "static",
  build: {
    outDir: "../dist/client", emptyOutDir: true,
    rollupOptions: { input: {
      app: fileURLToPath(new URL("./frontend/index.html", import.meta.url)),
      public: fileURLToPath(new URL("./frontend/public.html", import.meta.url)),
    } },
  },
  esbuild: { jsx: "automatic" },
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": { target: "http://127.0.0.1:8787", ws: true },
      "/room-icons": "http://127.0.0.1:8787",
      "/profile-photos": "http://127.0.0.1:8787",
    },
  },
});
