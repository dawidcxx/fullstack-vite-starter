import { $ } from "bun";

await Bun.build({
  entrypoints: ["./src/main.ts"],
  outdir: "./dist",
  target: "bun",
  sourcemap: "external",
});
await $`cp -r ./src/shared/migrations/sql ./dist/sql`;
await $`cp -r ../web/dist ./dist/public`.nothrow();
