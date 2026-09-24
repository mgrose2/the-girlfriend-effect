# The Girlfriend Effect — Prototype Build Plan

## 0. What this document is

A build plan for a *testable* prototype, not a production app. The goal per
your test card is specific: get boyfriends to actually spend time picking
clothes and completing a purchase, and see if the hit rate clears 50%. Every
decision below is filtered through "does this help us find that out faster,"
not "is this how we'd build it for real."

One open item worth reconciling with your team before you start building:
your deck frames this as a **recurring monthly subscription box** tiered by
retailer price point ($75/$125/$200), while your latest description is a
**one-off curated board → pick items → single order** flow. This plan builds
the second one, since it's the more detailed and more recent spec — but
confirm that's actually the model you want validated, since the two produce
different prototypes.

## 1. Prototype scope

| In scope | Explicitly out of scope |
|---|---|
| Board creation (Pinterest-style pins) | Real payment processing |
| Sending a board to a recipient | Real retailer inventory/APIs |
| Recipient sizing intake | Auth/security hardening |
| Curated shop view filtered by board + sizing | Subscription billing / tiers |
| Item selection + fake checkout | Advertising / brand-partner infra |
| Order confirmation + "donate bag" UI beat | Real return/donation logistics |
| Hardcoded catalog (H&M, Uniqlo, Abercrombie, J.Crew, Lululemon, Kith, Buck Mason) | Recommendation algorithm — tag matching is enough |

## 2. Core flows

**Curator ("girlfriend") flow**
1. Create a board — add pins (screenshots, saved images, article links)
2. Tag the board with a style (e.g. "old money," "streetwear," "athleisure")
3. Generate a shareable link/code for a specific recipient
4. Send it (out of app — a text with the link is fine for a prototype)

**Recipient ("boyfriend") flow**
1. Open the link/enter the code
2. One-time sizing intake (shirt size, pant waist/inseam, shoe size)
3. View the curated shop — catalog items filtered by the board's tags + his size
4. Pick items, hit checkout (fake — no real payment)
5. See order confirmation + a card mentioning the donate-bag concept

I've kept the data model's role names generic (`stylist` / `recipient`)
rather than gendered — costs nothing now and keeps the door open if the
product broadens beyond the original framing later.

## 3. Screens

| Screen | Persona | Purpose |
|---|---|---|
| Role select | Both | Am I creating a board or receiving one? |
| Board list | Stylist | Boards I've created |
| Board editor | Stylist | Add/arrange pins, set style tags |
| Share sheet | Stylist | Generate link/code, mark as sent |
| Join / enter code | Recipient | Land on a shared board |
| Sizing intake | Recipient | One-time form, stored on their profile |
| Curated shop | Recipient | Filtered catalog grid |
| Cart / fake checkout | Recipient | Review picks, fake "place order" |
| Confirmation | Recipient | Order summary + donate-bag mention |

## 4. Data model (TypeScript — drop straight into your RN project)

```typescript
interface User {
  id: string;
  name: string;
  role: 'stylist' | 'recipient';
  sizing?: SizingProfile; // only present for 'recipient'
}

interface SizingProfile {
  shirtSize: string;
  pantWaist: number;
  pantInseam: number;
  shoeSize: number;
  preferredFit?: string;
}

interface Pin {
  id: string;
  imageUrl: string;
  sourceUrl?: string;
  note?: string;
  tags: string[];
}

interface Board {
  id: string;
  ownerId: string;        // stylist's user id
  recipientId?: string;   // set once sent/claimed
  title: string;
  styleTags: string[];
  pins: Pin[];
  createdAt: string;
  sentAt?: string;
}

interface CatalogItem {
  id: string;
  retailer: 'H&M' | 'Uniqlo' | 'Abercrombie' | 'J.Crew' | 'Lululemon' | 'Kith' | 'Buck Mason';
  name: string;
  imageUrl: string;
  price: number;
  category: 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory';
  sizesAvailable: string[];
  tags: string[]; // matched against Board.styleTags
}

interface Order {
  id: string;
  boardId: string;
  recipientId: string;
  items: CatalogItem[];
  total: number;
  status: 'placed'; // no real fulfillment states needed yet
  createdAt: string;
}
```

Catalog matching for the "curated shop" screen: filter `CatalogItem`s where
`tags` overlaps `Board.styleTags` AND `sizesAvailable` includes the
recipient's relevant size. That's it — no ML needed for a prototype.

## 5. Technical architecture

**Framework**: Expo, not bare RN CLI. Given the goal is "usable app ASAP" and
testable by real people on their own phones, Expo Go's instant iteration
beats bare CLI's setup overhead. The Android Studio setup you already did
still isn't wasted — you'll want it eventually for a dev build, and the
emulator's useful for Android testing regardless of Expo vs bare.

**State management**: React Context + hooks. Redux/Zustand is more
infrastructure than a prototype this size needs.

