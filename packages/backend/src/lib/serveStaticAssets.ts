import { existsSync, readdirSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { invariant, pages } from "@the_application_name/common";
import { createMiddleware } from "hono/factory";

export const serveStaticAssets = (absoluteStaticAssetsPath: string) => {
  invariant(
    isAbsolute(absoluteStaticAssetsPath),
    "serveStaticAssets: absoluteStaticAssetsPath must be an absolute path",
  );
  const pageEntries = Object.entries(pages);
  const indexHtmlPath = resolve(absoluteStaticAssetsPath, pages["/"]);
  const isBuilt = existsSync(indexHtmlPath);

  if (!isBuilt) {
    const pageRoutes = new Set(pageEntries.map(([route]) => normalizeRoutePath(route)));

    return createMiddleware(async (ctx, next) => {
      if (
        (ctx.req.method === "GET" || ctx.req.method === "HEAD") &&
        pageRoutes.has(normalizeRoutePath(ctx.req.path))
      ) {
        return ctx.text("Missing frontend assets", 404);
      }
      return next();
    });
  }

  const assetLookupMap = new Map<string, string>();

  for (const [route, htmlFileName] of pageEntries) {
    const normalizedRoute = normalizeRoutePath(route);
    const htmlFilePath = resolve(absoluteStaticAssetsPath, htmlFileName);

    assetLookupMap.set(normalizedRoute, htmlFilePath);

    if (normalizedRoute !== "/") {
      assetLookupMap.set(`${normalizedRoute}/`, htmlFilePath);
    }
  }

  collectStaticAssets(absoluteStaticAssetsPath, assetLookupMap);

  const pagePrefixEntries = pageEntries
    .filter(([route]) => route !== "/")
    .map(
      ([route, htmlFileName]) => [route, resolve(absoluteStaticAssetsPath, htmlFileName)] as const,
    );

  return createMiddleware(async (ctx, next) => {
    if (ctx.req.path.startsWith("/api")) return next();
    if (ctx.req.method !== "GET" && ctx.req.method !== "HEAD") return next();

    const filePath =
      assetLookupMap.get(ctx.req.path) ?? assetLookupMap.get(normalizeRoutePath(ctx.req.path));

    if (filePath) {
      return new Response(Bun.file(filePath));
    }

    for (const [prefix, htmlPath] of pagePrefixEntries) {
      if (ctx.req.path.startsWith(`${prefix}/`)) {
        return new Response(Bun.file(htmlPath));
      }
    }

    if (
      ctx.req.path.endsWith(".js") ||
      ctx.req.path.endsWith(".css") ||
      ctx.req.path.endsWith(".map")
    ) {
      return ctx.text("Not Found", 404);
    }

    return new Response(Bun.file(indexHtmlPath));
  });
};

function collectStaticAssets(
  absoluteStaticAssetsPath: string,
  assetLookupMap: Map<string, string> = new Map(),
  dirPath?: string,
) {
  for (const entry of readdirSync(dirPath ?? absoluteStaticAssetsPath, { withFileTypes: true })) {
    const fullPath = resolve(dirPath ?? absoluteStaticAssetsPath, entry.name);
    if (entry.isDirectory()) {
      collectStaticAssets(absoluteStaticAssetsPath, assetLookupMap, fullPath);
      continue;
    }
    const requestPath = `/${fullPath
      .slice(absoluteStaticAssetsPath.length)
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")}`;
    assetLookupMap.set(requestPath, fullPath);
  }
}

function normalizeRoutePath(path: string) {
  if (path === "/") return path;

  const normalizedPath = path.replace(/\/+$/, "");
  return normalizedPath === "" ? "/" : normalizedPath;
}