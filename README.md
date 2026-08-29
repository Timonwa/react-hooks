# @timonwa/react-hooks

Typed React hooks for the DOM problems every app hits — theming with flash-free dark mode, media queries, cookie consent, countdowns, object URLs that never leak, click-outside, overlay dismissal, tab visibility, and page titles. Client-side by design and framework-agnostic: nothing here assumes Next.js, a router, a CSS library, or any state library.

[![npm](https://img.shields.io/npm/v/@timonwa/react-hooks)](https://www.npmjs.com/package/@timonwa/react-hooks)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-timonwa-FFDD00?logo=buymeacoffee&logoColor=black)](https://www.buymeacoffee.com/timonwa)

Ships ESM and CJS with type declarations and a `"use client"` banner, so React Server Component frameworks (Next.js App Router, etc.) get a clear client-boundary error instead of a cryptic hooks crash.

## Quickstart

```bash
npm install @timonwa/react-hooks
# or: pnpm add @timonwa/react-hooks · yarn add @timonwa/react-hooks
```

Requires React 18 or 19.

```tsx
import { useDebouncedValue } from "@timonwa/react-hooks";

function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  // fire the request off debouncedQuery, not query
}
```

## Theming and appearance

| Hook | What it does |
| --- | --- |
| [`ThemeProvider` / `useTheme` / `ThemeScript`](#theming) | Light/dark/system theme with persistence and no flash of the wrong theme |
| [`useMediaQuery`](#usemediaquery) | Live media-query matching, SSR-safe |
| [`usePrefersReducedMotion`](#useprefersreducedmotion) | The user's reduced-motion preference, live |

### Theming

```ts
ThemeProvider(props: { children; storageKey?; defaultTheme?; attribute? })
useTheme(): { theme; resolvedTheme; setTheme }
ThemeScript(props: { storageKey?; defaultTheme?; attribute? })
```

Light/dark/system theme management for any React app. The user's choice persists in `localStorage`, `"system"` follows the OS `prefers-color-scheme` live, and the resolved theme is written to `<html>` as either a `.dark` class or a `data-theme` attribute — your stylesheets key off whichever you pick. The provider inlines a tiny pre-hydration script that applies the stored theme before first paint, so SSR'd pages never flash the wrong theme.

**`ThemeProvider` props**

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `storageKey` | `string` | `"theme"` | localStorage key the choice persists under |
| `defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` | Theme used before a stored choice exists |
| `attribute` | `"class" \| "data-theme"` | `"class"` | Write a `.dark` class or a `data-theme="light" \| "dark"` attribute to `<html>` |

**`useTheme()` returns**

- `theme` — the user's choice: `"light" | "dark" | "system"`.
- `resolvedTheme` — what is actually applied right now: `"light" | "dark"` (system resolved to one of the two).
- `setTheme(next)` — persists and applies a new choice.

```tsx
import { ThemeProvider, useTheme } from "@timonwa/react-hooks";

// 1. Wrap the app once (root layout / App component). Add suppressHydrationWarning
// to <html> — the pre-hydration script mutates it before React hydrates.
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider>{children}</ThemeProvider>
  </body>
</html>;

// 2. Consume anywhere below the provider.
function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

**Wiring your CSS.** The provider only toggles a class/attribute on `<html>`; any styling approach that can select on it works:

```css
/* Tailwind CSS v4 — manual dark mode, class strategy (attribute="class", the default) */
@custom-variant dark (&:where(.dark, .dark *));

/* Tailwind CSS v4 — data-attribute strategy (attribute="data-theme") */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

/* Plain CSS variables */
:root { --bg: white; --fg: black; }
.dark { --bg: black; --fg: white; }            /* attribute="class" */
[data-theme="dark"] { --bg: black; --fg: white; } /* attribute="data-theme" */
```

**`ThemeScript`** is rendered by the provider automatically, so you normally never touch it. Export it yourself only when the provider mounts too late to beat first paint (e.g. it's lazy-loaded): place `<ThemeScript />` in `<head>` with the same `storageKey` / `defaultTheme` / `attribute` values as your provider. Running both is harmless — the script is idempotent.

### useMediaQuery

```ts
useMediaQuery(query: string): boolean
```

Whether a media query currently matches, updating live via `matchMedia` — for branching rendering or behaviour on a breakpoint (or any media feature) in JS, which CSS alone cannot do. SSR-safe: the server snapshot is `false`, so first paint matches hydration; the real value applies right after.

```tsx
const isDesktop = useMediaQuery("(min-width: 960px)");
return isDesktop ? <SidebarLayout /> : <BottomTabsLayout />;
```

### usePrefersReducedMotion

```ts
usePrefersReducedMotion(): boolean
```

Whether the user prefers reduced motion. A CSS `@media (prefers-reduced-motion)` catch-all covers declarative animation, but JS-driven motion — `scrollIntoView({ behavior: "smooth" })`, canvas, spring libraries — bypasses CSS and must be gated in code (WCAG 2.3.3). SSR-safe: `false` on the server, corrected on the client.

```tsx
const skipAnimation = usePrefersReducedMotion();
element.scrollIntoView({ behavior: skipAnimation ? "auto" : "smooth" });
```

## Overlays and transitions

| Hook | What it does |
| --- | --- |
| [`useClickOutside`](#useclickoutside) | Dismissal for non-modal floating UI (dropdowns, popovers, tooltips) |
| [`useMountTransition`](#usemounttransition) | Enter/exit CSS transitions for anything that mounts and unmounts |
| [`useOverlayDismiss`](#useoverlaydismiss) | The modal shell — Escape, scroll lock, and focus handling for dialogs, drawers, sheets, palettes |

### useClickOutside

```ts
useClickOutside(options: {
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[] | Record<string, RefObject<HTMLElement | null>>;
  onClickOutside: () => void;
  enabled?: boolean; // default: true
}): void
```

Fires `onClickOutside` when a pointer press (mouse, touch, or pen — one `pointerdown` listener covers all three) lands outside the given ref(s). Accepts a single ref, an array, or a record of refs — the callback fires only when the press is outside **all** of them, which is what you want for a menu plus the button that opens it.

**When to use it:** this is the dismissal mechanism for *non-modal* floating UI — dropdowns, popovers, tooltips, comboboxes, inline pickers — anything that floats over a page that stays interactive behind it. For *modal* surfaces (dialogs, drawers, bottom sheets), use [`useOverlayDismiss`](#useoverlaydismiss) instead and handle clicks on the backdrop itself.

```tsx
const menuRef = useRef<HTMLDivElement>(null);
const buttonRef = useRef<HTMLButtonElement>(null);

useClickOutside({
  refs: [menuRef, buttonRef],
  enabled: isOpen, // no listener at all while closed
  onClickOutside: () => setIsOpen(false),
});
```

### useMountTransition

```ts
useMountTransition(open: boolean): {
  mounted: boolean;   // whether to render the element at all
  shown: boolean;     // whether to apply the open-position classes
  handleTransitionEnd: (event: TransitionEvent<HTMLElement>) => void;
}
```

Drives an enter/exit CSS transition for a component that mounts and unmounts with `open`. Render while `mounted`, style off `shown`, and wire `handleTransitionEnd` to the transitioning element so it unmounts only after its exit transition finishes (transitions bubbling up from children are ignored).

**When to use it:** it's purely presentational, so it fits anything that appears and disappears — toasts, banners, inline expand/collapse, and both modal and non-modal overlays. It composes with the other two: `useMountTransition` handles the animation, [`useOverlayDismiss`](#useoverlaydismiss) or [`useClickOutside`](#useclickoutside) handles the dismissal, depending on whether the surface is modal.

```tsx
function Toast({ open, message }) {
  const { mounted, shown, handleTransitionEnd } = useMountTransition(open);
  if (!mounted) return null;
  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      className={`toast transition-all duration-300 ${shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
    >
      {message}
    </div>
  );
}
```

### useOverlayDismiss

```ts
useOverlayDismiss(options: {
  open: boolean;
  onDismiss: () => void;
  panelRef: RefObject<HTMLElement | null>;
}): void
```

The behaviours every **modal** overlay shares, in one hook: **Escape** calls `onDismiss`, the body is scroll-locked while `open`, and focus management is handled — focus moves into the panel when it opens (preferring an element marked `[data-autofocus]`, else the first focusable element, else the panel itself), **Tab and Shift+Tab cycle within the panel** while it's open (the WAI-ARIA dialog pattern), and focus returns to the previously focused element on close.

**When to use it:** any surface that takes over the page and blocks interaction behind it — dialogs, drawers, bottom sheets, command palettes (⌘K), image lightboxes, full-screen mobile nav. Escape, scroll lock, and focus handling are what make a modal accessible, so none of them are optional.

**When not to:** non-modal floating UI (dropdowns, tooltips, popovers), where the page behind stays interactive — scroll-locking it or moving focus there would be a bug; use [`useClickOutside`](#useclickoutside) for those. Click-outside is deliberately not bundled here either, because modals vary on backdrop-click behaviour (a ⌘K palette dismisses, an unsaved-changes dialog shouldn't) — put that on your own backdrop (see the example). Pair with [`useMountTransition`](#usemounttransition) when the overlay animates in and out.

```tsx
function Drawer({ open, onClose, children }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayDismiss({ open, onDismiss: onClose, panelRef });

  if (!open) return null;
  return (
    <div className="backdrop" onClick={onClose}>
      <div ref={panelRef} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
```

## Timing

| Hook | What it does |
| --- | --- |
| [`useCountdown`](#usecountdown) | Ticks from N seconds down to 0, with an `M:SS` label |
| [`useDebouncedValue`](#usedebouncedvalue) | Debounced copy of a fast-changing value |

### useCountdown

```ts
useCountdown(durationSeconds: number): {
  remaining: number;   // seconds left, 0 when idle
  formatted: string;   // "M:SS", e.g. "1:05"
  isActive: boolean;   // remaining > 0
  start: () => void;   // (re)start from durationSeconds
}
```

Ticks once per second from `durationSeconds` down to 0. Call `start()` to kick it off (or restart it); it begins idle. The classic use is a resend-code cooldown:

```tsx
const { formatted, isActive, start } = useCountdown(60);

<button onClick={() => { resendCode(); start(); }} disabled={isActive}>
  {isActive ? `Resend in ${formatted}` : "Resend code"}
</button>;
```

### useDebouncedValue

```ts
useDebouncedValue<T>(value: T, delay?: number): T // delay default: 300ms
```

Returns a debounced copy of `value` that only updates after `delay` ms have elapsed without `value` changing again — for throttling expensive work driven by fast-changing input, like firing a search request as the user types.

```tsx
const [query, setQuery] = useState("");
const debouncedQuery = useDebouncedValue(query, 300);

useEffect(() => {
  if (debouncedQuery) search(debouncedQuery);
}, [debouncedQuery]);
```

## Forms and scrolling

| Hook | What it does |
| --- | --- |
| [`useFormErrorScroll`](#useformerrorscroll) | Scrolls a form into view and surfaces the first error on invalid submit |
| [`useScrollIntoView`](#usescrollintoview) | Smoothly scrolls a ref'd element into view — position, behaviour, and offset configurable |

### useFormErrorScroll

```ts
useFormErrorScroll<T extends HTMLElement = HTMLElement>(
  onError?: (firstMessage: string | undefined) => void,
  scrollOptions?: UseScrollIntoViewOptions, // offset / block / behavior, as in useScrollIntoView
): { ref: RefObject<T | null>; scrollIntoView: () => void; onInvalid: (errors: unknown) => void }
```

Scrolls a form back into view and surfaces the first leaf error message when submit-time validation fails. Wire `ref` to the scrollable container (usually the form element itself) and pass `onInvalid` to your form library's invalid-submit callback — it matches the shape of react-hook-form's `handleSubmit(onValid, onInvalid)` second argument, but any nested errors object works. The optional `onError` callback receives the first nested error message — surface it in a top-of-form alert if you have one, otherwise rely on inline field errors becoming visible as the form scrolls. By default the form lands at the top (`block: "start"`); pass `scrollOptions` to land it elsewhere. In development builds the raw error tree is also logged, which helps diagnose errors on fields hidden by conditional UI.

```tsx
// With a top-of-form alert
const { ref, onInvalid } = useFormErrorScroll<HTMLFormElement>(
  (firstMessage) => setFormError(firstMessage ?? "Please fill in all required fields."),
);
return <form ref={ref} onSubmit={handleSubmit(onValid, onInvalid)}>…</form>;

// Without one — just scroll so the inline field errors come into view
const { ref, onInvalid } = useFormErrorScroll<HTMLFormElement>();
return <form ref={ref} onSubmit={handleSubmit(onValid, onInvalid)}>…</form>;
```

### useScrollIntoView

```ts
useScrollIntoView<T extends HTMLElement = HTMLElement>(options?: {
  offset?: number;              // default: 24 — breathing room, applied as scroll-margin
  block?: ScrollLogicalPosition; // default: "start" — also "center" | "end" | "nearest"
  behavior?: ScrollBehavior;     // default: "smooth"
}): { ref: RefObject<T | null>; scrollIntoView: () => void }
```

Returns a ref and a function that scrolls the ref'd element into view on demand. `block` decides where it lands: `"start"` (the default) brings it to the top — the form-error case — `"center"` suits highlighting an item mid-list, and `"nearest"` scrolls the minimum distance. The scroll is deferred one animation frame so content rendered in the same update (like an error alert) exists before the browser measures, and `"smooth"` is downgraded to an instant jump when the user prefers reduced motion (WCAG 2.3.3).

```tsx
const { ref, scrollIntoView } = useScrollIntoView<HTMLFormElement>();
useEffect(() => { if (hasErrors) scrollIntoView(); }, [hasErrors, scrollIntoView]);
return <form ref={ref}>…</form>;

// Centre the active item in a long list instead
const { ref, scrollIntoView } = useScrollIntoView<HTMLLIElement>({ block: "center" });
```

## Files and clipboard

| Hook | What it does |
| --- | --- |
| [`useCopyFeedback`](#usecopyfeedback) | Clipboard write plus the transient "Copied" state |
| [`useObjectUrl`](#useobjecturl) | Object URL for a single Blob/File, revoked on cleanup |
| [`useObjectUrlMap`](#useobjecturlmap) | Object URLs for a dynamic list, created and revoked as items come and go |

### useCopyFeedback

```ts
useCopyFeedback(feedbackMs?: number): { // feedbackMs default: 2000
  copy: (text: string, key?: string) => Promise<boolean>;
  isCopied: (key?: string) => boolean;
  copiedKey: string | null;
}
```

Clipboard write plus the transient "Copied" state every copy button repeats. The state is keyed rather than boolean so a **list** can show feedback on just the row that was copied; callers with a single button ignore the key entirely. `copy` returns whether the write succeeded rather than handling failure itself — the clipboard is blocked in insecure (non-HTTPS) contexts, and each app words that error differently.

Announce the state change to screen readers with an `aria-live` region — the visual label swap alone is silent:

```tsx
// Single button
const { copy, isCopied } = useCopyFeedback();
<button onClick={() => copy(inviteUrl)}>
  <span aria-live="polite">{isCopied() ? "Copied!" : "Copy link"}</span>
</button>;

// List — each row keys its own feedback
const { copy, isCopied } = useCopyFeedback();
{tokens.map((t) => (
  <button key={t.id} onClick={() => copy(t.value, t.id)}>
    {isCopied(t.id) ? "Copied!" : "Copy"}
  </button>
))}
```

### useObjectUrl

```ts
useObjectUrl(blob: Blob | null): string | null
```

Creates an object URL for a Blob/File and revokes it on cleanup to prevent memory leaks — the single-item counterpart of [`useObjectUrlMap`](#useobjecturlmap). The canonical use is previewing a just-picked file before upload.

```tsx
const [file, setFile] = useState<File | null>(null);
const previewUrl = useObjectUrl(file);

<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />;
{previewUrl && <img src={previewUrl} alt="" />}
```

### useObjectUrlMap

```ts
useObjectUrlMap<T>(
  items: T[],
  getId: (item: T) => string,
  getFile: (item: T) => Blob,
): Record<string, string> // id → object URL
```

Maintains a map of object URLs for a **dynamic list** of files — creates a URL when an item first appears, revokes it when the item leaves the list, and revokes everything on unmount. Safe for upload queues and other lists where items are added and removed over time. Pass stable (module-level or memoized) `getId` / `getFile` accessors so the reconciliation effect only re-runs when `items` actually changes.

```tsx
const getId = (item: QueueItem) => item.id;
const getFile = (item: QueueItem) => item.file;

function UploadQueue({ queue }: { queue: QueueItem[] }) {
  const urls = useObjectUrlMap(queue, getId, getFile);
  return queue.map((item) => <img key={item.id} src={urls[item.id]} alt="" />);
}
```

## Page and browser state

| Hook | What it does |
| --- | --- |
| [`useCookieConsent`](#usecookieconsent) | Reactive cookie-consent state for any consent platform, via adapters |
| [`usePageTitle`](#usepagetitle) | Page-declared titles rendered by a shared header (the Linear/Notion pattern) |
| [`useVisibilityChange`](#usevisibilitychange) | Callbacks when the tab is hidden or becomes visible again |

### useCookieConsent

```ts
useCookieConsent<C extends string>(
  categories: readonly C[],
  adapter?: CookieConsentAdapter, // default: vanilla-cookieconsent adapter
): Record<C, boolean | null>

interface CookieConsentAdapter {
  readCategory(category: string): boolean | null;
  subscribe(onChange: () => void): () => void;
}

createVanillaCookieConsentAdapter(instance?: { acceptedCategory(category: string): boolean }): CookieConsentAdapter
```

Reactive cookie-consent state for any consent-management platform (CMP). You name the categories — they must match the ones your consent banner is configured with — and the hook returns a live, typed record of them. Every category reads `null` until the CMP has initialised (i.e. on first paint, before its script runs), which lets you distinguish "not yet decided" from an explicit rejection.

```tsx
// vanilla-cookieconsent — works out of the box, no adapter needed
const consent = useCookieConsent(["necessary", "analytics", "marketing"]);

useEffect(() => {
  if (consent.analytics) initAnalytics();
}, [consent.analytics]);
```

If you load vanilla-cookieconsent from the CDN/UMD build, the default adapter finds the `window.CookieConsent` global automatically. If you import the ESM build, pass the module in:

```tsx
import * as CookieConsent from "vanilla-cookieconsent";
import { createVanillaCookieConsentAdapter, useCookieConsent } from "@timonwa/react-hooks";

const adapter = createVanillaCookieConsentAdapter(CookieConsent); // module-level: adapters must be stable references
const consent = useCookieConsent(["necessary", "analytics"], adapter);
```

Any other CMP (OneTrust, Cookiebot, your own banner) plugs in with a two-method adapter:

```tsx
const myCmpAdapter: CookieConsentAdapter = {
  readCategory: (category) => myCmp.isAccepted(category), // return null while the CMP hasn't loaded
  subscribe: (onChange) => {
    myCmp.on("change", onChange);
    return () => myCmp.off("change", onChange);
  },
};

const consent = useCookieConsent(["functional", "performance"], myCmpAdapter);
```

Custom adapters must be **stable references** (module-level or memoized) — the subscription re-wires whenever the adapter identity changes. Inline `categories` arrays are fine; the hook keys off their contents, not their identity.

### usePageTitle

```ts
PageTitleProvider(props: { children: ReactNode })
usePageTitle(title?: string): { title: string | null; setTitle: (title: string | null) => void }
```

Shell-rendered page titles — the Linear/Notion pattern where the page declares its title and a shared header displays it. Wrap the layout once with `<PageTitleProvider>`; pages call `usePageTitle("…")` to register their title for as long as they're mounted, and the header/navbar calls `usePageTitle()` with no argument to read it. Titles clear on unmount, so navigating away resets the header automatically.

```tsx
// In the layout, once:
<PageTitleProvider>
  <Header />
  {children}
</PageTitleProvider>;

// In a page:
usePageTitle("Events");

// In the header:
const { title } = usePageTitle();
return <h1>{title ?? "Dashboard"}</h1>;
```

### useVisibilityChange

```ts
useVisibilityChange(options: {
  onVisible?: () => void;
  onHidden?: () => void;
  enabled?: boolean; // default: true
}): void
```

Tracks browser tab visibility via the Page Visibility API — refetch on tab focus instead of polling on a timer.

```tsx
useVisibilityChange({
  onVisible: () => refetchNotifications(),
  onHidden: () => pauseExpensiveWork(),
});
```

## SSR and server components

Every hook is a client hook. The built output carries a `"use client"` banner, so in React Server Component frameworks you can import from this package inside any client component with no extra ceremony — and importing from a server component fails with the framework's clear boundary error rather than a runtime hooks crash. Hooks that read browser state (`useMediaQuery`, `usePrefersReducedMotion`, `useCookieConsent`, `useTheme`) return deterministic server snapshots (`false` / `null` / the default theme) so hydration never mismatches; the real values apply immediately after mount.

## Contributing

Bug reports and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
