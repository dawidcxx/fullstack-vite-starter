# Review: Bun → Node.js Migration

## Summary

The working tree migrates the entire monorepo from Bun to Node.js + pnpm. This includes replacing `Bun.*` APIs, switching the runtime, test framework, package manager, build tooling, and CI/devenv configuration.

---

## Staged Changes

### 1. Package manager & workspace: Bun → pnpm

- `bun.lock` deleted, `pnpm-lock.yaml` + `pnpm-workspace.yaml` added.
- Root `package.json` updated to declare `"packageManager": "pnpm@11.10.0"`.
- All `bun run` references in `AGENTS.md`, `README.md` replaced with `pnpm` equivalents.

**Verdict:** Correct and consistent. The `pnpm-workspace.yaml` enables `esbuild` in `allowBuilds`, which is needed for native module postinstall.

### 2. Runtime: Bun → Node.js (`@hono/node-server`)

**`packages/backend/src/container.ts`**

- `Bun.sql` → `postgres(process.env.DATABASE_URL!)` (npm `postgres` package).
- `drizzle-orm/bun-sql` → `drizzle-orm/postgres-js`.
- DI tokens extracted to `dbTokens.ts` (`DB_SQL`, `DB`). Good abstraction.

**`packages/backend/src/shared/HttpServer.ts`**

- `import.meta.dir` → `dirname(fileURLToPath(import.meta.url))` (Node.js compat).
- `Bun.serve()` → `serve()` from `@hono/node-server`.
- WebSocket import (`hono/bun`) removed.
- Port is now parsed with `parseInt()` — was previously passed as string to `Bun.serve`. Now correct.
- `serverRef` type: `Bun.Server` → `ReturnType<typeof serve>`.
- Shutdown: `serverRef?.stop()` → `new Promise<void>(res => serverRef!.close(res))`. Correct.

**`packages/backend/src/lib/serveStaticAssets.ts`**

- `Bun.file(filePath)` → `new Response(readFileSync(filePath))`.
- `existsSync`/`readFileSync` from `node:fs` replace `Bun.file`.

**Verdict:** Functional. Minor concerns:

- **`readFileSync` blocks the event loop.** For production use under load, this should be replaced with streaming/async reads (`createReadStream` + `streamBody` from `hono/streaming` or `node:fs/promises`). Acceptable for template/demo purposes, but worth a TODO.
- **WebSocket support dropped.** The `Bun.websocket` handler is removed with no replacement. If anyone relied on WS, this is a regression. Not critical for the template as-is, but the `AGENTS.md` or `README.md` doesn't call this out.

### 3. Database abstractions

**`packages/backend/src/shared/dbTokens.ts` (new)**

- Extracts `DB_SQL` and `DB` DI tokens + helper types.
- Clean: Symbol-based tokens avoid collision.

**`packages/backend/src/shared/migrations/Migrator.ts`**

- Updated to use `postgres.TransactionSql` type and `DB_SQL` token instead of `Bun.SQL`.

**`packages/backend/src/shared/migrations/migrations.ts`**

