/**
 * @description Media-query subscription — the only way to branch on a
 * breakpoint in JS, since a class cannot toggle logic.
 */

"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a media query currently matches, updating live. SSR-safe: the server
 * snapshot is `false`, so first paint matches hydration.
 *
 * @example const isDesktop = useMediaQuery("(min-width: 960px)");
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onStoreChange);
      return () => mediaQueryList.removeEventListener("change", onStoreChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
