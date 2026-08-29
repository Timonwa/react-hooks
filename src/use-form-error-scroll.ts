/**
 * @description Pairs `useScrollToTop` with first-leaf-error extraction for
 * react-hook-form. Wire `ref` to the scrollable container (usually the form
 * element or the SidePanel body) and pass `onInvalid` as RHF's
 * `handleSubmit(onValid, onInvalid)` second argument. The optional `onError`
 * callback receives the first nested error message — surface it in a top
 * Alert if your form has one, otherwise rely on inline field errors becoming
 * visible as the page scrolls.
 *
 * @example
 * // form with top apiError Alert
 * const { ref, onInvalid } = useFormErrorScroll<HTMLFormElement>(
 *   (firstMessage) => setApiError(firstMessage ?? "Please fill in all required fields.")
 * );
 * return <form ref={ref} onSubmit={handleSubmit(onValid, onInvalid)}>…</form>;
 *
 * @example
 * // form without a top alert — just scroll so red inline errors come into view
 * const { ref, onInvalid } = useFormErrorScroll<HTMLFormElement>();
 * return <form ref={ref} onSubmit={handleSubmit(onValid, onInvalid)}>…</form>;
 */

"use client";

import { findFirstErrorMessage } from "@timonwa/app-utilities";
import { useCallback } from "react";
import { useScrollToTop } from "./use-scroll-to-top";

export function useFormErrorScroll<T extends HTMLElement = HTMLElement>(
  onError?: (firstMessage: string | undefined) => void,
) {
  const { ref, scrollToTop } = useScrollToTop<T>();

  const onInvalid = useCallback(
    (errors: unknown) => {
      // Surface the raw error tree in dev (Next inlines this branch and drops
      // it in production). Helps diagnose nested RHF errors that the user
      // can't see, especially when a leaf field is hidden by conditional UI.
      if (typeof window !== "undefined" && window.location?.hostname === "localhost") {
        console.error("Form validation errors:", errors);
      }
      onError?.(findFirstErrorMessage(errors));
      scrollToTop();
    },
    [scrollToTop, onError],
  );

  return { ref, scrollToTop, onInvalid };
}
