# TGE — Sprint & Task Breakdown

Execution plan derived from [girlfriend-effect-prototype-plan.md](./girlfriend-effect-prototype-plan.md).

## Progress

Legend: ✅ done · 🟡 partly done (blocker noted) · ⬜ not started

| Sprint | Status |
|---|---|
| 0 — Foundation | ✅ all code landed, native build verified |
| 1 — Domain + data layer + catalog | ✅ 34 tests green, round-trip verified on emulator |
| 2 — Stylist flow: boards & pins | ⬜ |
| 3 — Firestore swap + sharing + intake | ⬜ |
| 4 — Curated shop, cart, fake checkout | ⬜ |
| 5 — Confirmation, polish, instrumentation | ⬜ |
| 6 — Ship to testers | ⬜ |

**Open blockers**

1. **Firebase project not yet created** (task 0.7, console-only). Not urgent
   until Sprint 3, but it gates that sprint entirely.
2. **Catalog imagery is placeholders.** Named grey boxes, not product photos.
   Fine for building against; has to be replaced before the test round, since
   a shop grid of grey boxes cannot tell us whether recipients buy. Due with
   4.1 at the latest.

## Decisions locked before Sprint 0

| Decision | Choice | Why |
|---|---|---|
| Framework | **Bare React Native 0.87.1** (existing scaffold, not Expo) | Repo is already scaffolded. Tradeoff accepted: testers need an installed APK, not an Expo Go QR code. *Correction 2026-09-24: this row originally said Android Studio was configured — it is installed but its SDK never was. See blocker 1.* |
| Language | TypeScript, strict | Already configured. |
| Navigation | React Navigation 7 (native-stack) | Standard, typed routes. |
| State | React Context + hooks | Per plan §5. No Redux/Zustand. |
| Data access | **Repository (ports & adapters) pattern** | The "mock now, swap later" requirement. See below. |
| Local persistence | AsyncStorage behind the repo interfaces | Survives app restarts during demos. |
| Shared backend | Firebase Firestore, `@react-native-firebase/*` | Needed only for cross-device board sharing (plan §5). |
| Catalog | Hardcoded seed JSON | Per plan §1. |
| Payments / real auth | **None.** Not a gap — a deliberate scope decision. | Plan §1. |

### The no-refactor guarantee

Everything the UI touches goes through interfaces, never a concrete implementation:

```
src/
  domain/          # types (plan §4) + PURE logic. No React, no I/O. Unit-tested.
    types.ts
    matching.ts    # matchCatalog(items, board, sizing) -> CatalogItem[]
  data/
    ports.ts       # BoardRepository, UserRepository, OrderRepository, CatalogRepository
    local/         # AsyncStorage adapters  (Sprint 1)
    firestore/     # Firestore adapters     (Sprint 3) — additive, nothing else changes
    RepositoryProvider.tsx   # picks the adapter set; exposes useRepositories()
  features/
    boards/ share/ intake/ shop/ cart/ confirmation/
  ui/              # Button, Screen, Card, Text — design tokens in one place
  config/          # feature flags, theme
```

**Hard rule, enforced in review:** no file under `features/` may import from
`data/local/` or `data/firestore/`. They import `data/ports` types and call
`useRepositories()`. Swapping the backend then means changing one line in
`RepositoryProvider`, not touching any screen.

All repository methods are `async` from day one — even the local ones that
resolve instantly — so nothing needs to change shape when a real network
call replaces them.

## Git workflow

- One branch per sprint: `sprint/0-foundation`, `sprint/1-data`, …
- **One commit per task below.** Each task is scoped to be independently committable and revertible.
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- Merge to `main` at the end of each sprint, only when the app still builds and `npm run verify` passes. `main` always runs.

---

## Sprint 0 — Foundation (Day 1, ~half day) ✅

Goal: a running app shell with navigation, tooling, and quality gates.

Branch `sprint/0-foundation`. `npm run verify` is green. Native build verified and debug APK generated.

