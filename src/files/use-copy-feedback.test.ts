import { act, renderHook } from "@testing-library/react";
import { copyTextToClipboard } from "@timonwa/app-utilities/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCopyFeedback } from "../index.js";

vi.mock("@timonwa/app-utilities/browser", () => ({
  copyTextToClipboard: vi.fn(async () => true),
}));

describe("useCopyFeedback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(copyTextToClipboard).mockClear();
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);
  });
  afterEach(() => vi.useRealTimers());

  it("flags the copied key and clears it after feedbackMs", async () => {
    const { result } = renderHook(() => useCopyFeedback(2000));
    await act(async () => {
      await result.current.copy("hello", "row-1");
    });
    expect(result.current.isCopied("row-1")).toBe(true);
    expect(result.current.isCopied("row-2")).toBe(false);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.isCopied("row-1")).toBe(false);
  });

  it("reports a failed write and sets no feedback", async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(false);
    const { result } = renderHook(() => useCopyFeedback());
    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.copy("hello");
    });
    expect(succeeded).toBe(false);
    expect(result.current.isCopied()).toBe(false);
  });

  it("defaults feedbackMs to 2000", async () => {
    const { result } = renderHook(() => useCopyFeedback());
    await act(async () => {
      await result.current.copy("hello");
    });
    act(() => vi.advanceTimersByTime(1999));
    expect(result.current.isCopied()).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.isCopied()).toBe(false);
  });

  it("resolves true and passes the text through to the clipboard", async () => {
    const { result } = renderHook(() => useCopyFeedback());
    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.copy("invite-url");
    });
    expect(succeeded).toBe(true);
    expect(copyTextToClipboard).toHaveBeenCalledWith("invite-url");
  });

  it("a later copy takes over and outlives the earlier key's timer", async () => {
    const { result } = renderHook(() => useCopyFeedback(2000));
    await act(async () => {
      await result.current.copy("a", "row-1");
    });
    act(() => vi.advanceTimersByTime(1000));
    await act(async () => {
      await result.current.copy("b", "row-2");
    });
    expect(result.current.copiedKey).toBe("row-2");

    // row-1's timer fires here; it must not cut row-2's feedback short.
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.isCopied("row-2")).toBe(true);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.isCopied("row-2")).toBe(false);
  });
});
