# TGE — Sprint & Task Breakdown

Execution plan derived from [girlfriend-effect-prototype-plan.md](./girlfriend-effect-prototype-plan.md).

## Progress

Legend: ✅ done · 🟡 partly done (blocker noted) · ⬜ not started

| Sprint | Status |
|---|---|
| 0 — Foundation | ✅ all code landed, native build verified |
| 1 — Domain + data layer + catalog | ✅ 34 tests green, round-trip verified on emulator |
| 2 — Stylist flow: boards & pins | ✅ full stylist flow driven on emulator |
| 3 — Firestore swap + sharing + intake | ✅ Firestore and Storage both live and verified |
| 4 — Curated shop, cart, fake checkout | ✅ full recipient run verified, order in Firestore |
| 5 — Confirmation, polish, instrumentation | ✅ `npm run verify` green, not yet device-verified |
| 6 — Ship to testers | 🟡 build/docs/seed done; rules deploy and 2-phone QA still needed |

**Open blockers**

1. **Catalog imagery is still placeholders.** They now render — the cause was
   placehold.co serving SVG without a `.png` extension — but they are grey-ish
   boxes with the product name, not photographs. Real imagery is still needed
   before the test round, since the question being measured is whether someone
   wants to buy what they see.
2. **Two phones have never been tested.** Every flow so far has been driven on
   one emulator with both roles. The data is genuinely shared via Firestore,
   so it should work, but the un-fakeable piece of the product remains
   unproven on real hardware.
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

## Sprint 2 — Stylist flow: boards & pins (Day 2–3) ✅

Branch `sprint/2-boards`, stacked on `sprint/1-data`.

| # | Task | Commit | Status |
|---|---|---|---|
| — | *Supporting:* `TextField` and `Chip` primitives | `feat(ui): add TextField and Chip primitives` | ✅ |
| — | *Supporting:* name-only session, so the list knows whose boards to show | `feat(session): add session provider` | ✅ |
| 2.1 | Board list screen — boards I've created, empty state, "New board" CTA | `feat(boards): add board list screen` | ✅ |
| 2.2 | Create-board flow — title + style tag picker (fixed tag vocabulary: old money, streetwear, athleisure, minimal, workwear, preppy) | `feat(boards): add board creation` | ✅ at least one tag required |
| 2.3 | Board editor — pin grid, delete pin, reorder deferred | `feat(boards): add board editor screen` | ✅ capped at 12 pins |
| 2.4 | Add-pin: image picker from camera roll + optional note/source URL (`react-native-image-picker`) | `feat(boards): add pin from camera roll` | ✅ no runtime permission needed |
| 2.5 | Add-pin by image URL — fallback path, and how you'll seed demo boards fast | `feat(boards): add pin by url` | ✅ shares the pin-details screen |
| 2.6 | Per-pin tags, defaulting to the board's style tags | `feat(boards): add pin tagging` | ✅ **inert for matching — see below** |
| — | *Fix:* images drawn, not empty boxes | `fix(boards): draw pin images instead of empty boxes` | ✅ |
| — | *Fix:* one-pin card stretch, link-preview debounce | `fix(boards): stop one-pin cards stretching and debounce the link preview` | ✅ |

**Done when:** you can build a real-looking 8-pin board end to end on device.
→ Flow driven on an API 28 emulator: role select → board list empty state →
create with tags → editor → camera-roll pin with note and tags → saved, grid
and card thumbnails render, board survives navigation. Both add-pin sources
verified, including a remote URL served from the host.

Notes carried forward:

- **Pin tags do not affect what the recipient sees.** `matchCatalog` filters
  on `Board.styleTags` per plan §4; letting pin tags weight the shop would be
  recommendation logic the plan rules out. Stylist-side organisation only —
  decide in Sprint 4 whether that is the intent.
- **The stylist has no real name yet**, defaulting to "You". 3.4 needs it,
  since that is where the recipient sees who sent the board.