- `import … with { type: "text" }` (Bun import attribute) → `readFileSync` + `createHash` from `node:crypto`.
- Checksum algorithm: `Bun.hash()` → `SHA-256`. **This is a breaking migration checksum change.** If any database already has migrations applied (e.g., the developer's local DB), the checksums won't match and the migrator will fail. For a template/early-stage project this is acceptable, but should be documented.

**`packages/backend/src/shared/migrations/sql.d.ts` (deleted)**

- Removed Bun ambient module declaration. No longer needed.

**Verdict:** Clean. The checksum change is a silent breaking change — consider a note in a changelog or commit message.

### 4. TypeScript: `@typescript/native-preview` → `typescript@^7.0.0`

- All three `package.json` files switch from `"npm:@typescript/native-preview@beta"` to `"typescript": "^7.0.0"`.
- All `tsgo` invocations → `tsc`.
- `packages/backend/tsconfig.build.json` (new) extends base and enables `experimentalDecorators` for the esbuild step.
- `packages/backend/tsconfig.json`: added `"types": ["node"]`, removed comments.
- `packages/common/tsconfig.json`: removed `"types": ["bun"]`.

**Verdict:** Good. The separate `tsconfig.build.json` is a clean pattern for decorator-heavy libs (needle-di requires `experimentalDecorators` at runtime). One question: does the `test` script's typecheck also use the build tsconfig? No — `test` runs `tsc --noEmit` using the base `tsconfig.json`. If tests import anything that emits decorators, this could be a problem. The integration tests (`todos.integration.test.ts`) import `TodosService` which is `@injectable()` — this works because `tsc --noEmit` only checks types and doesn't transform. At runtime `tsx` handles decorators correctly. Acceptable.

### 5. Test framework: `bun:test` → `node:test`

**`packages/backend/src/shared/tests/Cache.test.ts`**

- `bun:test` → `node:test` + `node:assert/strict`.
- `expect().toBe()` → `assert.deepStrictEqual()`, `expect().toBeUndefined()` → `assert.deepStrictEqual(x, undefined)`, etc.

**`packages/backend/src/test/todos.integration.test.ts`**

- Same migration. `beforeAll`/`afterAll` → `before`/`after` (node:test naming).
- `expect().toEqual()` → `assert.deepStrictEqual()`.
- `expect().toBeGreaterThanOrEqual()` → `assert.ok()`.

**`packages/backend/src/test/utils/setup.ts` (deleted)**

- Removed global test setup file (was Bun-specific).

**Verdict:** Correct. The `assert.deepStrictEqual(x, undefined)` pattern is technically correct but `assert.strictEqual(x, undefined)` would be more idiomatic. No functional issue though.

### 6. Web package changes

**`packages/web/package.json` (staged)**

- Removed `lint`, `preview` scripts. `lint` removal is fine (no eslint config in the repo). `preview` removal is slightly odd — Vite's `preview` command is commonly useful.
- TypeScript still uses `tsgo` in staged version (later overridden by unstaged changes to `tsc`).

### 7. Config / infra

**`flake.nix`**

- `bun` → `nodejs_26` + `pnpm` in `buildInputs`.
- Build and run scripts updated to use `pnpm`/`node` instead of `bun`.

**`docker/Dockerfile`**

- `oven/bun:1-alpine` → `node:24-alpine` for both builder and runtime.
- `corepack` used to install pnpm.
- `CMD bun --sql-preconnect run main.js` → `CMD node main.js`. The `postgres` npm package handles connection pooling internally, so `--sql-preconnect` is unnecessary. Fine.

**`opencode.json`**

- LSP config (TypeScript disabled, `tsgo` enabled) replaced with MCP server config (`context7`).
- Schema format changed: `"mcp"` → `"mcpServers"`, `"$schema"` removed.
- `playwright` MCP server dropped.

**Verdict:** The `opencode.json` change drops the LSP config entirely. If the user intended to keep TypeScript LSP but switched to `tsc`-based, this config should be removed anyway. The `context7` MCP server addition is unrelated to the Bun→Node migration. Should this be a separate commit?

**`packages/backend/.env.local` (staged)**

- Port changed from `5432` → `6661`. This appears to be a local development preference and probably should not be tracked. Consider adding `.env.local` to `.gitignore`.

---

## Unstaged Changes

### 8. Port suppression & shutdown fixes

**`packages/backend/src/container.ts` + `integrationTestContext.ts`**

- `postgres(…)` calls now pass `{ onnotice: () => {} }` to suppress PostgreSQL notice messages (e.g., "relation already exists" on migration re-runs).

**`packages/backend/src/main.ts`**

- `SIGKILL` handler removed — correct, `SIGKILL` cannot be caught or handled.
- Unhandled rejection handler now passes `"SIGTERM"` to `handleShutdown` instead of `"SIGKILL"`.
- Missing trailing newline.

### 9. Build tooling: unstaged `tsgo → tsc` completion

The unstaged `package.json` diffs complete the `tsgo` → `tsc` migration in `packages/common` and `packages/web` that was partially done in staging. Adds `@types/node`, `tsx` to `packages/common` devDeps.

### 10. Testing additions (untracked)

**`packages/web/vitest.config.ts` (new)**

- Vitest config with `jsdom` environment, path alias `@` → `./src`.
- Unresolved: the alias doesn't exist as a Vite config or tsconfig path mapping — the base `vite.config.ts` should be checked for consistency.

**`packages/web/src/components/Counter.tsx` + `Counter.test.tsx` (new)**

- Simple React counter component with Vitest + `@testing-library/react` tests.
- Clean, idiomatic. Good example setup.

**`packages/common/src/utils/mapOptional.test.ts` (new)**

- Tests for `mapOptional` utility using `node:test`.

**`package.json` root**

- Adds `"test": "pnpm -r test"` script — good.

### 11. `flake.nix` version inconsistency

`buildInputs` lists `nodejs_26` but the `run` shellscript uses `${pkgs.nodejs_24}/bin/node`. These should match. Likely the intent is `nodejs_26` given the Dockerfile also uses `node:24-alpine` (corresponding to Node 24). But `nodejs_26` in Nix would map to Node 26, not 24. This is confusing at best, potentially broken at worst.

---

## Blocking Issues

| #   | Issue                                                                              | Severity   | File                                                   |
| --- | ---------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| 1   | `flake.nix`: `nodejs_26` vs `nodejs_24` mismatch                                   | **High**   | `flake.nix`                                            |
| 2   | Migration checksum algorithm changed (Bun.hash → sha256) — will break existing DBs | **Medium** | `packages/backend/src/shared/migrations/migrations.ts` |
| 3   | `serveStaticAssets` lacks `Content-Type` header — all files served as `text/plain` | **High**   | `packages/backend/src/lib/serveStaticAssets.ts`        |
| 4   | `readFileSync` in serveStaticAssets blocks event loop + no in-memory caching       | **Low**    | `packages/backend/src/lib/serveStaticAssets.ts`        |
| 5   | WebSocket support silently dropped (no migration path)                             | **Low**    | `packages/backend/src/shared/HttpServer.ts`            |
| 6   | `opencode.json` drops LSP config + adds unrelated `context7` MCP server            | **Low**    | `opencode.json`                                        |

## Recommendations

1. **Fix `flake.nix` node version** — choose one and be consistent.
2. **Fix `serveStaticAssets` MIME types** — this is a production regression. Either set `Content-Type` headers based on file extension, or switch to Hono's built-in `serveStatic` middleware.
3. **Document migration checksum change** — if any existing DB has migrations applied, the SHA-256 checksum won't match the old `Bun.hash` checksum.
4. **Add `readFileSync` TODO** — it's fine for a template but flag it for production. Consider adding in-memory caching.
5. **Split `opencode.json` changes** — the context7 MCP server addition is orthogonal to the Bun→Node migration.
6. **Remove dead `@/*` path alias from `packages/backend/tsconfig.json`** — no source file uses it after the relative import migration.
7. **Add `vitest.config.ts` to `tsconfig.node.json` include** — or widen the pattern to `"*.config.ts"`.
8. **Add a DB connectivity check to `main.ts` startup** — with `postgres` package, DB connection is lazy, so startup succeeds even if DB is unreachable. A fail-fast check is valuable for production.

---

## Additional Observations (Round 2)

### 12. Bug fix in `Config.ts`: `httpPort` getter was broken

```diff
  public get httpPort(): string {
-   return this.overridesMap.httpHost ?? process.env["PORT"] ?? "8080";
+   return this.overridesMap.httpPort ?? process.env["PORT"] ?? "8080";
  }
```

The `httpPort` getter was returning `this.overridesMap.httpHost` — a copy-paste bug that would silently ignore any `httpPort` override passed via the constructor's `overridesMap`. This is a real bug fix, not just a migration change. The only valid override path was the `PORT` env var. Worth calling out in the commit message.

### 13. `.gitignore` explicitly tracks `.env.local` — port change is intentional

Contrary to point 5 in the Blocking Issues table, `.gitignore` has `!`.env.local`which re-includes`.env.local`after the blanket`\*.local`ignore. The DB port change from`5432`→`6661`is therefore a deliberate config change. However,`6661`is an unusual port — it's historically associated with IRC servers. If this was chosen to avoid conflicts with a system PostgreSQL instance, a comment in the`.env.local` file would be helpful.

### 14. `tsconfig.node.json` doesn't include `vitest.config.ts`

The `tsconfig.node.json` `include` array only has `"vite.config.ts"`:

```json
"include": ["vite.config.ts"]
```

`vitest.config.ts` is not covered by any tsconfig `include` glob. Running `tsc -b` from the web package won't type-check it. Mitigating factor: nobody edits `vitest.config.ts` often, and `vitest` itself will validate it at runtime. Still, consider adding it or widening the include to `"*.config.ts"`.

### 15. Path alias `@/*` is dead config in `packages/backend/tsconfig.json`

The staged migration converted all `@/*` imports to relative imports:

- `@/lib/Logger` → `../lib/Logger`
- `@/features/todos/TodosService` → `../features/todos/TodosService`
- `@/lib/honoJsApiErrorHandler` → `../lib/honoJsApiErrorHandler`
- `@/lib/serveStaticAssets` → `../lib/serveStaticAssets`
- `@/lib/HttpErrorMetadata` → `../../../lib/HttpErrorMetadata`

But `tsconfig.json` still declares `"@/*": ["./src/*"]` in `paths`. Since no source file uses `@/*` anymore, this is dead config. It doesn't break anything, but it's misleading. Either remove it or decide whether path aliases are the preferred import style and revert the relative imports.

The web package uses `@/*` alias in `tsconfig.app.json` lines 19-21 — this is a live mapping used by the React app. The backend's dead `@/*` config could confuse readers into thinking both packages use the same convention.

### 16. `serveStaticAssets.ts` reads from disk on every request with no caching

Beyond the event-loop blocking issue (point 3), `readFileSync` is called on every HTTP request with no in-memory cache. The old `Bun.file()` returned a lazy blob that could leverage OS page cache and didn't require explicit caching. This means every static asset request will do a physical disk read. Under any non-trivial load, this will become a bottleneck.

Suggested alternatives for follow-up:

- Cache file contents in a `Map` with TTL (the `Cache` class already exists in the backend).
- Use `node:fs/promises` with `Readable.toWeb()` for streaming.
- Use Hono's built-in `serveStatic` middleware from `hono/middleware` which handles this correctly.

### 17. Deleted `bunfig.toml` handled test preloading

The deleted `bunfig.toml` contained:

```toml
[test]
preload = ["./src/test/utils/setup.ts"]
```

With `bun:test`, this auto-ran setup before every test file. The replacement using `node --import tsx/esm --test` has no equivalent preload mechanism. Currently `setup.ts` is deleted, but if the project ever needs test-wide preloading in the future, it would need to be handled differently (e.g., `--require` flag, or manual imports at the top of each test file).

### 18. `build.ts` files removed — tradeoffs

Both `packages/backend/build.ts` and `packages/common/build.ts` were deleted. These scripts used `Bun.build()` to programmatically:

- Read `package.json` to determine external dependencies dynamically
- Compose the build pipeline

The replacements use inline esbuild CLI invocations in `package.json` scripts with hardcoded flags (`--external:valibot`). This is simpler and more transparent, but means adding a new dependency that should be marked as external requires editing the build script string in `package.json` rather than it being automatically derived from `package.json`'s `dependencies` field.

### 19. No `Content-Type` header set in `serveStaticAssets`

The `new Response(readFileSync(filePath))` call doesn't set a `Content-Type` header. `Bun.file()` automatically inferred MIME types from file extensions. The `Response` constructor with a plain string body defaults to `text/plain;charset=UTF-8`. This means:

- CSS files will be served as `text/plain`
- JS files will be served as `text/plain`
- Images will be broken

This is a **functional regression** for any deployment that uses `serveStaticAssets` (i.e., production mode). The MIME type should be set based on file extension, using a package like `mime-types` or a simple mapping. The `AGENTS.md` says this handler is used for production static asset serving, so this is more than cosmetic.

### 20. Docker `CMD` simplification

Old: `CMD ["bun", "--sql-preconnect", "run", "main.js"]`
New: `CMD ["node", "main.js"]`

The `--sql-preconnect` flag in Bun eagerly established a connection pool. The `postgres` npm package handles connection pooling lazily by default. This is a semantic difference: with Bun, the DB connection was opened at startup (fail-fast); with `postgres`, it opens on first query. If the DB is unreachable, the app will start successfully and only fail on the first request. Consider adding a startup health check or a manual `sql` connection test in `main.ts`.

### 21. `@types/node` missing from LSP resolution (transient)

The LSP reports errors for `node:test`, `node:assert/strict`, and `vitest/config` — these are because `pnpm install` hasn't been run since the `package.json` changes. After `pnpm install`, these should resolve. Not a code issue, but worth noting that the dev workflow requires a fresh install.

### 22. `mapOptional.test.ts` location

Tests live at `packages/common/src/utils/mapOptional.test.ts` — co-located with the source. The backend uses `src/shared/tests/Cache.test.ts` — a separate `tests/` directory. The web package puts tests in `src/components/Counter.test.tsx` — co-located. Three different test location conventions across three packages. Not a bug, but inconsistent.

### 23. `experimentalDecorators` only in build tsconfig

The `tsconfig.build.json` exists solely to enable `experimentalDecorators` for the esbuild step. The base `tsconfig.json` does not enable them, which means `tsc --noEmit` type-checks without decorator support. This works because:

- `@injectable()` and `@inject()` are just function calls at the type level — they don't affect type-checking
- esbuild reads `tsconfig.build.json` for the transform step and emits correct decorator code

This is a deliberate, clever separation. But it creates a hidden coupling: if someone adds a decorator that DOES affect types (like `@HttpError` from `HttpErrorMetadata.ts`), `tsc` won't error, but esbuild will transform it differently depending on the tsconfig. The `@HttpError` decorator at `packages/backend/src/features/todos/error/todosErrors.ts` is a class decorator — it does affect emit. TSC without `experimentalDecorators` will leave `@HttpError` as-is in emit, but since this project uses `noEmit: true`, there's no emit. At runtime, `tsx` handles decorators. This works, but the pattern is fragile.