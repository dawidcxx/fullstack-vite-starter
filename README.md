# Fullstack Vite Template

Opionated template on how to start Vite + Bun backend project.

# Features

- Full stack
- Vite@8 SPA frontend with HTML5 navigation support
- Bun/HonoJS backend
- Shared typed API contract via common package + Valibot
- Workspaces without third party tool bloat
- Yields a easy to deploy fullstack docker

_TLDR_: You want a small footprint backend with a stock vite frontend you use this

## Todo Demo (Shared Contract Pattern)

This template includes a basic in-memory Todo demo to show a clean API boundary:

- `common` defines route contract metadata, Valibot schemas, and shared types
- `backend` implements Hono routes using those shared schemas
- `web` calls the API with a typed fetch client importing only from `common`

The Todo data is stored in memory and resets when the backend restarts.