- Three device-only bugs this sprint were invisible to lint, types and tests:
  two image-layout faults and a preview that refetched per keystroke. The
  image one failed *silently* — `onLoad` fired, `onError` did not, and every
  picture was still blank. Worth remembering that RN image bugs do not
  announce themselves.
- Emulator has **no internet**, so remote images can only be checked by
  serving them from the host over `adb reverse`. The catalog's `placehold.co`
  URLs are therefore still unverified on device.

> Images are stored as local file URIs in Sprint 2. Sprint 3 decides whether
> they need uploading — see 3.6.

---

## Sprint 3 — Firestore swap + sharing + sizing intake (Day 3–4) ✅

This is the **highest-risk sprint** — it's the only part that can't be faked,
and the whole test card depends on it working across two phones. It's placed
here, not last, so there's slack if native Firebase config fights back.

Branch `sprint/3-sharing`, stacked on `sprint/2-boards`.

| # | Task | Commit | Status |
|---|---|---|---|
| 3.1 | Install `@react-native-firebase/app` + `/firestore`, Android native config, verify connection | `chore: add firebase dependencies and config` | ✅ |
| 3.2 | `data/firestore/` adapters implementing the same four ports | `feat(data): add firestore repository adapters` | ✅ |
| 3.3 | Flip `RepositoryProvider` to Firestore behind a `config` flag; keep local adapters for tests/offline dev | `feat(data): switch active adapters to firestore` | ✅ confirmed server-side, not just in-app |
| — | *Supporting:* share code generation and parsing | `feat(domain): add share code generation and parsing` | ✅ 16 tests, mutation-checked |
| 3.4 | Share sheet — generate a short human-typable code (e.g. `TGE-4F9K`), mark board `sentAt`, native share to text | `feat(share): add share sheet and code generation` | ✅ |
| 3.5 | Join screen — enter code, resolve board, claim as recipient | `feat(share): add join by code flow` | ✅ |
| 3.6 | Pin images: upload to Firebase Storage on share (local file URIs are invisible to the other phone) | `feat(share): upload pin images on send` | ✅ object in bucket, URL rewritten, renders for the recipient |
| 3.7 | Sizing intake form — shirt, pant waist/inseam, shoe, optional fit; persisted to the recipient's profile, shown once | `feat(intake): add sizing intake form` | ✅ landed inside the 3.5 commit, not its own |
| — | *Fix:* role switch no longer orphans boards | `fix(session): reuse the existing identity when switching roles` | ✅ |

**Done when:** a board created on phone A is visible, with images, on phone B after entering the code.
→ **Half met.** Boards, users and orders now live in Firestore, confirmed
server-side over the REST API rather than trusting the app — Firestore caches
writes offline, so an in-app write plus read-back proves nothing on its own.
The full flow was driven on one device: create → send → code → enter it
lowercase and unhyphenated → claimed → intake → board; rejoining skips intake,
and the stylist sees the board marked *sent*.

Images now work too: sending uploads local pin images to Storage and rewrites
the pins to download URLs. Verified three ways — the object exists in the
bucket, the Firestore document holds a `firebasestorage.googleapis.com` URL,
and the recipient's board renders that image.

**Two phones have still not been tested.** Both roles were driven on one
emulator. The data is genuinely shared now rather than device-local, so this
should work, but "should" is not "did" — worth proving before Sprint 6.

Notes carried forward:

- **3.7 was committed inside 3.5** rather than separately — the intake screen
  is only reachable from join, and the two were written together. Worth
  knowing when reviewing task-by-task.
- Share codes are assigned once and reused. Regenerating per visit would
  invalidate a code already sitting in somebody's text messages.
- A claimed board cannot be re-claimed by a different person, so two people
  entering the same code cannot swap ownership of the order that follows.
- The stylist is still named "You". 3.4 was supposed to be where a real name
  mattered; the share message currently says who made it only implicitly.
  Worth fixing before the test round.
- One device can now hold both roles without losing data. Two phones never hit
  that path, but every QA pass and demo does.

