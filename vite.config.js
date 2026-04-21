import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/wbstats/",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/wb-api": {
        target: "https://statistics-api.wildberries.ru",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wb-api/, ""),
      },
      "/wb-content": {
        target: "https://content-api.wildberries.ru",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wb-content/, ""),
      },
    },
  },
});
