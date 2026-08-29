/**
 * @description Theme context backed by localStorage + OS `prefers-color-scheme`.
 * Exports `<ThemeProvider>` and the `useTheme()` hook. The inline `<ThemeScript />`
 * in `<head>` applies the dark class before hydration, so initial render matches
 * SSR with no flash.
 *
 * @example
 * // 1. Wrap app
 * <ThemeProvider>{children}</ThemeProvider>
 *
 * // 2. Consume theme
 * const { theme, resolvedTheme, setTheme } = useTheme();
 * <button onClick={() => setTheme("dark")}>Dark mode</button>
 */

"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeChoiceType = "light" | "dark" | "system";
export type ResolvedThemeType = "light" | "dark";

interface ThemeContextValueProps {
  theme: ThemeChoiceType;
  resolvedTheme: ResolvedThemeType;
  setTheme(next: ThemeChoiceType): void;
}

const ThemeContext = createContext<ThemeContextValueProps | undefined>(undefined);


function getSystemPref(): ResolvedThemeType {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStored(storageKey: string): ThemeChoiceType {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(storageKey);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage unavailable */
  }
  return "system";
}

/** How the resolved theme is written to <html>: a `.dark` class (Tailwind's
 * class variant) or a `data-theme` attribute (`[data-theme="dark"]` selectors). */
export type ThemeAttributeType = "class" | "data-theme";

function applyTheme(resolved: ResolvedThemeType, attribute: ThemeAttributeType) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (attribute === "data-theme") {
    root.setAttribute("data-theme", resolved);
    return;
  }
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

interface ThemeProviderProps {
  children: ReactNode;
  /** localStorage key the choice persists under. */
  storageKey?: string;
  /** Theme used before a stored choice exists. */
  defaultTheme?: ThemeChoiceType;
  /** How the theme is written to <html>. Default: a `.dark` class. */
  attribute?: ThemeAttributeType;
}

export function ThemeProvider({
  children,
  storageKey = "theme",
  defaultTheme = "system",
  attribute = "class",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeChoiceType>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedThemeType>("light");

  useEffect(() => {
    const stored = getStored(storageKey);
    const next = stored === "system" ? getSystemPref() : stored;
    setThemeState(stored);
    setResolvedTheme(next);
    applyTheme(next, attribute);
  }, [storageKey, attribute]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r: ResolvedThemeType = mq.matches ? "dark" : "light";
      setResolvedTheme(r);
      applyTheme(r, attribute);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, attribute]);

  const setTheme = useCallback(
    (next: ThemeChoiceType) => {
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        /* persistence is best-effort */
      }
      const resolved: ResolvedThemeType = next === "system" ? getSystemPref() : next;
      setThemeState(next);
      setResolvedTheme(resolved);
      applyTheme(resolved, attribute);
    },
    [storageKey, attribute],
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValueProps {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
