/**
 * @description The modal-overlay shell: Escape-to-dismiss, scroll lock, focus
 * handling.
 */

"use client";

import { type RefObject, useEffect, useRef } from "react";

/**
 * The overlay behaviours drawers and dialogs share: Escape-to-dismiss, body
 * scroll-lock while open, and focus handling — moves focus into the panel
 * (preferring an explicit `[data-autofocus]` target) and restores it on close.
 * Click-outside stays with each overlay's own backdrop.
 *
 * @example useOverlayDismiss({ open, onDismiss: close, panelRef });
 */
export function useOverlayDismiss({
  open,
  onDismiss,
  panelRef,
}: {
  open: boolean;
  onDismiss: () => void;
  panelRef: RefObject<HTMLElement | null>;
}) {
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onDismissRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Prefer an explicit [data-autofocus] target, else the first focusable.
    const focusTarget =
      panelRef.current?.querySelector<HTMLElement>(
        "[data-autofocus], input, button, textarea, select, [tabindex]:not([tabindex='-1'])",
      ) ?? panelRef.current;
    focusTarget?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, panelRef]);
}
