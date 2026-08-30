# @timonwa/react-hooks

## 0.1.2

### Patch Changes

- [`57711e7`](https://github.com/Timonwa/react-hooks/commit/57711e70374f593b72bcdac9c87cf049e5cb12ef) Thanks [@Timonwa](https://github.com/Timonwa)! - `ThemeProvider` now honours its `defaultTheme` prop when no choice is stored. It previously fell back to `"system"` regardless, contradicting the pre-hydration `ThemeScript`, which applied `defaultTheme` correctly — so `<ThemeProvider defaultTheme="dark">` flipped to the OS preference on hydration.

## 0.1.1

### Patch Changes

- [`4a6b535`](https://github.com/Timonwa/react-hooks/commit/4a6b535f9bfa8f159e2c2f6288929ea8d33c08d5) Thanks [@Timonwa](https://github.com/Timonwa)! - `useOverlayDismiss` now traps Tab / Shift+Tab inside the open panel (the WAI-ARIA dialog pattern) and genuinely prefers the `[data-autofocus]` target for initial focus regardless of its DOM position. Full test coverage added across all sixteen hooks.

## 0.1.0

### Minor Changes

- [`fcfa949`](https://github.com/Timonwa/react-hooks/commit/fcfa9492b02411982dd420eb6347261e2dc2bab3) Thanks [@Timonwa](https://github.com/Timonwa)! - Initial release — sixteen typed client-side hooks: `ThemeProvider`/`useTheme`/`ThemeScript` (class or `data-theme` attribute, configurable storage key, flash-free pre-hydration script), `useMediaQuery`, `usePrefersReducedMotion`, `useDebouncedValue`, `useClickOutside`, `useOverlayDismiss`, `useMountTransition`, `useCopyFeedback`, `useCookieConsent` (caller-defined categories, CMP-agnostic via adapters, vanilla-cookieconsent adapter included), `useCountdown`, `useFormErrorScroll`, `useObjectUrl`, `useObjectUrlMap` (leak-free — revokes from a ref on unmount), `usePageTitle`, `useScrollIntoView` (configurable `block`/`behavior`/`offset`, reduced-motion aware), and `useVisibilityChange`. Ships ESM + CJS with a `"use client"` banner.
