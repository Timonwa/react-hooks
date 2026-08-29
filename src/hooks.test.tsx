import { act, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useCountdown, useObjectUrlMap, useTheme } from "./index.js";

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

describe("ThemeProvider / useTheme", () => {
  beforeEach(() => {
    stubLocalStorage();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
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

  it("useTheme outside the provider throws the guidance error", () => {
    expect(() => renderHook(() => useTheme())).toThrow(/inside <ThemeProvider>/);
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

describe("useObjectUrlMap", () => {
  it("creates one URL per keyed file and revokes on unmount", () => {
    const created: string[] = [];
    const revoked: string[] = [];
    URL.createObjectURL = vi.fn((f: Blob) => {
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
