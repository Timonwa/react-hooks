import { act, renderHook } from "@testing-library/react";
import type { TransitionEvent } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { stubImmediateRaf } from "../_test-helpers.js";
import { useMountTransition } from "../index.js";

const endEvent = (target: HTMLElement, currentTarget: HTMLElement) =>
  ({ target, currentTarget }) as unknown as TransitionEvent<HTMLElement>;

describe("useMountTransition", () => {
  beforeEach(() => stubImmediateRaf());

  it("mounts on open, shows a frame later, and unmounts after the exit transition", () => {
    const { result, rerender } = renderHook(({ open }) => useMountTransition(open), {
      initialProps: { open: false },
    });
    expect(result.current.mounted).toBe(false);

    rerender({ open: true });
    expect(result.current.mounted).toBe(true);
    expect(result.current.shown).toBe(true);

    rerender({ open: false });
    expect(result.current.mounted).toBe(true); // stays mounted through the exit
    expect(result.current.shown).toBe(false);

    const el = document.createElement("div");
    act(() =>
      result.current.handleTransitionEnd({
        target: el,
        currentTarget: el,
      } as unknown as TransitionEvent<HTMLElement>),
    );
    expect(result.current.mounted).toBe(false);
  });

  it("renders mounted (and, a stubbed frame later, shown) when initially open", () => {
    const { result } = renderHook(() => useMountTransition(true));
    expect(result.current.mounted).toBe(true);
    expect(result.current.shown).toBe(true);
  });

  it("ignores transitionend events bubbling up from children", () => {
    const { result, rerender } = renderHook(({ open }) => useMountTransition(open), {
      initialProps: { open: true },
    });
    rerender({ open: false });

    const panel = document.createElement("div");
    const child = document.createElement("span");
    act(() => result.current.handleTransitionEnd(endEvent(child, panel)));
    expect(result.current.mounted).toBe(true);
  });

  it("cancels the exit when reopened before the transition ends", () => {
    const { result, rerender } = renderHook(({ open }) => useMountTransition(open), {
      initialProps: { open: true },
    });
    rerender({ open: false });
    rerender({ open: true });
    expect(result.current.mounted).toBe(true);
    expect(result.current.shown).toBe(true);

    // The interrupted exit's transitionend still fires — it must not unmount.
    const el = document.createElement("div");
    act(() => result.current.handleTransitionEnd(endEvent(el, el)));
    expect(result.current.mounted).toBe(true);
  });
});