| # | Task | Commit | Status |
|---|---|---|---|
| 0.1 | Add `CLAUDE.md`: bare RN + TS, Firestore for boards/users/orders, hardcoded catalog, **explicitly no payment processing or real auth** | `docs: add project CLAUDE.md` | ✅ |
| 0.2 | Add `typecheck` + `verify` (`lint && typecheck && test`) scripts; enable `strict` TS | `chore: add typecheck and verify scripts` | ✅ |
| 0.3 | Install React Navigation 7 + `react-native-screens`, `@react-native-async-storage/async-storage`; Android rebuild to confirm native linking | `chore: add navigation and storage deps` | ✅ all native modules autolinkered and compiled |
| 0.4 | `src/` skeleton per the tree above (empty barrel files) | `chore: scaffold src directory structure` | ✅ |
| — | *Added:* ESLint rules enforcing `features/` ↛ `data/local|firestore` and domain purity, so `verify` catches boundary breaks instead of review | `chore: enforce architecture boundaries in eslint` | ✅ |
| 0.5 | Design tokens + `ui/` primitives: `Screen`, `Text`, `Button`, `Card` | `feat(ui): add base components and design tokens` | ✅ |
| 0.6 | Root navigator + Role Select screen wired into `App.tsx`; delete `NewAppScreen` boilerplate | `feat(nav): add root navigator and role select screen` | ✅ both role buttons inert until 2.1 / 3.5 |
| 0.7 | **In parallel, no code:** create the Firebase project in the web console, enable Firestore in test mode, download `google-services.json` (do NOT commit — add to `.gitignore`) | `chore: gitignore firebase credentials` | 🟡 gitignore done; **console task outstanding** |
| — | **Verification:** commit `android/local.properties` so fresh clones can build immediately | `chore: add android/local.properties; build verified` | ✅ |

**Done when:** app launches on the emulator, Role Select renders, `npm run verify` is green.
→ Both achieved: `verify` passes, native build succeeds with debug APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

Two RN 0.87 surprises worth remembering: `StatusBar` no longer accepts
`backgroundColor` or `translucent` (edge-to-edge made the bar permanently
translucent), and Jest needed `transformIgnorePatterns` widened because React
Navigation and `react-native-screens` ship untranspiled ESM.

---

## Sprint 1 — Domain + data layer + catalog (Day 1–2) ✅

Goal: every piece of business logic exists and is tested, with zero UI dependency.

Branch `sprint/1-data`, stacked on `sprint/0-foundation` because Sprint 0 was
still open for review.

| # | Task | Commit | Status |
|---|---|---|---|
| 1.1 | `domain/types.ts` — `User`, `SizingProfile`, `Pin`, `Board`, `CatalogItem`, `Order` verbatim from plan §4 | `feat(domain): add core data model types` | ✅ plus `Board.shareCode` for 3.4, and `StyleTag[]` in place of `string[]` |
| 1.2 | `data/ports.ts` — the four repository interfaces, all methods async | `feat(data): define repository interfaces` | ✅ |
| 1.3 | Seed catalog: ~40 items across the 7 retailers, tagged + sized, with image URLs | `feat(catalog): add hardcoded catalog seed data` | ✅ 48 items; **imagery is placeholders** |
| 1.4 | `domain/matching.ts` — tag overlap **and** category-correct size match (`top`→shirtSize, `bottom`→pant waist/inseam, `shoes`→shoeSize, `outerwear`→shirtSize, `accessory`→no size filter) | `feat(domain): add catalog matching logic` | ✅ |
| 1.5 | **Unit tests for matching** — the one piece of real logic in the app; cheap to test, expensive to get wrong in front of testers | `test(domain): cover catalog matching rules` | ✅ 33 cases, mutation-checked |
| 1.6 | `data/local/` AsyncStorage adapters implementing all four ports | `feat(data): add local storage repository adapters` | ✅ |
| 1.7 | `RepositoryProvider` + `useRepositories()` hook; wire into `App.tsx` | `feat(data): add repository provider and hook` | ✅ `flags.backend` added early so 3.3 is genuinely one line |
| 1.8 | Dev-only seeding/reset helper (wipes AsyncStorage, reloads catalog) | `feat(dev): add data reset helper` | ✅ |
| — | *Added:* reset reads records back instead of trusting the clear call | `feat(dev): make reset verify itself against the repositories` | ✅ |

