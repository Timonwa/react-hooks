/**
 * @description The modal-overlay shell: Escape-to-dismiss, scroll lock, focus
 * handling. For any surface that takes over the page — not for non-modal
 * popups (dropdowns, tooltips, popovers), where use-click-outside fits.
 */

"use client";

import { type RefObject, useEffect, useRef } from "react";

/**
 * The behaviours every modal overlay shares — dialogs, drawers, bottom sheets,
 * command palettes, lightboxes, full-screen nav: Escape-to-dismiss, body
 * scroll-lock while open, and focus handling — moves focus into the panel
 * (preferring an explicit `[data-autofocus]` target) and restores it on close.
 *
 * Use it for surfaces that take over the page and block interaction behind
 * them; those behaviours are what make a modal accessible, so none are
 * optional. Do not use it for non-modal floating UI (dropdowns, tooltips,
 * popovers) — the page behind those stays interactive, so scroll-locking it or
 * moving focus would be a bug; reach for `useClickOutside` there instead.
 * Click-outside is deliberately not included here — modals vary on
 * backdrop-click behaviour, so that stays with each overlay's own backdrop.
 * Pair with `useMountTransition` when the overlay animates in and out.
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
