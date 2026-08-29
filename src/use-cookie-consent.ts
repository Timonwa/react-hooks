/**
 * @description Reactive hook for reading cookie consent state.
 *
 * Reads the initial consent state from the vanilla-cookieconsent instance (if
 * present) and subscribes to `cc:onConsent` / `cc:onChange` browser events so
 * the returned state updates whenever the user changes their preferences — no
 * polling, no storage reads after mount.
 *
 * Returns `null` for all categories until the consent banner has been
 * initialised (i.e. on first paint before vanilla-cookieconsent loads). This
 * lets callers distinguish "not yet decided" from an explicit rejection.
 *
 * @example
 * const { analytics } = useCookieConsent();
 * if (analytics) initPostHog();
 */

"use client";

import { useEffect, useState } from "react";

export interface CookieConsentStateProps {
  necessary: boolean | null;
  analytics: boolean | null;
  marketing: boolean | null;
}

const DEFAULT_STATE: CookieConsentStateProps = {
  necessary: null,
  analytics: null,
  marketing: null,
};

/** Read the current accepted categories from the vanilla-cookieconsent global. */
function readConsent(): CookieConsentStateProps {
  if (typeof window === "undefined") return DEFAULT_STATE;

  // vanilla-cookieconsent exposes a global `CookieConsent` object after `run()`.
  const cc = (
    window as unknown as { CookieConsent?: { acceptedCategory: (c: string) => boolean } }
  ).CookieConsent;

  if (!cc) return DEFAULT_STATE;

  return {
    necessary: cc.acceptedCategory("necessary"),
    analytics: cc.acceptedCategory("analytics"),
    marketing: cc.acceptedCategory("marketing"),
  };
}

export function useCookieConsent(): CookieConsentStateProps {
  const [consent, setConsent] = useState<CookieConsentStateProps>(DEFAULT_STATE);

  useEffect(() => {
    // Hydrate immediately in case cookieconsent already ran before this component mounted.
    setConsent(readConsent());

    function handleChange() {
      setConsent(readConsent());
    }

    // vanilla-cookieconsent fires these custom events on the document.
    document.addEventListener("cc:onConsent", handleChange);
    document.addEventListener("cc:onChange", handleChange);

    return () => {
      document.removeEventListener("cc:onConsent", handleChange);
      document.removeEventListener("cc:onChange", handleChange);
    };
  }, []);

  return consent;
}
