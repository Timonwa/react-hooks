/**
 * @description Scrolls a form back into view and surfaces the first leaf error
 * message when submit-time validation fails. Wire `ref` to the scrollable
 * container (usually the form element itself) and pass `onInvalid` to your form
 * library's invalid-submit callback — it matches the shape of react-hook-form's
 * `handleSubmit(onValid, onInvalid)` second argument, but any nested errors
 * object works. The optional `onError` callback receives the first nested error
 * message — surface it in a top-of-form alert if you have one, otherwise rely
 * on inline field errors becoming visible as the form scrolls. The second
 * argument forwards `useScrollIntoView` options (`offset`, `block`, `behavior`)
 * for when the top of the form isn't the right landing position.
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
import { type UseScrollIntoViewOptions, useScrollIntoView } from "./use-scroll-into-view";

// Minimal ambient declaration — the package targets the DOM and doesn't pull in
// @types/node; bundlers still statically replace `process.env.NODE_ENV`.
declare const process: { env: { NODE_ENV?: string } } | undefined;

export function useFormErrorScroll<T extends HTMLElement = HTMLElement>(
  onError?: (firstMessage: string | undefined) => void,
  scrollOptions?: UseScrollIntoViewOptions,
) {
  const { ref, scrollIntoView } = useScrollIntoView<T>(scrollOptions);

  const onInvalid = useCallback(
    (errors: unknown) => {
      // Surface the raw error tree in dev (bundlers inline NODE_ENV, so the
      // branch is dropped from production builds). Helps diagnose nested
      // errors the user can't see, e.g. a leaf field hidden by conditional UI.
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        console.error("Form validation errors:", errors);
      }
      onError?.(findFirstErrorMessage(errors));
      scrollIntoView();
    },
    [scrollIntoView, onError],
  );

  return { ref, scrollIntoView, onInvalid };
}
