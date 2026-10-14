import { $ } from "bun";

await Bun.build({
  entrypoints: ["./src/main.ts"],
  outdir: "./dist",
  target: "node",
  sourcemap: "external",
});
await $`cp -r ./src/shared/migrations/sql ./dist/sql`;
await $`cp -r ../web/dist ./dist/public`.nothrow();