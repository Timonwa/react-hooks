# @timonwa/react-hooks

## 0.1.0

### Minor Changes

- [`fcfa949`](https://github.com/Timonwa/react-hooks/commit/fcfa9492b02411982dd420eb6347261e2dc2bab3) Thanks [@Timonwa](https://github.com/Timonwa)! - Initial release — sixteen typed client-side hooks: `ThemeProvider`/`useTheme`/`ThemeScript` (class or `data-theme` attribute, configurable storage key, flash-free pre-hydration script), `useMediaQuery`, `usePrefersReducedMotion`, `useDebouncedValue`, `useClickOutside`, `useOverlayDismiss`, `useMountTransition`, `useCopyFeedback`, `useCookieConsent` (caller-defined categories, CMP-agnostic via adapters, vanilla-cookieconsent adapter included), `useCountdown`, `useFormErrorScroll`, `useObjectUrl`, `useObjectUrlMap` (leak-free — revokes from a ref on unmount), `usePageTitle`, `useScrollIntoView` (configurable `block`/`behavior`/`offset`, reduced-motion aware), and `useVisibilityChange`. Ships ESM + CJS with a `"use client"` banner.
