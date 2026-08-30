import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockMatchMedia } from "../_test-helpers.js";
import { usePrefersReducedMotion } from "../index.js";

describe("usePrefersReducedMotion", () => {
  it("usePrefersReducedMotion mirrors the media query", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("is false when no preference is set, using the reduced-motion feature", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("flips live when the preference changes", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => media.setMatches(true));
    expect(result.current).toBe(true);
  });
});
