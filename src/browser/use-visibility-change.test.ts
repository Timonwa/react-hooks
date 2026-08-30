import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useVisibilityChange } from "../index.js";

function stubVisibility(initial: DocumentVisibilityState) {
  let state = initial;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  return {
    set(next: DocumentVisibilityState) {
      state = next;
    },
  };
}

const flip = () => document.dispatchEvent(new Event("visibilitychange"));

describe("useVisibilityChange", () => {
  it("fires onVisible / onHidden as the tab visibility flips", () => {
    let state: DocumentVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => state,
    });
    const onVisible = vi.fn();
    const onHidden = vi.fn();
    renderHook(() => useVisibilityChange({ onVisible, onHidden }));

    state = "hidden";
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(onHidden).toHaveBeenCalledTimes(1);

    state = "visible";
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  it("does nothing while disabled", () => {
    const vis = stubVisibility("visible");
    const onVisible = vi.fn();
    const onHidden = vi.fn();
    renderHook(() => useVisibilityChange({ enabled: false, onVisible, onHidden }));

    vis.set("hidden");
    act(() => void flip());
    expect(onHidden).not.toHaveBeenCalled();
    expect(onVisible).not.toHaveBeenCalled();
  });

  it("removes its listener on unmount", () => {
    const vis = stubVisibility("visible");
    const onHidden = vi.fn();
    const { unmount } = renderHook(() => useVisibilityChange({ onHidden }));
    unmount();

    vis.set("hidden");
    act(() => void flip());
    expect(onHidden).not.toHaveBeenCalled();
  });

  it("copes with only one callback supplied", () => {
    const vis = stubVisibility("hidden");
    const onVisible = vi.fn();
    renderHook(() => useVisibilityChange({ onVisible }));

    // Hidden fires with no onHidden — must not throw.
    act(() => void flip());
    vis.set("visible");
    act(() => void flip());
    expect(onVisible).toHaveBeenCalledTimes(1);
  });
});
