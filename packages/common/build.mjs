import { build } from "esbuild";
import { readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("./package.json", "utf8"));

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

await build({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  platform: "browser",
  outdir: "./dist",
  format: "esm",
  external,
});