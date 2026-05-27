import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { pages } from "@the_application_name/common";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: "mpa-subroute-fallback",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (!req.url) return next();
          const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
          if (url.pathname.includes(".")) return next();
          for (const route of Object.keys(pages)) {
            if (route !== "/" && (url.pathname === route || url.pathname.startsWith(`${route}/`))) {
              req.url = route + url.search;
              return next();
            }
          }
          next();
        });
      },
    },
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        Object.entries(pages).map(([_, file]) => {
          const name = file.replace(".html", "");
          return [name, resolve(rootDir, file)];
        }),
      ),
    },
  },
});