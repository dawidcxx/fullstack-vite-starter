# Fullstack Vite Template

Opinionated template on how to start a Vite + Bun backend project. Optimized for resource efficiency and security.

## Project Structure

This template uses a monorepo setup with npm workspaces:

- `packages/backend/`: Bun + Hono.js API server with Drizzle ORM, migrations, and example todos feature
- `packages/common/`: Shared TypeScript utilities, DTOs, and Valibot schemas for API contracts
- `packages/web/`: Vite SPA with React, TailwindCSS, and SWR for data fetching


## Features

- Full-stack with full BE/FE separation
- Excellent security
- Sub-100MB production Docker image
- Small package count
- Workspaces without third-party tool bloat

## How to use

- This is a template repository. Clone it using the "Use this Template" button on GitHub and pull it locally.

- Rename the repo with the included init script `bun run init.js`.

- Afterwards, you can delete the script `rm init.js`.

- (Recommended) Have [nix](https://nixos.org/download/) and [direnv](https://github.com/direnv/direnv) set up.

## Key commands

- **Set up DB** `cd docker && docker compose up`
- **Install packages** `bun install`
- **Run development server** `bun run dev`
- **Run tests** `bun test`