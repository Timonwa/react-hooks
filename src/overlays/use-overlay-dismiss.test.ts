import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOverlayDismiss } from "../index.js";

describe("useOverlayDismiss", () => {
  let panel: HTMLDivElement;
  let first: HTMLButtonElement;
  let last: HTMLButtonElement;
  let opener: HTMLButtonElement;

  beforeEach(() => {
    opener = document.createElement("button");
    panel = document.createElement("div");
    first = document.createElement("button");
    last = document.createElement("button");
    last.setAttribute("data-autofocus", "");
    panel.append(first, last);
    document.body.append(opener, panel);
    opener.focus();
  });
  afterEach(() => {
    opener.remove();
    panel.remove();
    document.body.style.overflow = "";
  });

  const key = (init: KeyboardEventInit) =>
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));

  it("locks scroll, focuses the [data-autofocus] target, and restores both on close", () => {
    const { rerender } = renderHook(
      ({ open }) =>
        useOverlayDismiss({ open, onDismiss: () => {}, panelRef: { current: panel } }),
      { initialProps: { open: true } },
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(last); // [data-autofocus] beats DOM order

    rerender({ open: false });
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(opener);
  });

  it("Escape dismisses", () => {
    const onDismiss = vi.fn();
    renderHook(() =>
      useOverlayDismiss({ open: true, onDismiss, panelRef: { current: panel } }),
    );
    act(() => void key({ key: "Escape" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("traps Tab: last wraps to first, Shift+Tab on first wraps to last", () => {
    renderHook(() =>
      useOverlayDismiss({
        open: true,
        onDismiss: () => {},
        panelRef: { current: panel },
      }),
    );

    last.focus();
    act(() => void key({ key: "Tab" }));
    expect(document.activeElement).toBe(first);

    act(() => void key({ key: "Tab", shiftKey: true }));
    expect(document.activeElement).toBe(last);
  });

  it("pulls focus back in when it escaped the panel", () => {
    renderHook(() =>
      useOverlayDismiss({
        open: true,
        onDismiss: () => {},
        panelRef: { current: panel },
      }),
    );
    opener.focus();
    act(() => void key({ key: "Tab" }));
    expect(document.activeElement).toBe(first);
  });

  it("does nothing while closed", () => {
    const onDismiss = vi.fn();
    renderHook(() =>
      useOverlayDismiss({ open: false, onDismiss, panelRef: { current: panel } }),
    );
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(opener);

    act(() => void key({ key: "Escape" }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("falls back to the first focusable without a [data-autofocus] target", () => {
    last.removeAttribute("data-autofocus");
    renderHook(() =>
      useOverlayDismiss({
        open: true,
        onDismiss: () => {},
        panelRef: { current: panel },
      }),
    );
    expect(document.activeElement).toBe(first);
  });

  it("cleans up fully on unmount: listener, scroll lock, and focus", () => {
    const onDismiss = vi.fn();
    const { unmount } = renderHook(() =>
      useOverlayDismiss({ open: true, onDismiss, panelRef: { current: panel } }),
    );
    unmount();
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(opener);

    act(() => void key({ key: "Escape" }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("focuses the panel itself and holds Tab there when it has no focusables", () => {
    const emptyPanel = document.createElement("div");
    // Dialog panels take tabindex="-1" so they can receive fallback focus;
    // the selector excludes it, so the no-focusables branch still runs.
    emptyPanel.setAttribute("tabindex", "-1");
    document.body.append(emptyPanel);
    renderHook(() =>
      useOverlayDismiss({
        open: true,
        onDismiss: () => {},
        panelRef: { current: emptyPanel },
      }),
    );
    expect(document.activeElement).toBe(emptyPanel);

    act(() => void key({ key: "Tab" }));
    expect(document.activeElement).toBe(emptyPanel);
    emptyPanel.remove();
  });

  it("tolerates an unattached panelRef: no throw, Escape still dismisses", () => {
    const onDismiss = vi.fn();
    expect(() =>
      renderHook(() =>
        useOverlayDismiss({ open: true, onDismiss, panelRef: { current: null } }),
      ),
    ).not.toThrow();

    act(() => void key({ key: "Tab" })); // trap is a no-op without a panel
    act(() => void key({ key: "Escape" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("uses the latest onDismiss without re-running the open effect", () => {
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();
    // Stable panelRef so only the handler identity changes across renders.
    const panelRef = { current: panel };
    const { rerender } = renderHook(
      ({ fn }) => useOverlayDismiss({ open: true, onDismiss: fn, panelRef }),
      { initialProps: { fn: firstHandler } },
    );

    first.focus();
    rerender({ fn: secondHandler });
    // A re-run of the effect would have yanked focus back to [data-autofocus].
    expect(document.activeElement).toBe(first);

    act(() => void key({ key: "Escape" }));
    expect(secondHandler).toHaveBeenCalledTimes(1);
    expect(firstHandler).not.toHaveBeenCalled();
  });
});
