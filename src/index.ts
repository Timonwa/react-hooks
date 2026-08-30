// The public surface — one folder per README group, explicit exports in each barrel.
export {
  type CookieConsentAdapter,
  createVanillaCookieConsentAdapter,
  PageTitleProvider,
  useCookieConsent,
  usePageTitle,
  useVisibilityChange,
} from "./browser/index.js";
export {
  useCopyFeedback,
  useObjectUrl,
  useObjectUrlMap,
} from "./files/index.js";
export {
  type UseScrollIntoViewOptions,
  useFormErrorScroll,
  useScrollIntoView,
} from "./forms/index.js";
export {
  useClickOutside,
  useMountTransition,
  useOverlayDismiss,
} from "./overlays/index.js";
export {
  type ResolvedThemeType,
  type ThemeAttributeType,
  type ThemeChoiceType,
  ThemeProvider,
  ThemeScript,
  useMediaQuery,
  usePrefersReducedMotion,
  useTheme,
} from "./theming/index.js";
export { useCountdown, useDebouncedValue } from "./timing/index.js";
