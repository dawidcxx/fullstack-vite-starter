// scripts/build.mjs
import { build } from "esbuild";
import { cp } from "node:fs/promises";


console.log("Building with esbuild...");
await build({
  entryPoints: ["./src/main.ts"],
  bundle: true,
  platform: "node",
  outdir: "./dist",
  sourcemap: true,
  format: "esm",
  tsconfig: "./tsconfig.build.json",
});

console.log("Copying migrations...");
await cp("./src/shared/migrations/sql", "./dist/sql", {
  recursive: true,
});

console.log("Copying web assets...");
await cp("../web/dist", "./dist/public", {
  recursive: true,
});

console.log("Build complete.");