import { act, render, renderHook } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { mockMatchMedia } from "../_test-helpers.js";
import { ThemeProvider, ThemeScript, useTheme } from "../index.js";

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

  it('"system" follows OS preference changes live', () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");

    act(() => media.setMatches(true));
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => media.setMatches(false));
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it('setTheme("system") re-resolves from the OS and persists the choice', () => {
    mockMatchMedia(true); // OS prefers dark
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    act(() => result.current.setTheme("light"));
    expect(result.current.resolvedTheme).toBe("light");

    act(() => result.current.setTheme("system"));
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(window.localStorage.getItem("theme")).toBe("system");
  });

  it("ignores an unrecognised stored value and falls back to system", () => {
    window.localStorage.setItem("theme", "purple");
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");
  });

  it("uses defaultTheme when no choice is stored", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>,
    });
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("stops watching the OS preference on unmount", () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(media.listeners.size).toBeGreaterThan(0);
    unmount();
    expect(media.listeners.size).toBe(0);
  });

  it("still applies the choice when persistence throws (best-effort storage)", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("quota exceeded");
        },
      },
    });
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    expect(() => act(() => result.current.setTheme("dark"))).not.toThrow();
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("falls back to system without throwing when storage reads throw", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error("storage disabled");
        },
        setItem: () => {},
      },
    });
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");
  });
});

describe("ThemeScript", () => {
  beforeEach(() => {
    stubLocalStorage();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
    mockMatchMedia(false);
  });

  // jsdom never executes innerHTML-injected scripts, so run the serialized
  // IIFE by hand — exactly what the browser does before hydration.
  function runThemeScript(element: ReactElement) {
    const { container } = render(element);
    const script = container.querySelector("script");
    expect(script?.textContent).toBeTruthy();
    new Function(script?.textContent ?? "")();
  }

  it("applies a stored choice under the configured storageKey before hydration", () => {
    window.localStorage.setItem("colour-mode", "dark");
    runThemeScript(<ThemeScript storageKey="colour-mode" />);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("uses defaultTheme when no choice is stored", () => {
    runThemeScript(<ThemeScript defaultTheme="dark" />);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("resolves the default \"system\" from the OS preference", () => {
    mockMatchMedia(true); // OS prefers dark
    runThemeScript(<ThemeScript />);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("writes a data-theme attribute when attribute=\"data-theme\"", () => {
    window.localStorage.setItem("theme", "dark");
    runThemeScript(<ThemeScript attribute="data-theme" />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("falls back to defaultTheme without throwing when storage reads throw", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error("storage disabled");
        },
      },
    });
    expect(() => runThemeScript(<ThemeScript defaultTheme="dark" />)).not.toThrow();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