**Done when:** tests pass; a throwaway screen can create and read back a board.
→ Done, and not throwaway. 34 tests pass. The dev panel on Role Select is the
acceptance check made permanent, and it was exercised on an API 28 emulator:
seed reported write plus read-back plus a `listByOwner` count, the board
survived a force-stop, and reset reported the board and user confirmed gone.

Notes carried forward:

- **Catalog imagery is named grey boxes.** Real product photography has to be
  sourced before testers see the shop grid (4.1) — a prototype full of
  placeholders cannot tell us whether recipients buy.
- The matching suite was checked against seven deliberate mutations of
  `matching.ts` and caught all seven, so a green run means something.
- Two conventions the catalog and matching rules agree on: every `bottom` is
  sized waist × inseam, and there are no shorts.
- Emulator note: the only AVD is API 28 and its system image lives in the
  **old** SDK, so it needs `ANDROID_SDK_ROOT` pointed at
  `C:\Program Files (x86)\Android\android-sdk` to launch.

---

## Sprint 2 — Stylist flow: boards & pins (Day 2–3) ⬜

| # | Task | Commit |
|---|---|---|
| 2.1 | Board list screen — boards I've created, empty state, "New board" CTA | `feat(boards): add board list screen` |
| 2.2 | Create-board flow — title + style tag picker (fixed tag vocabulary: old money, streetwear, athleisure, minimal, workwear, preppy) | `feat(boards): add board creation` |
| 2.3 | Board editor — pin grid, delete pin, reorder deferred | `feat(boards): add board editor screen` |
| 2.4 | Add-pin: image picker from camera roll + optional note/source URL (`react-native-image-picker`) | `feat(boards): add pin from camera roll` |
| 2.5 | Add-pin by image URL — fallback path, and how you'll seed demo boards fast | `feat(boards): add pin by url` |
| 2.6 | Per-pin tags, defaulting to the board's style tags | `feat(boards): add pin tagging` |

**Done when:** you can build a real-looking 8-pin board end to end on device.

> Images are stored as local file URIs in Sprint 2. Sprint 3 decides whether
> they need uploading — see 3.6.

---

## Sprint 3 — Firestore swap + sharing + sizing intake (Day 3–4) ⬜

This is the **highest-risk sprint** — it's the only part that can't be faked,
and the whole test card depends on it working across two phones. It's placed
here, not last, so there's slack if native Firebase config fights back.

| # | Task | Commit |
|---|---|---|
| 3.1 | Install `@react-native-firebase/app` + `/firestore`, Android native config, verify connection | `chore: add firebase dependencies and config` |
| 3.2 | `data/firestore/` adapters implementing the same four ports | `feat(data): add firestore repository adapters` |
| 3.3 | Flip `RepositoryProvider` to Firestore behind a `config` flag; keep local adapters for tests/offline dev | `feat(data): switch active adapters to firestore` |
| 3.4 | Share sheet — generate a short human-typable code (e.g. `TGE-4F9K`), mark board `sentAt`, native share to text | `feat(share): add share sheet and code generation` |
| 3.5 | Join screen — enter code, resolve board, claim as recipient | `feat(share): add join by code flow` |
| 3.6 | Pin images: upload to Firebase Storage on share (local file URIs are invisible to the other phone) | `feat(share): upload pin images on send` |
| 3.7 | Sizing intake form — shirt, pant waist/inseam, shoe, optional fit; persisted to the recipient's profile, shown once | `feat(intake): add sizing intake form` |

