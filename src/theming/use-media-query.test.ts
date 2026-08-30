import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
// @ts-expect-error — @types/react-dom isn't a dependency; typed locally below.
import { renderToString as renderToStringUntyped } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { mockMatchMedia } from "../_test-helpers.js";
import { useMediaQuery } from "../index.js";

const renderToString = renderToStringUntyped as (node: ReactNode) => string;

describe("useMediaQuery", () => {
  it("reports whether the query matches", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(min-width: 960px)"));
    expect(result.current).toBe(true);
  });

  it("updates live when the query result changes", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 960px)"));
    expect(result.current).toBe(false);

    act(() => media.setMatches(true));
    expect(result.current).toBe(true);
  });

  it("re-evaluates when the query string changes", () => {
    // Per-query results, so the two queries genuinely differ.
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 960px)",
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { result, rerender } = renderHook(({ q }) => useMediaQuery(q), {
      initialProps: { q: "(min-width: 960px)" },
    });
    expect(result.current).toBe(true);

    rerender({ q: "(min-width: 1280px)" });
    expect(result.current).toBe(false);
  });

  it("SSR-renders false even when the client query would match", () => {
    mockMatchMedia(true);
    const Probe = () =>
      createElement("span", null, String(useMediaQuery("(min-width: 960px)")));
    // renderToString takes the server-snapshot path of useSyncExternalStore.
    expect(renderToString(createElement(Probe))).toContain("false");
  });

  it("unsubscribes on unmount", () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 960px)"));
    expect(media.listeners.size).toBe(1);
    unmount();
    expect(media.listeners.size).toBe(0);
  });
});
