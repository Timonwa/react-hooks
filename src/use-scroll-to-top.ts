/**
 * @description Returns `{ ref, scrollToTop }` for smoothly scrolling the ref
 * element into view with a top offset. Use for scrolling forms back to the
 * top after a submit error so the error alert is visible.
 *
 * @param offset - Extra space above the element in pixels (default: 24)
 * @returns `{ ref, scrollToTop }` — attach `ref` to the target, call `scrollToTop()` to scroll
 *
 * @example
 * const { ref, scrollToTop } = useScrollToTop<HTMLFormElement>();
 * useEffect(() => { if (hasErrors) scrollToTop(); }, [hasErrors]);
 * return <form ref={ref}>...</form>;
 */

"use client";

import { useCallback, useRef } from "react";

const DEFAULT_OFFSET = 24;

export function useScrollToTop<T extends HTMLElement = HTMLElement>(
  offset = DEFAULT_OFFSET,
) {
  const ref = useRef<T>(null);

  const scrollToTop = useCallback(() => {
    // Defer until after the next paint so newly rendered content
    // (e.g. error alerts) is in the DOM before we measure scroll position.
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;

      el.style.scrollMarginTop = `${offset}px`;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [offset]);

  return { ref, scrollToTop };
}
