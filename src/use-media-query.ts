/**
 * @description Live media-query subscription — for branching rendering or
 * behaviour on a breakpoint (or any media feature) in JS, which CSS alone
 * cannot do.
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
