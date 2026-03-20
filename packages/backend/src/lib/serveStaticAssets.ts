import { existsSync, readdirSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { invariant } from "@the_application_name/common";
import { createMiddleware } from "hono/factory";

export const serveStaticAssets = (absoluteStaticAssetsPath: string) => {
  invariant(
    isAbsolute(absoluteStaticAssetsPath),
    "serveStaticAssets: absoluteStaticAssetsPath must be an absolute path",
  );
  const isBuilt = existsSync(resolve(absoluteStaticAssetsPath, "index.html"));

  if (!isBuilt) {
    return createMiddleware(async (ctx, next) => {
      if (ctx.req.path === "/" && ctx.req.method === "GET") {
        return ctx.text("Missing frontend assets", 404);
      }
      return next();
    });
  }

  const assetLookupMap = new Map<string, string>();

  const indexHtmlPath = resolve(absoluteStaticAssetsPath, "index.html");
  assetLookupMap.set("/index.html", indexHtmlPath);
  assetLookupMap.set("/", indexHtmlPath);
  collectStaticAssets(absoluteStaticAssetsPath, assetLookupMap);

  return createMiddleware(async (ctx, next) => {
    if (ctx.req.path.startsWith("/api")) return next();
    if (ctx.req.method !== "GET" && ctx.req.method !== "HEAD") return next();

    const filePath = assetLookupMap.get(ctx.req.path);

    if (filePath) {
      return new Response(Bun.file(filePath));
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