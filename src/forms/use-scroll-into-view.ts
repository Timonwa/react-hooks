/**
 * @description Returns `{ ref, scrollIntoView }` for smoothly scrolling the ref
 * element into view on demand — e.g. bringing a form's error alert into view
 * after a failed submit, or centring the active item in a long list.
 *
 * @param options.offset - Breathing room around the element in pixels, applied
 * as scroll-margin (default: 24)
 * @param options.block - Where the element lands in the viewport: "start",
 * "center", "end", or "nearest" (default: "start")
 * @param options.behavior - "smooth" or "auto"; smooth is automatically
 * downgraded to auto when the user prefers reduced motion (default: "smooth")
 * @returns `{ ref, scrollIntoView }` — attach `ref` to the target, call `scrollIntoView()` to scroll
 *
 * @example
 * const { ref, scrollIntoView } = useScrollIntoView<HTMLFormElement>();
 * useEffect(() => { if (hasErrors) scrollIntoView(); }, [hasErrors]);
 * return <form ref={ref}>...</form>;
 */

"use client";

import { useCallback, useRef } from "react";

export interface UseScrollIntoViewOptions {
  offset?: number;
  block?: ScrollLogicalPosition;
  behavior?: ScrollBehavior;
}

export function useScrollIntoView<T extends HTMLElement = HTMLElement>({
  offset = 24,
  block = "start",
  behavior = "smooth",
}: UseScrollIntoViewOptions = {}) {
  const ref = useRef<T>(null);

  const scrollIntoView = useCallback(() => {
    // Defer until after the next paint so newly rendered content
    // (e.g. error alerts) is in the DOM before we measure scroll position.
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;

      // JS-driven smooth scrolling bypasses CSS reduced-motion rules, so gate
      // it here (WCAG 2.3.3).
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      el.style.scrollMargin = `${offset}px`;
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : behavior, block });
    });
  }, [offset, block, behavior]);

  return { ref, scrollIntoView };
}
