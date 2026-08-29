# @timonwa/react-hooks

Typed React hooks for the DOM problems every app hits — theme with a no-flash dark mode, media queries, countdowns, object URLs that never leak, click-outside, tab visibility, and page titles. Client-side by design, framework-agnostic: nothing here assumes Next.js, a router, or any state library.

[![npm](https://img.shields.io/npm/v/@timonwa/react-hooks)](https://www.npmjs.com/package/@timonwa/react-hooks)

Ships ESM and CJS with type declarations and a `"use client"` banner, so React Server Component frameworks get the clear boundary error instead of a cryptic hooks crash.

## Quickstart

```bash
npm install @timonwa/react-hooks
# or: pnpm add @timonwa/react-hooks · yarn add @timonwa/react-hooks
```

```tsx
import { ThemeProvider, useMediaQuery, useTheme } from "@timonwa/react-hooks";

<ThemeProvider storageKey="theme">{children}</ThemeProvider>;

const { resolvedTheme, setTheme } = useTheme();
const isDesktop = useMediaQuery("(min-width: 960px)");
```

<!-- api:start -->

## API reference

Generated from the source JSDoc by `pnpm docs:api` — CI fails when it is out of date.

- **`useCopyFeedback`** — / "use client"; import { copyTextToClipboard } from "@timonwa/app-utilities/browser"; import { useState } from "react"; const SINGLE = "single"; /** Clipboard write plus the transient "Copied" state every copy button repeats. `const { copy, isCopied } = useCopyFeedback(); await copy(inviteUrl);`
- **`useDebouncedValue`** — / "use client"; import { useEffect, useState } from "react"; /** Returns a debounced copy of `value` that only updates after `delay` ms have elapsed without `value` changing again — for throttling expensive work driven by fast-changing input, like firing a search request as the user types. `const debouncedQuery = useDebouncedValue(query, 300);`
- **`useMediaQuery`** — breakpoint in JS, since a class cannot toggle logic. `const isDesktop = useMediaQuery("(min-width: 960px)");`
- **`useMountTransition`** — / "use client"; import { type TransitionEvent, useEffect, useState } from "react"; /** Drives an enter/exit CSS transition for a component that mounts and unmounts with `open`. `const { mounted, shown, handleTransitionEnd } = useMountTransition(open);`
- **`useOverlayDismiss`** — handling. `useOverlayDismiss({ open, onDismiss: close, panelRef });`
- **`usePrefersReducedMotion`** — / "use client"; import { useMediaQuery } from "./use-media-query"; /** Whether the user prefers reduced motion. `const skipAnimation = usePrefersReducedMotion();`

<!-- api:end -->

## Conventions

- **Hooks are `use`-prefixed, one file per hook**, with the JSDoc you'll see in your editor.
- **SSR-safe by default** — every hook guards for its API being absent; server snapshots are deterministic so hydration never mismatches.
- **Nothing project-specific is baked in** — storage keys, thresholds, and callbacks are parameters with sensible defaults.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — one file per hook, tests through the barrel, changesets for release.

## License

[MIT](LICENSE)
