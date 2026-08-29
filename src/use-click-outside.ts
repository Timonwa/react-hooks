/**
 * @description Fires a callback when a mousedown lands outside the given ref(s).
 * Accepts a single ref, an array of refs, or a record of refs — the callback
 * fires only when the click is outside all of them.
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
    (event: MouseEvent) => {
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

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [enabled, handleClickOutside]);
}
