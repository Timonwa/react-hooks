import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
  target: "es2022",
  // Every hook here is client-side; without this banner a Next.js consumer
  // importing from a Server Component gets a cryptic hooks error instead of
  // the framework's clear "use client" guidance.
  banner: { js: '"use client";' },
  external: ["react", "@timonwa/app-utilities"],
});
