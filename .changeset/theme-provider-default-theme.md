---
"@timonwa/react-hooks": patch
---

`ThemeProvider` now honours its `defaultTheme` prop when no choice is stored. It previously fell back to `"system"` regardless, contradicting the pre-hydration `ThemeScript`, which applied `defaultTheme` correctly — so `<ThemeProvider defaultTheme="dark">` flipped to the OS preference on hydration.
