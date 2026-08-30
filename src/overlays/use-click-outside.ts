/**
 * @description Fires a callback when a pointer press (mouse, touch, or pen)
 * lands outside the given ref(s). Accepts a single ref, an array of refs, or a
 * record of refs — the callback fires only when the press is outside all of
 * them, which is what a menu plus its trigger button needs.
 *
 * This is the dismissal for non-modal floating UI — dropdowns, popovers,
 * tooltips, comboboxes — where the page behind stays interactive. Modal
 * surfaces (dialogs, drawers, bottom sheets) should use `useOverlayDismiss`
 * for Escape/scroll-lock/focus and handle clicks on their own backdrop.
 *
 * @param options.refs - Element ref(s) to detect clicks outside of
 * @param options.enabled - Whether the listener is active (default: true)
 * @param options.onClickOutside - Fires when a click lands outside all refs
 *
 * @example
 * const menuRef = useRef<HTMLDivElement>(null);
 * useClickOutside({
 *   refs: [menuRef, buttonRef],
 *   enabled: isOpen,
 *   onClickOutside: () => setIsOpen(false),
 * });
 */

"use client";

import { type RefObject, useCallback, useEffect } from "react";

type ElementRefType = RefObject<HTMLElement | null>;
type RefType = ElementRefType | ElementRefType[] | Record<string, ElementRefType>;

interface UseClickOutsideOptionsProps {
  enabled?: boolean;
  refs: RefType;
  onClickOutside: () => void;
}

export function useClickOutside({
  enabled = true,
  refs,
  onClickOutside,
}: UseClickOutsideOptionsProps): void {
  const handleClickOutside = useCallback(
    (event: PointerEvent) => {
      if (!enabled) return;

      const target = event.target as Node;

      if ("current" in refs && !Array.isArray(refs)) {
        const singleRef = refs as ElementRefType;
        if (singleRef.current && !singleRef.current.contains(target)) {
          onClickOutside();
        }
        return;
      }

      if (Array.isArray(refs)) {
        const isOutside = refs.every(
          (ref) => !ref.current || !ref.current.contains(target),
        );
        if (isOutside) {
          onClickOutside();
        }
        return;
      }

      const refValues = Object.values(refs);
      const isOutside = refValues.every(
        (ref) => !ref.current || !ref.current.contains(target),
      );
      if (isOutside) {
        onClickOutside();
      }
    },
    [enabled, refs, onClickOutside],
  );

  useEffect(() => {
    if (!enabled) return;

    // pointerdown covers mouse, touch, and pen with a single listener.
    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [enabled, handleClickOutside]);
}
