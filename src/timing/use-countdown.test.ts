import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "../index.js";

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down each second and reports completion", () => {
    const { result } = renderHook(() => useCountdown(3));
    act(() => result.current.start());
    expect(result.current.remaining).toBe(3);
    expect(result.current.isActive).toBe(true);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.remaining).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("is idle until start() is called", () => {
    const { result } = renderHook(() => useCountdown(10));
    expect(result.current.remaining).toBe(0);
    expect(result.current.isActive).toBe(false);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remaining).toBe(0);
  });

  it("formats remaining as M:SS with padded seconds", () => {
    const { result } = renderHook(() => useCountdown(65));
    expect(result.current.formatted).toBe("0:00");
    act(() => result.current.start());
    expect(result.current.formatted).toBe("1:05");
    act(() => vi.advanceTimersByTime(6000));
    expect(result.current.formatted).toBe("0:59");
  });

  it("start() mid-run restarts from the full duration", () => {
    const { result } = renderHook(() => useCountdown(5));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.remaining).toBe(3);
    act(() => result.current.start());
    expect(result.current.remaining).toBe(5);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remaining).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("start() uses the latest duration after a prop change", () => {
    const { result, rerender } = renderHook(({ d }) => useCountdown(d), {
      initialProps: { d: 3 },
    });
    rerender({ d: 8 });
    act(() => result.current.start());
    expect(result.current.remaining).toBe(8);
  });

  it("clears its interval on unmount", () => {
    const { result, unmount } = renderHook(() => useCountdown(10));
    act(() => result.current.start());
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
