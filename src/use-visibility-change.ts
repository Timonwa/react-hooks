/**
 * @description Tracks browser tab visibility via the Page Visibility API.
 * Use this to refetch on tab focus instead of polling on a timer.
 *
 * @param options.enabled - Whether the listener is active (default: true)
 * @param options.onVisible - Fires when the tab becomes visible (user switched back)
 * @param options.onHidden - Fires when the tab becomes hidden (user switched away)
 *
 * @example
 * useVisibilityChange({
 *   onVisible: () => refetchNotifications(),
 * });
 */

"use client";

import { useEffect } from "react";

interface UseVisibilityChangeOptionsProps {
  enabled?: boolean;
  onVisible?: () => void;
  onHidden?: () => void;
}

export function useVisibilityChange({
  enabled = true,
  onVisible,
  onHidden,
}: UseVisibilityChangeOptionsProps): void {
  useEffect(() => {
    if (!enabled) return;
    if (typeof document === "undefined") return;

    const handleChange = () => {
      if (document.visibilityState === "visible") {
        onVisible?.();
      } else {
        onHidden?.();
      }
    };

    document.addEventListener("visibilitychange", handleChange);
    return () => document.removeEventListener("visibilitychange", handleChange);
  }, [enabled, onVisible, onHidden]);
}
