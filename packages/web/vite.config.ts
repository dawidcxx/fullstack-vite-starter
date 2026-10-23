import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import {
  CONFIG_PRELUDE_PLACEHOLDER,
  pages,
  pickViteConfig,
  serializeConfigPrelude,
  type RuntimeConfig,
} from "@the_application_name/common";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const rootDir = import.meta.dirname;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "VITE_");

  return {
    plugins: [
      mpaSubrouteFallbackPlugin(),
      runtimeConfigPreludePlugin(pickViteConfig(env)),
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
        "@": resolve(import.meta.dirname, "./src"),
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
  };
});

function mpaSubrouteFallbackPlugin(): Plugin {
  return {
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
  };
}

function runtimeConfigPreludePlugin(runtimeConfig: RuntimeConfig): Plugin {
  return {
    name: "runtime-config-prelude",
    apply: "serve",
    transformIndexHtml(html) {
      return html.replace(CONFIG_PRELUDE_PLACEHOLDER, serializeConfigPrelude(runtimeConfig));
    },
  };
}