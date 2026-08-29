import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "@timonwa/app-utilities/browser";
import {
  type CookieConsentAdapter,
  ThemeProvider,
  PageTitleProvider,
  useClickOutside,
  useCookieConsent,
  useCopyFeedback,
  useCountdown,
  useDebouncedValue,
  useFormErrorScroll,
  useMediaQuery,
  useMountTransition,
  useObjectUrl,
  useObjectUrlMap,
  useOverlayDismiss,
  usePageTitle,
  usePrefersReducedMotion,
  useScrollIntoView,
  useTheme,
  useVisibilityChange,
} from "./index.js";

vi.mock("@timonwa/app-utilities/browser", () => ({
  copyTextToClipboard: vi.fn(async () => true),
}));

// Node's experimental localStorage global shadows jsdom's — stub a real one so
// the hooks exercise deterministic storage.
function stubLocalStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
  });
}

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.delete(cb),
  }));
  return listeners;
}

// jsdom has no requestAnimationFrame; several hooks defer one frame through it.
function stubImmediateRaf() {
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  };
  window.cancelAnimationFrame = () => {};
}

describe("ThemeProvider / useTheme", () => {
  beforeEach(() => {
    stubLocalStorage();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
    mockMatchMedia(false);
  });

  it("resolves the stored choice, toggles the dark class, and persists changes", () => {
    window.localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => result.current.setTheme("light"));
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem("theme")).toBe("light");
  });

  it("honours a custom storageKey", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider storageKey="colour-mode">{children}</ThemeProvider>,
    });
    act(() => result.current.setTheme("dark"));
    expect(window.localStorage.getItem("colour-mode")).toBe("dark");
  });

  it("writes a data-theme attribute when attribute=\"data-theme\"", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider attribute="data-theme">{children}</ThemeProvider>,
    });
    act(() => result.current.setTheme("dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("useTheme outside the provider throws the guidance error", () => {
    expect(() => renderHook(() => useTheme())).toThrow(/inside <ThemeProvider>/);
  });
});

describe("useMediaQuery / usePrefersReducedMotion", () => {
  it("reports whether the query matches", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(min-width: 960px)"));
    expect(result.current).toBe(true);
  });

  it("usePrefersReducedMotion mirrors the media query", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });
});

describe("useCookieConsent", () => {
  function makeAdapter(accepted: Record<string, boolean | null>) {
    const listeners = new Set<() => void>();
    const adapter: CookieConsentAdapter = {
      readCategory: (category) => accepted[category] ?? null,
      subscribe: (onChange) => {
        listeners.add(onChange);
        return () => listeners.delete(onChange);
      },
    };
    return { adapter, notify: () => listeners.forEach((l) => l()) };
  }

  it("returns caller-defined categories, null before the CMP answers, live after", () => {
    const accepted: Record<string, boolean | null> = { analytics: null, marketing: null };
    const { adapter, notify } = makeAdapter(accepted);
    const { result } = renderHook(() => useCookieConsent(["analytics", "marketing"], adapter));
    expect(result.current).toEqual({ analytics: null, marketing: null });

    accepted.analytics = true;
    accepted.marketing = false;
    act(() => notify());
    expect(result.current).toEqual({ analytics: true, marketing: false });
  });

  it("the default adapter reads the vanilla-cookieconsent global and its events", () => {
    (window as { CookieConsent?: unknown }).CookieConsent = {
      acceptedCategory: (c: string) => c === "necessary",
    };
    const { result, unmount } = renderHook(() => useCookieConsent(["necessary", "analytics"]));
    expect(result.current).toEqual({ necessary: true, analytics: false });

    (window as { CookieConsent?: unknown }).CookieConsent = {
      acceptedCategory: () => true,
    };
    act(() => void window.dispatchEvent(new Event("cc:onChange")));
    expect(result.current).toEqual({ necessary: true, analytics: true });

    unmount();
    delete (window as { CookieConsent?: unknown }).CookieConsent;
  });
});

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
});

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

  const press = (el: HTMLElement) => el.dispatchEvent(new Event("pointerdown", { bubbles: true }));

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
    renderHook(() => useClickOutside({ refs: { current: inside }, enabled: false, onClickOutside }));
    act(() => void press(outside));
    expect(onClickOutside).not.toHaveBeenCalled();
  });
});

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
      ({ open }) => useOverlayDismiss({ open, onDismiss: () => {}, panelRef: { current: panel } }),
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
    renderHook(() => useOverlayDismiss({ open: true, onDismiss, panelRef: { current: panel } }));
    act(() => void key({ key: "Escape" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("traps Tab: last wraps to first, Shift+Tab on first wraps to last", () => {
    renderHook(() =>
      useOverlayDismiss({ open: true, onDismiss: () => {}, panelRef: { current: panel } }),
    );

    last.focus();
    act(() => void key({ key: "Tab" }));
    expect(document.activeElement).toBe(first);

    act(() => void key({ key: "Tab", shiftKey: true }));
    expect(document.activeElement).toBe(last);
  });

  it("pulls focus back in when it escaped the panel", () => {
    renderHook(() =>
      useOverlayDismiss({ open: true, onDismiss: () => {}, panelRef: { current: panel } }),
    );
    opener.focus();
    act(() => void key({ key: "Tab" }));
    expect(document.activeElement).toBe(first);
  });
});

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
      } as unknown as React.TransitionEvent<HTMLElement>),
    );
    expect(result.current.mounted).toBe(false);
  });
});

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
});

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
});

