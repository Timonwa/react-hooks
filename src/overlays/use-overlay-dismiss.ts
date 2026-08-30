/**
 * @description The modal-overlay shell: Escape-to-dismiss, scroll lock, focus
 * handling. For any surface that takes over the page — not for non-modal
 * popups (dropdowns, tooltips, popovers), where use-click-outside fits.
 */

"use client";

import { type RefObject, useEffect, useRef } from "react";

// What the trap and the initial focus consider focusable. Deliberately the
// practical subset — not a full tabbability engine.
const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * The behaviours every modal overlay shares — dialogs, drawers, bottom sheets,
 * command palettes, lightboxes, full-screen nav: Escape-to-dismiss, body
 * scroll-lock while open, and focus handling — moves focus into the panel
 * (preferring an explicit `[data-autofocus]` target), traps Tab / Shift+Tab
 * inside it while open (the WAI-ARIA dialog pattern), and restores focus on
 * close.
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
        return;
      }

      // Trap Tab inside the panel: cycle from the last focusable back to the
      // first (and the reverse for Shift+Tab), and pull focus back in when it
      // has escaped to the page behind.
      if (event.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        );
        if (focusables.length === 0) {
          event.preventDefault();
          panel.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        const active = document.activeElement;
        if (event.shiftKey) {
          if (active === first || !panel.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else if (active === last || !panel.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Prefer an explicit [data-autofocus] target, else the first focusable.
    // Two queries, not one comma-joined selector — querySelector returns the
    // first match in DOCUMENT order, which would ignore the preference.
    const panel = panelRef.current;
    const focusTarget =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
      panel;
    focusTarget?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, panelRef]);
}
