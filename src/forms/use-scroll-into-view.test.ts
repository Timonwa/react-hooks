import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockMatchMedia, stubImmediateRaf } from "../_test-helpers.js";
import { useScrollIntoView } from "../index.js";

describe("useScrollIntoView", () => {
  beforeEach(() => stubImmediateRaf());

  it("scrolls with the configured block and offset", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() =>
      useScrollIntoView({ block: "center", offset: 40 }),
    );
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();
    (result.current.ref as { current: HTMLElement | null }).current = el;

    act(() => result.current.scrollIntoView());
    expect(el.style.scrollMargin).toBe("40px");
    expect(el.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it("downgrades smooth to auto when the user prefers reduced motion", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useScrollIntoView());
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();
    (result.current.ref as { current: HTMLElement | null }).current = el;

    act(() => result.current.scrollIntoView());
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("defaults to a 24px margin, block start, smooth", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useScrollIntoView());
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();
    (result.current.ref as { current: HTMLElement | null }).current = el;

    act(() => result.current.scrollIntoView());
    expect(el.style.scrollMargin).toBe("24px");
    expect(el.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("respects an explicit auto behavior", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useScrollIntoView({ behavior: "auto" }));
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();
    (result.current.ref as { current: HTMLElement | null }).current = el;

    act(() => result.current.scrollIntoView());
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("is a no-op when the ref is not attached", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useScrollIntoView());
    expect(() => act(() => result.current.scrollIntoView())).not.toThrow();
  });
});
