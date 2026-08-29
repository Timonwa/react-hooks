# Contributing

## Setup

```bash
pnpm install
pnpm verify   # typecheck, lint, test, build, publint, attw — the same gate CI runs
```

## Adding a function

- **It has to earn its place.** A helper belongs here once it's needed in more than one app. Anything specific to a single product stays in that product.
- **Universal by default.** New functions go in `src/`. Only put something in `src/browser/` if it touches `window`, `document`, `navigator`, or `localStorage` — and guard for that API being absent so a stray import during SSR degrades instead of throwing.
- **One file per hook**, kebab-cased after it, inside its module folder — `src/string/mask-string.ts`. Internal helpers a module shares live in that module's `_shared.ts` and never reach the barrel.
- **Export it explicitly** from the module's `index.ts`, one line per symbol, alphabetical. Only the entry-point barrels compose with `export *`.
- **Verb-first, full words.** `convertBytesToMegabytes`, not `toMB`.
- **Wrapping a dependency is fine, but it has to add something** — a better name, a different default, extra behaviour. A one-line re-export under the same name is indirection with no payoff.
- **Tests cover the edges, not the happy path alone.** The zero, the negative, the `NaN`, the value that overflows the largest unit.

## Releasing

Every change that affects the published package needs a changeset:

```bash
pnpm changeset
```

Pick the bump — patch for a fix, minor for a new function, major for a breaking change — and describe it in a sentence a consumer would understand. Merging to `main` opens a "Version Packages" PR; merging *that* publishes to npm. So a release is always a reviewed merge, never a surprise from a push.

Publishing uses npm Trusted Publishing over OIDC, so there's no token to hold. Nobody needs credentials to contribute.
