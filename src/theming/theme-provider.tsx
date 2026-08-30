/**
 * @description Light/dark/system theme management for any React app, framework-
 * and CSS-library-agnostic. The user's choice persists in localStorage,
 * `"system"` follows the OS `prefers-color-scheme` live, and the resolved theme
 * is written to `<html>` as either a `.dark` class or a `data-theme` attribute —
 * your stylesheets key off whichever you pick:
 *
 * - Tailwind v4 manual dark mode: `@custom-variant dark (&:where(.dark, .dark *));`
 *   with `attribute="class"` (the default), or the `[data-theme=dark]` variant
 *   with `attribute="data-theme"`.
 * - Plain CSS / CSS variables: `.dark { --bg: … }` or `[data-theme="dark"] { … }`.
 *
 * `<ThemeProvider>` inlines a tiny pre-hydration script that applies the stored
 * theme before first paint, so there is no flash of the wrong theme on SSR'd
 * pages. Add `suppressHydrationWarning` to `<html>` (the script mutates it
 * before React hydrates). `<ThemeScript />` is also exported separately for
 * placing in `<head>` when the provider itself mounts late (e.g. lazily).
 *
 * @example
 * // 1. Wrap the app
 * <ThemeProvider>{children}</ThemeProvider>
 *
 * // 2. Consume
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

function getStored(storageKey: string, fallback: ThemeChoiceType): ThemeChoiceType {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(storageKey);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage unavailable */
  }
  return fallback;
}

/** How the resolved theme is written to `<html>`: a `.dark` class or a
 * `data-theme` attribute (`[data-theme="dark"]` selectors). */
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

interface ThemeScriptProps {
  /** localStorage key the choice persists under. Must match the provider's. */
  storageKey?: string;
  /** Theme used before a stored choice exists. Must match the provider's. */
  defaultTheme?: ThemeChoiceType;
  /** How the theme is written to `<html>`. Must match the provider's. */
  attribute?: ThemeAttributeType;
}

/**
 * Inline pre-hydration script that applies the stored theme to `<html>` before
 * first paint. `<ThemeProvider>` renders it automatically; use this directly
 * only when the provider mounts too late to beat the first paint.
 */
export function ThemeScript({
  storageKey = "theme",
  defaultTheme = "system",
  attribute = "class",
}: ThemeScriptProps) {
  // Serialized IIFE mirror of getStored + getSystemPref + applyTheme — it must
  // run before React loads, so it can't share their function objects.
  const script = `(function(){try{var k=${JSON.stringify(storageKey)},a=${JSON.stringify(attribute)},d=${JSON.stringify(defaultTheme)};var s=null;try{s=localStorage.getItem(k)}catch(e){}var t=s==="light"||s==="dark"||s==="system"?s:d;var r=t==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;var h=document.documentElement;if(a==="data-theme"){h.setAttribute("data-theme",r)}else if(r==="dark"){h.classList.add("dark")}}catch(e){}})();`;
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the script is built purely from JSON-serialized props
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

interface ThemeProviderProps {
  children: ReactNode;
  /** localStorage key the choice persists under. */
  storageKey?: string;
  /** Theme used before a stored choice exists. */
  defaultTheme?: ThemeChoiceType;
  /** How the theme is written to `<html>`. Default: a `.dark` class. */
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
    const stored = getStored(storageKey, defaultTheme);
    const next = stored === "system" ? getSystemPref() : stored;
    setThemeState(stored);
    setResolvedTheme(next);
    applyTheme(next, attribute);
  }, [storageKey, defaultTheme, attribute]);

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
      <ThemeScript storageKey={storageKey} defaultTheme={defaultTheme} attribute={attribute} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValueProps {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
