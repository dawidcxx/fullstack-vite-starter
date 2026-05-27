# AGENTS.md

## Dev server

Assume a dev server is already running at `http://localhost:5176` (Vite HMR) and the backend at `http://localhost:8080`. Prompt the user to run `bun run dev` if not.

Running `bun run dev` concurrently starts:

- `bun run dev:backend` — Hono API server on `:8080`
- `bun run dev:web` — Vite dev server (TSX served directly, HMR)
- `bun run dev:common` — watch-mode rebuild of `packages/common`

The Vite dev server proxies `/api` → `http://localhost:8080`.

## Adding a feature

If a brand new feature is requested, start by modeling the domain first (see `docs/domain-modeling-playbook.md`), then follow `docs/backend-feature-playbook.md` for wiring it into the backend.

## Multi-page (SPA-per-route) routing

This project serves multiple SPAs from a single Vite dev server:

- `/` → `index.html` (root SPA, todo demo)
- `/design` → `design.html` (UI sandbox SPA)

Both dev (Vite) and production (backend `serveStaticAssets`) serve the correct page HTML for sub-routes. For example, `/design/components` correctly serves `design.html`, not `index.html`.

Dev-mode routing is handled by the `mpa-subroute-fallback` Vite plugin in `packages/web/vite.config.ts`.
Production routing is handled by prefix matching in `packages/backend/src/lib/serveStaticAssets.ts`.

When adding new SPAs:

1. Add the URL→HTML mapping to `packages/common/src/consts/pages.ts`
2. This automatically configures both Vite dev routing and production static asset serving