> If 3.1/3.6 turn into a native-config rabbit hole, the fallback is the
> Firebase JS SDK (`firebase` npm, `experimentalForceLongPolling: true`) —
> no native rebuild, slightly less reliable streaming. Decide by end of Day 4;
> don't let this eat the week.

---

## Sprint 4 — Curated shop, cart, fake checkout (Day 4–5) ✅

Branch `sprint/4-shop`, stacked on `sprint/3-sharing`.

| # | Task | Commit | Status |
|---|---|---|---|
| — | *Fix:* catalog images were SVG and rendered blank | `fix(catalog): request png placeholders so images actually render` | ✅ |
| 4.1 | Curated shop grid — `matchCatalog` applied, retailer badge, price, empty state | `feat(shop): add curated shop grid` | ✅ |
| 4.3 | Cart context + persistent bag across screens | `feat(cart): add cart state` | ✅ built before 4.2 — Add to bag needs it |
| 4.2 | Item detail sheet — larger image, size confirm, "Add to bag" | `feat(shop): add item detail sheet` | ✅ size shown, not chosen |
| 4.4 | Cart screen — line items, remove, running total | `feat(cart): add cart screen` | ✅ |
| 4.5 | Fake checkout — mock shipping/payment UI that writes an `Order` and clears the bag. **No processor, no card validation.** | `feat(checkout): add fake checkout flow` | ✅ includes a thin Confirmation so checkout has a destination |
| 4.6 | Category filter chips + "why this was picked" tag chips on each card — reinforces the curation story testers are here to feel | `feat(shop): add filters and curation context` | ✅ |

**Done when:** a recipient can go code → intake → shop → bag → order in one sitting.
→ Done, driven end to end on the emulator: code `TGE-7NNC` → board → 22
matched pieces → two items added → bag showing per-category sizes (M and
32x32) and $99.80 → checkout → order placed. The order was then confirmed
**server-side in Firestore** with the right items and total, not just taken on
the app's word.

Notes carried forward:

- **4.3 was built before 4.2.** Add to bag has nothing to call otherwise.
- **Size is derived, never stored.** `requiredSize` recomputes it from the
  category and the recipient's profile, so `Order.items` stays `CatalogItem[]`
  exactly as plan §4 defines it and no stored copy can disagree with what
  matched.
- **The bag is in memory and scoped to a board.** It does not survive a
  restart, which suits a flow measured in one sitting, and opening a different
  board starts fresh so one person's curation cannot end up in another's order.
- The Confirmation screen is deliberately thin — 5.1 gives it the real summary
  and 5.2 the donate-bag card.

---

## Sprint 5 — Confirmation, polish, instrumentation (Day 5–6) ✅

| # | Task | Commit | Status |
|---|---|---|---|
| 5.1 | Confirmation screen — order summary, items, total | `feat(confirmation): add order confirmation screen` | ✅ |
| 5.2 | Donate-bag UI card on confirmation | `feat(confirmation): add donate bag card` | ✅ |
| 5.3 | Stylist-side receipt — "he ordered 3 of your picks", closes the emotional loop and is what drives a *second* board | `feat(boards): show order status on board list` | ✅ |
| 5.4 | **Funnel instrumentation** — timestamped events to Firestore: `board_sent`, `board_opened`, `intake_completed`, `item_added`, `order_placed`. This is how you measure the >50% hit rate; without it the test round produces anecdotes, not data. | `feat(analytics): add funnel event tracking` | ✅ |
| 5.5 | Visual polish pass — spacing, typography, loading and empty states | `feat(ui): polish pass across screens` | ✅ ad-hoc "nothing here" blocks (three different spacings) consolidated into one `EmptyState` primitive |
| 5.6 | Error/edge states — bad code, empty board, no matching items, offline | `feat: handle error and empty states` | ✅ shop gates on missing sizing, errors get a retry action, bad-code message covers the offline-cache case; empty board is structurally impossible — the send button is hidden until a board has a pin |