describe("useFormErrorScroll", () => {
  it("surfaces the first leaf message and scrolls the form", () => {
    stubImmediateRaf();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();
    const { result } = renderHook(() => useFormErrorScroll(onError));
    const form = document.createElement("form");
    form.scrollIntoView = vi.fn();
    (result.current.ref as { current: HTMLElement | null }).current = form;

    act(() => result.current.onInvalid({ venue: { name: { message: "Venue name is required" } } }));
    expect(onError).toHaveBeenCalledWith("Venue name is required");
    expect(form.scrollIntoView).toHaveBeenCalled();
    vi.mocked(console.error).mockRestore();
  });
});

describe("useObjectUrl", () => {
  it("creates a URL for the blob and revokes it when the blob changes", () => {
    const revoked: string[] = [];
    let counter = 0;
    URL.createObjectURL = vi.fn(() => `blob:${counter++}`);
    URL.revokeObjectURL = vi.fn((u: string) => revoked.push(u));

    const file = new File(["x"], "x.png", { type: "image/png" });
    const { result, rerender } = renderHook(({ blob }) => useObjectUrl(blob), {
      initialProps: { blob: file as Blob | null },
    });
    expect(result.current).toBe("blob:0");

    rerender({ blob: null });
    expect(result.current).toBe(null);
    expect(revoked).toContain("blob:0");
  });
});

describe("useObjectUrlMap", () => {
  it("creates one URL per keyed file and revokes on unmount", () => {
    const created: string[] = [];
    const revoked: string[] = [];
    URL.createObjectURL = vi.fn(() => {
      const u = `blob:${created.length}`;
      created.push(u);
      return u;
    });
    URL.revokeObjectURL = vi.fn((u: string) => revoked.push(u));

    const file = new File(["x"], "x.png", { type: "image/png" });
    const items = [{ id: "a", file }];
    const { result, unmount } = renderHook(() =>
      useObjectUrlMap(items, (item) => item.id, (item) => item.file),
    );
    expect(result.current.a).toBe("blob:0");
    unmount();
    expect(revoked).toContain("blob:0");
  });
});

describe("usePageTitle", () => {
  it("registers the page's title and follows changes", () => {
    const { result, rerender } = renderHook(({ t }) => usePageTitle(t), {
      initialProps: { t: "Events" },
      wrapper: PageTitleProvider,
    });
    expect(result.current.title).toBe("Events");
    rerender({ t: "Albums" });
    expect(result.current.title).toBe("Albums");
  });

  it("throws the guidance error outside the provider", () => {
    expect(() => renderHook(() => usePageTitle())).toThrow(/PageTitleProvider/);
  });
});

describe("useScrollIntoView", () => {
  beforeEach(() => stubImmediateRaf());

  it("scrolls with the configured block and offset", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useScrollIntoView({ block: "center", offset: 40 }));
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();
    (result.current.ref as { current: HTMLElement | null }).current = el;

    act(() => result.current.scrollIntoView());
    expect(el.style.scrollMargin).toBe("40px");
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
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
});

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
});
