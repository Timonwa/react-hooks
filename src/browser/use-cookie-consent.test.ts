import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  type CookieConsentAdapter,
  createVanillaCookieConsentAdapter,
  useCookieConsent,
} from "../index.js";

describe("useCookieConsent", () => {
  function makeAdapter(accepted: Record<string, boolean | null>) {
    const listeners = new Set<() => void>();
    const adapter: CookieConsentAdapter = {
      readCategory: (category) => accepted[category] ?? null,
      subscribe: (onChange) => {
        listeners.add(onChange);
        return () => listeners.delete(onChange);
      },
    };
    const notify = () => {
      for (const listener of listeners) listener();
    };
    return { adapter, notify };
  }

  it("returns caller-defined categories, null before the CMP answers, live after", () => {
    const accepted: Record<string, boolean | null> = { analytics: null, marketing: null };
    const { adapter, notify } = makeAdapter(accepted);
    const { result } = renderHook(() =>
      useCookieConsent(["analytics", "marketing"], adapter),
    );
    expect(result.current).toEqual({ analytics: null, marketing: null });

    accepted.analytics = true;
    accepted.marketing = false;
    act(() => notify());
    expect(result.current).toEqual({ analytics: true, marketing: false });
  });

  it("the default adapter reads the vanilla-cookieconsent global and its events", () => {
    (window as { CookieConsent?: unknown }).CookieConsent = {
      acceptedCategory: (c: string) => c === "necessary",
    };
    const { result, unmount } = renderHook(() =>
      useCookieConsent(["necessary", "analytics"]),
    );
    expect(result.current).toEqual({ necessary: true, analytics: false });

    (window as { CookieConsent?: unknown }).CookieConsent = {
      acceptedCategory: () => true,
    };
    act(() => void window.dispatchEvent(new Event("cc:onChange")));
    expect(result.current).toEqual({ necessary: true, analytics: true });

    unmount();
    delete (window as { CookieConsent?: unknown }).CookieConsent;
  });

  it("the default adapter degrades to null when no CMP global exists", () => {
    delete (window as { CookieConsent?: unknown }).CookieConsent;
    const { result } = renderHook(() => useCookieConsent(["analytics", "marketing"]));
    expect(result.current).toEqual({ analytics: null, marketing: null });
  });

  it("re-hydrates when the category list changes", () => {
    const accepted: Record<string, boolean | null> = {
      analytics: true,
      marketing: false,
    };
    const { adapter } = makeAdapter(accepted);
    const { result, rerender } = renderHook(
      ({ cats }) => useCookieConsent(cats, adapter),
      { initialProps: { cats: ["analytics"] } },
    );
    expect(result.current).toEqual({ analytics: true });

    rerender({ cats: ["analytics", "marketing"] });
    expect(result.current).toEqual({ analytics: true, marketing: false });
  });

  it("reads a passed vanilla-cookieconsent instance (the ESM build path)", () => {
    delete (window as { CookieConsent?: unknown }).CookieConsent;
    let analyticsAccepted = false;
    const instance = {
      acceptedCategory: (c: string) => c === "analytics" && analyticsAccepted,
    };
    const adapter = createVanillaCookieConsentAdapter(instance);
    const { result } = renderHook(() => useCookieConsent(["analytics"], adapter));
    expect(result.current).toEqual({ analytics: false });

    // The adapter also listens on document — some builds dispatch there.
    analyticsAccepted = true;
    act(() => void document.dispatchEvent(new Event("cc:onConsent")));
    expect(result.current).toEqual({ analytics: true });
  });

  it("re-wires the subscription when the adapter identity changes", () => {
    const firstUnsub = vi.fn();
    const firstAdapter: CookieConsentAdapter = {
      readCategory: () => false,
      subscribe: () => firstUnsub,
    };
    const second = makeAdapter({ analytics: true });
    const { result, rerender } = renderHook(
      ({ adapter }) => useCookieConsent(["analytics"], adapter),
      { initialProps: { adapter: firstAdapter } },
    );
    expect(result.current).toEqual({ analytics: false });

    rerender({ adapter: second.adapter });
    expect(firstUnsub).toHaveBeenCalledTimes(1); // old adapter released
    expect(result.current).toEqual({ analytics: true }); // re-read through the new one

    // The new subscription is live too.
    act(() => second.notify());
    expect(result.current).toEqual({ analytics: true });
  });

  it("unsubscribes from the adapter on unmount", () => {
    const unsubscribe = vi.fn();
    const adapter: CookieConsentAdapter = {
      readCategory: () => true,
      subscribe: () => unsubscribe,
    };
    const { unmount } = renderHook(() => useCookieConsent(["analytics"], adapter));
    expect(unsubscribe).not.toHaveBeenCalled();
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