**Backend — the one piece that can't be fully faked**: everything else in
this app *could* be hardcoded local data, except the board-sharing step —
two different people on two different phones need to see the same board, so
some shared data store is unavoidable. Don't build a custom server for this;
use a managed backend to skip that entirely:

- **Recommended: Firebase (Firestore + anonymous auth)** — no real login
  flow needed, Firestore gives you shared, synced data across devices with
  almost no setup, generous free tier, and it's the fastest path from zero
  to "two phones see the same board."
- **Alternative: Supabase** — same idea, Postgres-backed if you'd rather
  have SQL than a document store.
- Given your Spring Boot background, you *could* stand up your own tiny
  backend instead — but for a class prototype, the time that buys you isn't
  worth spending; save that skill for when this becomes a real company.

**Mocked vs real, explicitly:**
- Catalog (H&M, Lululemon, etc. items): hardcoded JSON seed data, no retailer APIs
- Checkout: writes an `Order` record, no payment processor involved
- Auth: anonymous/name-only, no password flows
- Sharing: link/code + Firestore lookup, no push notifications or in-app messaging

## 6. Build phases

1. **Setup** — Expo project scaffolded, Firebase project created, seed catalog JSON written (a few dozen items across the listed retailers is enough)
2. **Board creation** — pin adding, board editor, style tagging
3. **Sharing + intake** — link/code generation, recipient lands on board, sizing form
4. **Curated shop + cart** — filtered catalog grid, item selection, fake checkout
5. **Confirmation + polish** — order summary, donate-bag UI card, pass over visual polish
6. **Test round** — get it in front of real couples, track sent-boards → completed-orders against your >50% hit-rate target

Each phase is a natural checkpoint to hand to Claude Code as its own task —
"build phase 2" is a well-scoped prompt in a way "build the app" isn't.

## 7. Business model (decided)

**Monetize via retailer affiliate commission, not a subscription fee, for
now.** Reasoning:

- Charging the curator adds friction exactly where you can't afford it —
  she's doing the acquisition work of getting a boyfriend to engage at all.
- Charging the recipient doesn't fit either — he didn't choose to be here,
  someone sent him a link.
- Commission ties revenue directly to your test card's actual hypothesis
  (boyfriends complete a purchase). Every dollar earned is validation
  evidence, not a separate thing to prove.

**Mechanics**: join retailers' existing affiliate programs (via networks
like Rakuten Advertising, Impact, or CJ Affiliate — self-serve, no
negotiation needed to start). The retailer pays the commission out of their
own margin; the price the shopper sees and pays is identical to buying
direct. Typical rates: H&M ~2–10%, Lululemon ~5–10%, fashion retail average
~10% — thin per order, but zero cost to the shopper and near-zero BD effort.
**Not guaranteed for every retailer on the list** — hype/streetwear brands
like Kith often skip affiliate programs entirely since they don't need to
pay for demand. Verify per-retailer before assuming it's a revenue line.

**Known trade-off, not a blocker for the prototype**: affiliate links
generally mean checkout happens on the retailer's own site (a redirect), not
inside a single unified cart — in tension with the original "one checkout,
no re-entering card info" vision. A true unified checkout across these
retailers would require either buying wholesale and reselling as your own
SKUs (real inventory risk, needs wholesale accounts most retailers won't
extend to a two-person student project) or an earned retailer-side
integration after you have real traffic to offer — both are later-stage
moves, not something to solve now. The prototype's checkout is mocked
anyway, so this doesn't affect anything you're building today.

**Deliberately deferred, not rejected:**
- *Subscription fee / $400 platinum tier* — a real question eventually, but
  tests the wrong variable before you've confirmed the base loop works at
  all. Revisit once you have retention data (do people send a second board?).
- *Advertising* — avoid for now; needs scale you won't have, and undercuts
  the "curated by someone who loves you" pitch.
- *Deck's per-retailer subscription-box model ($75/$125/$200/mo)* — a
  different, heavier business (recurring box, real inventory/logistics,
  closer to Stitch Fix) than the affiliate-commission model above. Be
  deliberate that you're choosing the lighter one for now rather than
  drifting into building both.

The `Order` model in Section 4 doesn't need to change for any of this —
commission is a backend/reporting concern, not something the prototype's
data model needs to enforce.

## 8. Folding this into your existing setup

- Install the `dev-agents` plugin (test-runner, build-debugger, code-reviewer)
  in this project the same way you did before:
  ```
  /plugin marketplace add mgrose2/mark-claude-kit
  /plugin install dev-agents@mark-claude-kit
  ```
- Add a project `CLAUDE.md` stating: Expo + TypeScript, Firebase for boards/
  users/orders, hardcoded catalog data, **explicitly no payment processing
  or real auth needed** — that last line matters, since without it Claude
  may default to adding security/validation you've deliberately decided to
  skip for now.
- As you build, if a new repeated verbose task shows up (e.g. seeding/
  resetting Firestore test data), that's a candidate for a fourth subagent
  in `mark-claude-kit` — add it there once it's a real pattern, not before.