**Done when:** a board created on phone A is visible, with images, on phone B after entering the code.

> If 3.1/3.6 turn into a native-config rabbit hole, the fallback is the
> Firebase JS SDK (`firebase` npm, `experimentalForceLongPolling: true`) —
> no native rebuild, slightly less reliable streaming. Decide by end of Day 4;
> don't let this eat the week.

---

## Sprint 4 — Curated shop, cart, fake checkout (Day 4–5) ⬜

| # | Task | Commit |
|---|---|---|
| 4.1 | Curated shop grid — `matchCatalog` applied, retailer badge, price, empty state | `feat(shop): add curated shop grid` |
| 4.2 | Item detail sheet — larger image, size confirm, "Add to bag" | `feat(shop): add item detail sheet` |
| 4.3 | Cart context + persistent bag across screens | `feat(cart): add cart state` |
| 4.4 | Cart screen — line items, remove, running total | `feat(cart): add cart screen` |
| 4.5 | Fake checkout — mock shipping/payment UI that writes an `Order` and clears the bag. **No processor, no card validation.** | `feat(checkout): add fake checkout flow` |
| 4.6 | Category filter chips + "why this was picked" tag chips on each card — reinforces the curation story testers are here to feel | `feat(shop): add filters and curation context` |

**Done when:** a recipient can go code → intake → shop → bag → order in one sitting.

---

## Sprint 5 — Confirmation, polish, instrumentation (Day 5–6) ⬜

| # | Task | Commit |
|---|---|---|
| 5.1 | Confirmation screen — order summary, items, total | `feat(confirmation): add order confirmation screen` |
| 5.2 | Donate-bag UI card on confirmation | `feat(confirmation): add donate bag card` |
| 5.3 | Stylist-side receipt — "he ordered 3 of your picks", closes the emotional loop and is what drives a *second* board | `feat(boards): show order status on board list` |
| 5.4 | **Funnel instrumentation** — timestamped events to Firestore: `board_sent`, `board_opened`, `intake_completed`, `item_added`, `order_placed`. This is how you measure the >50% hit rate; without it the test round produces anecdotes, not data. | `feat(analytics): add funnel event tracking` |
| 5.5 | Visual polish pass — spacing, typography, loading and empty states | `feat(ui): polish pass across screens` |
| 5.6 | Error/edge states — bad code, empty board, no matching items, offline | `feat: handle error and empty states` |

---

## Sprint 6 — Ship to testers (Day 6–7) ⬜

| # | Task | Commit |
|---|---|---|
| 6.1 | Firestore security rules (permissive but not wide-open — enough that a stranger can't dump the DB) | `chore: add firestore security rules` |
| 6.2 | App icon, name, splash | `chore: add app branding` |
| 6.3 | Release APK build + install instructions for testers | `docs: add tester install instructions` |
| 6.4 | Seed 3–5 demo boards so testers aren't staring at an empty app | `feat(dev): add demo board seeds` |
| 6.5 | Full manual QA pass on two physical devices | — |
| 6.6 | `docs/test-round.md` — what to measure, how to read the funnel | `docs: add test round measurement guide` |

**Done when:** an APK is installable by someone who isn't you, and the funnel records their run.

---

## Risks

| Risk | Mitigation |
|---|---|
| Native Firebase config eats a day | Sprint 3 is early with slack; JS SDK fallback documented in 3.6 |
| iOS untested — no Mac in the loop | Target Android for the test round; iOS is out of scope this week |
| Image upload is slower than expected | Compress on pick; cap pins per board at ~12 |
| Scope creep into subscription/affiliate features | Plan §7 defers both. Neither is in any sprint. Don't add them. |

## Out of scope this week

Real payments · real auth · retailer APIs · subscription tiers · affiliate link plumbing · recommendation ML · push notifications · in-app messaging · return/donation logistics.