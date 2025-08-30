import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  external: ["keyv", "node:sqlite"],
  dts: true,
  minify: true,
  treeshake: true,
  clean: true,
});
