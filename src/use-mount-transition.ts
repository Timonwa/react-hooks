/**
 * @description Enter/exit CSS transitions for mount/unmount components.
 */

"use client";

import { type TransitionEvent, useEffect, useState } from "react";

/**
 * Drives an enter/exit CSS transition for a component that mounts and unmounts
 * with `open`. Returns `mounted` (whether to render at all) and `shown` (whether
 * to apply the open-position classes); keep the element mounted until
 * `handleTransitionEnd` fires after the exit — drawers, dialogs, toasts.
 *
 * @example const { mounted, shown, handleTransitionEnd } = useMountTransition(open);
 */
export function useMountTransition(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  // Adjust state during render (not in effects, to avoid cascade warnings):
  // mount when opening, begin the exit when closing.
  if (open && !mounted) setMounted(true);
  if (!open && shown) setShown(false);

  // One frame after mounting, flip to the open position so it transitions in.
  useEffect(() => {
    if (mounted && open) {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [mounted, open]);

  // Unmount only after the element's own exit transition finishes (ignore
  // transitions bubbling up from children).
  const handleTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.target === event.currentTarget && !open) setMounted(false);
  };

  return { mounted, shown, handleTransitionEnd };
}
