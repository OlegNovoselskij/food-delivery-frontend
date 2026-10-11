import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const DEFAULT_API_URL = "http://localhost:8000";

function preconnectToApi(apiUrl: string): Plugin {
  return {
    name: "preconnect-to-api",
    transformIndexHtml: () => [
      {
        tag: "link",
        attrs: { rel: "preconnect", href: apiUrl.replace(/\/+$/, ""), crossorigin: "" },
        injectTo: "head",
      },
    ],
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    preconnectToApi(loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL ?? DEFAULT_API_URL),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
}));