**Done when:** confirmation shows a real summary, the stylist sees order status,
funnel events land in Firestore, and the UI doesn't fall over on bad input.
→ Done. `npm run verify` is green (51 tests). Not device-verified this pass —
the two open blockers from Sprint 3/4 (catalog imagery, two-phone test) are
still outstanding and belong to Sprint 6's manual QA pass, not this one.

Notes carried forward:

- **5.5 and 5.6 landed as one working tree** rather than two cleanly separable
  diffs — the `EmptyState` component's own `tone` prop (`neutral` vs `danger`)
  is the mechanism both tasks needed, so splitting further than "the primitive
  and its plain wiring" (5.5) vs "the new gates and messages built on top of
  it" (5.6) wasn't worth forcing. Same pattern as 3.7 folding into 3.5.
- **"Empty board" turned out not to need handling.** `BoardEditorScreen` only
  shows "Send it" once `board.pins.length > 0`, so a zero-pin board can't
  reach a recipient in the first place — the edge case is prevented, not
  caught.
- **No real offline detection was added** (no `NetInfo`, no connectivity
  gate). Errors from a dropped connection surface as whatever Firestore
  returns — a wrong-looking "not found" on join, a write failure on checkout —
  and the copy now accounts for that rather than adding a new dependency to
  detect it directly.

---

## Sprint 6 — Ship to testers (Day 6–7) 🟡

| # | Task | Commit | Status |
|---|---|---|---|
| 6.1 | Firestore security rules (permissive but not wide-open — enough that a stranger can't dump the DB) | `chore: add firestore security rules` | 🟡 `firestore.rules` committed — users/events cannot be listed at all, boards/orders only under an explicit query cap, every write shape-checked, nothing deletable. **Not yet deployed**: needs `firebase deploy --only firestore:rules` or a console paste, then a real create → send → join → order pass, since a rules mistake fails as "could not load your board" rather than anything obvious |
| 6.2 | App icon, name, splash | `chore: add app branding` | ✅ stock RN bootstrap icon replaced across all 5 mipmap densities; cold-start window background matches the app instead of flashing white |
| 6.3 | Release APK build + install instructions for testers | `docs: add tester install instructions` | ✅ `assembleRelease` succeeds, signed with the debug key per the earlier decision to skip a dedicated release keystore for this round |
| 6.4 | Seed 3–5 demo boards so testers aren't staring at an empty app | `feat(dev): add demo board seeds` | ✅ 4 boards, each pre-assigned a share code and marked sent |
| 6.5 | Full manual QA pass on two physical devices | — | ⬜ **not done** — needs two real Android phones, which this session has no access to; `docs/qa-checklist.md` written for whoever runs it |
| 6.6 | `docs/test-round.md` — what to measure, how to read the funnel | `docs: add test round measurement guide` | ✅ |

**Done when:** an APK is installable by someone who isn't you, and the funnel records their run.
→ **Not yet.** Everything buildable from a dev machine is done — `npm run
verify` is green, the release APK builds, demo boards and docs are in place.
The two things actually gating "done" are both real-world actions outside
this session's reach: deploying the Firestore rules to the live project, and
running `docs/qa-checklist.md` on two physical phones. Until both happen,
treat this sprint as ready-but-unverified rather than shipped.

Notes carried forward:

- **The rules and `collections.ts` are coupled, and breaking the coupling
  breaks everything.** Rules gate `list` on `request.query.limit`, and
  Firestore rules are not filters: a query that declares no limit is denied
  outright rather than trimmed to the cap. `readWhere` therefore passes an
  explicit `limit(SCAN_LIMIT)`. Remove that, or raise it above the cap in
  `firestore.rules`, and every lookup in the app — share-code join included —
  starts failing with permission-denied the moment the rules are live.
- **An earlier revision of this doc claimed `firestore.rules` already existed
  at the repo root. It did not** — the first attempts to write it were
  blocked, and the file only landed later. Worth knowing if anything else
  from that pass reads as more finished than it was.
- **Demo board share codes are generated fresh each time `seedDemoBoards`
  runs**, not fixed values — whoever runs the pilot needs to re-copy them
  after seeding, not reuse codes from a previous run or from this doc.

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