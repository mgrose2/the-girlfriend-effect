# TGE — The Girlfriend Effect

A **prototype**, not a production app. Someone curates a style board, sends it
to a partner, and the partner picks clothes from a filtered catalog and
"checks out." The whole point is to find out whether recipients actually
complete a purchase — target is a >50% hit rate.

Plans live in `docs/plans/`:
[overall plan](docs/plans/girlfriend-effect-prototype-plan.md) ·
[sprint breakdown](docs/plans/build-sprints.md).

## Stack

- **Bare React Native 0.87** + TypeScript (strict). Not Expo — the repo was
  already scaffolded this way and re-scaffolding wasn't worth the week.
- **React Navigation 7** (native-stack)
- **React Context + hooks** for state. No Redux, no Zustand.
- **AsyncStorage** now, **Firestore** (`@react-native-firebase`) from Sprint 3
- **Android and iOS.** Android is built and verified; iOS is in scope as of
  Sprint 7 because the test round's recipients are iPhone users, but it has
  never been compiled — see `docs/ios-testflight.md`. iOS work happens on the
  MacBook Pro, not the Windows dev machine.

## Deliberately not building

These are **decisions, not gaps**. Don't add them, and don't add validation or
hardening that implies them:

- **No payment processing.** Checkout writes an `Order` record and stops. No
  processor, no card fields, no PCI anything.
- **No real auth.** Name-only identity, no passwords, no sessions, no tokens.
- **No retailer APIs.** The catalog is hardcoded JSON seed data.
- **No recommendation ML.** Tag overlap plus a size check is the whole
  algorithm and it is sufficient.
- No subscription tiers, affiliate link plumbing, push notifications, in-app
  messaging, or return/donation logistics.

If a change seems to need one of these, it's a sign the change is out of
scope — say so rather than building toward it.

## Architecture rule (the one that matters)

Data access goes through interfaces so the local store can be swapped for
Firestore without touching UI:

```
src/
  domain/    types + pure logic (no React, no I/O) — unit tested
  data/      ports.ts (interfaces) · local/ · firestore/ · RepositoryProvider
  features/  boards · share · intake · shop · cart · confirmation
  ui/        shared primitives and design tokens
  config/    flags and theme
```

**Nothing under `features/` may import from `data/local/` or
`data/firestore/`.** Screens import types from `data/ports` and get instances
from `useRepositories()`. Every repository method is `async`, including the
local ones that resolve instantly, so swapping in a network call changes no
call sites.

## Conventions

- One commit per task, conventional prefixes (`feat:`, `fix:`, `chore:`,
  `refactor:`, `test:`, `docs:`). Scope the feature where it helps:
  `feat(shop): ...`.
- One branch per sprint (`sprint/0-foundation`), merged to `main` only when
  the app builds and `npm run verify` passes.
- `npm run verify` = lint + typecheck + test. Run it before merging.
- Tests are for `domain/` logic, not screens. Matching rules are the only
  real logic in the app; UI gets manual QA.

## Agents

`dev-agents@mark-claude-kit` is installed: `test-runner`, `build-debugger`
(reads raw Metro/Gradle failures), `code-reviewer`.