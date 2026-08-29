import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    // jsdom exposes localStorage only on non-opaque origins — the default
    // about:blank has none.
    environmentOptions: { jsdom: { url: "http://localhost/" } },
    coverage: { include: ["src/**/*.{ts,tsx}"], exclude: ["src/**/index.ts"] },
  },
});
