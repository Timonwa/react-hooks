import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "../index.js";

describe("useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("only settles after the delay elapses without changes", () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: "a" },
    });
    rerender({ v: "ab" });
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("ab");
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 300));
    expect(result.current).toBe("a");
  });

  it("collapses rapid changes into the final value only", () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: "a" },
    });
    rerender({ v: "ab" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ v: "abc" });
    // 400ms after "ab" arrived — its timer was cancelled, so nothing landed.
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("abc");
  });

  it("defaults the delay to 300ms", () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v), {
      initialProps: { v: 1 },
    });
    rerender({ v: 2 });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe(1);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(2);
  });

  it("a delay change reschedules the pending update", () => {
    const { result, rerender } = renderHook(({ v, d }) => useDebouncedValue(v, d), {
      initialProps: { v: "a", d: 300 },
    });
    rerender({ v: "b", d: 300 });
    act(() => vi.advanceTimersByTime(200));
    rerender({ v: "b", d: 1000 });
    act(() => vi.advanceTimersByTime(999));
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("b");
  });
});
