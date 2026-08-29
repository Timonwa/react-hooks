/**
 * @description The user's reduced-motion preference, live.
 */

"use client";

import { useMediaQuery } from "./use-media-query";

/**
 * Whether the user prefers reduced motion. A CSS catch-all covers declarative
 * animation, but JS-driven motion — `scrollIntoView({ behavior: "smooth" })`,
 * canvas, springs — overrides it and must be gated in code (WCAG 2.3.3).
 * SSR-safe: `false` on the server, corrected on the client.
 *
 * @example const skipAnimation = usePrefersReducedMotion();
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
