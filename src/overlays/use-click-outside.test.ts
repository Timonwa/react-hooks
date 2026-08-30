import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useClickOutside } from "../index.js";

describe("useClickOutside", () => {
  let inside: HTMLDivElement;
  let outside: HTMLDivElement;

  beforeEach(() => {
    inside = document.createElement("div");
    outside = document.createElement("div");
    document.body.append(inside, outside);
  });
  afterEach(() => {
    inside.remove();
    outside.remove();
  });

  const press = (el: HTMLElement) =>
    el.dispatchEvent(new Event("pointerdown", { bubbles: true }));

  it("fires only when the press is outside every ref", () => {
    const onClickOutside = vi.fn();
    renderHook(() => useClickOutside({ refs: [{ current: inside }], onClickOutside }));

    act(() => void press(inside));
    expect(onClickOutside).not.toHaveBeenCalled();
    act(() => void press(outside));
    expect(onClickOutside).toHaveBeenCalledTimes(1);
  });

  it("does nothing while disabled", () => {
    const onClickOutside = vi.fn();
    renderHook(() =>
      useClickOutside({ refs: { current: inside }, enabled: false, onClickOutside }),
    );
    act(() => void press(outside));
    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("holds fire when the press lands in any of several refs", () => {
    // The menu-plus-trigger case: a press on either element must not dismiss.
    const trigger = document.createElement("button");
    document.body.append(trigger);
    const onClickOutside = vi.fn();
    renderHook(() =>
      useClickOutside({
        refs: [{ current: inside }, { current: trigger }],
        onClickOutside,
      }),
    );

    act(() => void press(inside));
    act(() => void press(trigger));
    expect(onClickOutside).not.toHaveBeenCalled();
    act(() => void press(outside));
    expect(onClickOutside).toHaveBeenCalledTimes(1);
    trigger.remove();
  });

  it("accepts a record of refs", () => {
    const onClickOutside = vi.fn();
    renderHook(() =>
      useClickOutside({ refs: { menu: { current: inside } }, onClickOutside }),
    );

    act(() => void press(inside));
    expect(onClickOutside).not.toHaveBeenCalled();
    act(() => void press(outside));
    expect(onClickOutside).toHaveBeenCalledTimes(1);
  });

  it("accepts a single ref and fires only for presses outside it", () => {
    const onClickOutside = vi.fn();
    renderHook(() => useClickOutside({ refs: { current: inside }, onClickOutside }));

    act(() => void press(inside));
    expect(onClickOutside).not.toHaveBeenCalled();
    act(() => void press(outside));
    expect(onClickOutside).toHaveBeenCalledTimes(1);
  });

  it("removes its listener on unmount", () => {
    const onClickOutside = vi.fn();
    const { unmount } = renderHook(() =>
      useClickOutside({ refs: { current: inside }, onClickOutside }),
    );
    unmount();
    act(() => void press(outside));
    expect(onClickOutside).not.toHaveBeenCalled();
  });
});
