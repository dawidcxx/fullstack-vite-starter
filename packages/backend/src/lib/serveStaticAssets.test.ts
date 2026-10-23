import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { CONFIG_PRELUDE_PLACEHOLDER } from "@the_application_name/common";
import { Hono } from "hono";
import { serveStaticAssets } from "@/lib/serveStaticAssets";

describe("serveStaticAssets (built dist)", () => {
  let dist: BuiltDist;
  let app: Hono;

  beforeAll(() => {
    dist = createBuiltDist();
    app = buildApp(dist.path);
  });

  afterAll(() => dist.dispose());

  it("serves the root SPA with no-cache", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("ROOT_INDEX");
    expect(res.headers.get("content-type")).toBe("text/html");
    expect(res.headers.get("cache-control")).toBe("no-cache");
  });

  it("injects all VITE_ config into page HTML", async () => {
    const root = await app.request("/");
    const rootHtml = await root.text();
    expect(rootHtml).toContain('"VITE_EXAMPLE":"example-value"');
    expect(rootHtml).toContain('"VITE_OTHER":"other-value"');
    expect(rootHtml).not.toContain(CONFIG_PRELUDE_PLACEHOLDER);

    const design = await app.request("/design");
    expect(await design.text()).toContain('"VITE_EXAMPLE":"example-value"');
  });

  it("serves a page SPA directly and its sub-routes via prefix fallback", async () => {
    const direct = await app.request("/design");
    expect(direct.status).toBe(200);
    expect(await direct.text()).toContain("DESIGN_INDEX");

    const nested = await app.request("/design/components");
    expect(nested.status).toBe(200);
    expect(await nested.text()).toContain("DESIGN_INDEX");
  });

  it("serves hashed assets as immutable with an ETag", async () => {
    const res = await app.request("/assets/app-abc12345.js");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/javascript");
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(res.headers.get("etag")).toMatch(/^".+"$/);
  });

  it("returns 304 when If-None-Match matches the ETag", async () => {
    const first = await app.request("/assets/app-abc12345.js");
    const etag = first.headers.get("etag");
    expect(etag).not.toBeNull();

    const cached = await app.request("/assets/app-abc12345.js", {
      headers: { "if-none-match": etag! },
    });
    expect(cached.status).toBe(304);
    expect(await cached.text()).toBe("");
  });

  it("serves HEAD without a body", async () => {
    const res = await app.request("/assets/app-abc12345.js", { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
    expect(res.headers.get("etag")).not.toBeNull();
  });

  it("serves non-hashed public files with a short cache", async () => {
    const res = await app.request("/favicon.svg");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/svg+xml");
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
  });

  it("404s missing asset-like files", async () => {
    const js = await app.request("/assets/missing.js");
    expect(js.status).toBe(404);

    const css = await app.request("/assets/missing.css");
    expect(css.status).toBe(404);
  });

  it("falls back to the root SPA for unknown non-asset routes", async () => {
    const res = await app.request("/totally/unknown");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("ROOT_INDEX");
  });

  it("passes API requests through to the next handler", async () => {
    const res = await app.request("/api/whatever");
    expect(await res.text()).toBe("NEXT");
  });

  it("hides source maps in production", async () => {
    await withNodeEnv("production", async () => {
      const res = await app.request("/assets/app-abc12345.js.map");
      expect(res.status).toBe(404);
    });
  });

  it("serves source maps outside production", async () => {
    await withNodeEnv(undefined, async () => {
      const res = await app.request("/assets/app-abc12345.js.map");
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/json");
    });
  });
});

describe("serveStaticAssets (missing dist)", () => {
  let app: Hono;

  beforeAll(() => {
    app = buildApp(missingDistPath());
  });

  it("responds with 'Missing frontend assets' for page routes", async () => {
    const root = await app.request("/");
    expect(root.status).toBe(404);
    expect(await root.text()).toBe("Missing frontend assets");

    const design = await app.request("/design");
    expect(design.status).toBe(404);
    expect(await design.text()).toBe("Missing frontend assets");
  });

  it("passes non-page routes through", async () => {
    const res = await app.request("/api/whatever");
    expect(await res.text()).toBe("NEXT");
  });
});

// --- test harness ---

type BuiltDist = {
  path: string;
  dispose: () => void;
};

// Mirrors the layout Vite emits: hashed files under `assets/`, non-hashed public
// files at the root, and one HTML entry per SPA declared in `pages`.
const BUILT_FILES = {
  "index.html": `<!doctype html><title>root</title><script>${CONFIG_PRELUDE_PLACEHOLDER}</script><body>ROOT_INDEX</body>`,
  "design.html": `<!doctype html><title>design</title><script>${CONFIG_PRELUDE_PLACEHOLDER}</script><body>DESIGN_INDEX</body>`,
  "assets/app-abc12345.js": 'console.log("app");',
  "assets/app-abc12345.js.map": '{"version":3}',
  "favicon.svg": '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
} as const;

// Mounts the middleware the same way HttpServer does, with a trailing handler
// so we can prove when the middleware calls `next()`.
function buildApp(distPath: string): Hono {
  const app = new Hono();
  app.get(
    "*",
    serveStaticAssets(distPath, {
      VITE_EXAMPLE: "example-value",
      VITE_OTHER: "other-value",
    }),
  );
  app.get("*", (c) => c.text("NEXT"));
  return app;
}

function createBuiltDist(): BuiltDist {
  const path = mkdtempSync(join(tmpdir(), "serve-static-assets-"));
  for (const [relativePath, content] of Object.entries(BUILT_FILES)) {
    const fullPath = join(path, relativePath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  }
  return {
    path,
    dispose: () => rmSync(path, { recursive: true, force: true }),
  };
}

// An absolute path that is intentionally never created, to exercise the
// "frontend was never built" branch.
function missingDistPath(): string {
  return join(tmpdir(), "serve-static-assets-missing-do-not-create");
}

async function withNodeEnv(value: string | undefined, fn: () => Promise<void>): Promise<void> {
  const previous = process.env["NODE_ENV"];
  if (value === undefined) {
    delete process.env["NODE_ENV"];
  } else {
    process.env["NODE_ENV"] = value;
  }
  try {
    await fn();
  } finally {
    if (previous === undefined) {
      delete process.env["NODE_ENV"];
    } else {
      process.env["NODE_ENV"] = previous;
    }
  }
}