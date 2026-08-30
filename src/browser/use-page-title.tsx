/**
 * @description Shell-rendered page title (the Linear/Notion pattern: the page
 * declares its title, a shared header displays it). Wrap the layout once with
 * `<PageTitleProvider>`; pages call `usePageTitle("…")` to register the title
 * for as long as they're mounted, and the header/navbar reads `title` via the
 * same hook. Clears on unmount, so navigation resets the title automatically.
 *
 * @param title - String to set as the title, or omit to read the current value
 * @returns `{ title, setTitle }`
 *
 * @example
 * // In the layout (once):
 * <PageTitleProvider>{children}</PageTitleProvider>
 *
 * @example
 * // In a page:
 * usePageTitle("Events");
 *
 * @example
 * // In the navbar:
 * const { title } = usePageTitle();
 */

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface PageTitleContextValueProps {
  title: string | null;
  setTitle: (title: string | null) => void;
}

const PageTitleContext = createContext<PageTitleContextValueProps | null>(null);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>
  );
}

export function usePageTitle(title?: string) {
  const ctx = useContext(PageTitleContext);
  if (!ctx) throw new Error("usePageTitle must be used within a <PageTitleProvider>");

  const { setTitle } = ctx;
  useEffect(() => {
    if (title === undefined) return;
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);

  return ctx;
}
