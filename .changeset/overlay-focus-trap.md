---
"@timonwa/react-hooks": patch
---

`useOverlayDismiss` now traps Tab / Shift+Tab inside the open panel (the WAI-ARIA dialog pattern) and genuinely prefers the `[data-autofocus]` target for initial focus regardless of its DOM position. Full test coverage added across all sixteen hooks.
