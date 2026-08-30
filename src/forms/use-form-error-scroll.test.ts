import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockMatchMedia, stubImmediateRaf } from "../_test-helpers.js";
import { useFormErrorScroll } from "../index.js";

function attachForm(ref: unknown) {
  const form = document.createElement("form");
  form.scrollIntoView = vi.fn();
  (ref as { current: HTMLElement | null }).current = form;
  return form;
}

describe("useFormErrorScroll", () => {
  it("surfaces the first leaf message and scrolls the form", () => {
    stubImmediateRaf();
    // jsdom has no matchMedia; the scroll path reads prefers-reduced-motion.
    mockMatchMedia(false);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();
    const { result } = renderHook(() => useFormErrorScroll(onError));
    const form = document.createElement("form");
    form.scrollIntoView = vi.fn();
    (result.current.ref as { current: HTMLElement | null }).current = form;

    act(() =>
      result.current.onInvalid({
        venue: { name: { message: "Venue name is required" } },
      }),
    );
    expect(onError).toHaveBeenCalledWith("Venue name is required");
    expect(form.scrollIntoView).toHaveBeenCalled();
    vi.mocked(console.error).mockRestore();
  });

  it("scrolls even without an onError callback", () => {
    stubImmediateRaf();
    mockMatchMedia(false);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useFormErrorScroll());
    const form = attachForm(result.current.ref);

    expect(() => act(() => result.current.onInvalid({ name: {} }))).not.toThrow();
    expect(form.scrollIntoView).toHaveBeenCalled();
    vi.mocked(console.error).mockRestore();
  });

  it("passes undefined to onError when the tree holds no message", () => {
    stubImmediateRaf();
    mockMatchMedia(false);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();
    const { result } = renderHook(() => useFormErrorScroll(onError));
    const form = attachForm(result.current.ref);

    act(() => result.current.onInvalid({ venue: { name: {} } }));
    expect(onError).toHaveBeenCalledWith(undefined);
    expect(form.scrollIntoView).toHaveBeenCalled();
    vi.mocked(console.error).mockRestore();
  });

  it("forwards scroll options to the underlying scroll", () => {
    stubImmediateRaf();
    mockMatchMedia(false);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() =>
      useFormErrorScroll(undefined, { block: "center", offset: 40 }),
    );
    const form = attachForm(result.current.ref);

    act(() => result.current.onInvalid({}));
    expect(form.style.scrollMargin).toBe("40px");
    expect(form.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    vi.mocked(console.error).mockRestore();
  });

  it("logs the raw error tree outside production (dev diagnostic)", () => {
    stubImmediateRaf();
    mockMatchMedia(false);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useFormErrorScroll());
    attachForm(result.current.ref);

    const errors = { venue: { name: { message: "Required" } } };
    act(() => result.current.onInvalid(errors));
    // Vitest runs with NODE_ENV !== "production", so the dev branch is live.
    expect(errorSpy).toHaveBeenCalledWith("Form validation errors:", errors);
    errorSpy.mockRestore();
  });
});
