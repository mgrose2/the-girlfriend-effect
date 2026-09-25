# Reading the test round

The whole point of this prototype (`CLAUDE.md`) is one question: **does the
recipient actually complete a purchase?** Target is a >50% hit rate — more
than half of the boards that get sent should end in a placed order. This doc
is how to turn a pile of Firestore documents into that one number, plus what
else the funnel tells you along the way.

## The funnel

Five events, defined in `src/domain/funnel.ts`, written to the `events`
collection as they happen. Every event carries a `boardId`, because the
measurement is per board, not per person:

| Event | Fires when | What it tells you |
|---|---|---|
| `board_sent` | Stylist taps "Send it" on the share screen | The denominator — a board that actually went out |
| `board_opened` | Recipient's code resolves to a board | He engaged at all |
| `intake_completed` | Recipient finishes the sizing form | He got past the one piece of friction before shopping |
| `item_added` | Recipient adds an item to the bag (fires per item) | Browsing turned into intent — the gap between this and `order_placed` is where interest dies without converting |
| `order_placed` | Checkout writes an `Order` | The numerator |

## The number that matters

```
hit rate = (distinct boardIds with an order_placed event)
         / (distinct boardIds with a board_sent event)
```

Not "orders / boards sent" — a recipient could place more than one order
against the same board in theory (nothing stops re-entering checkout), and
that should still count as one hit, not two.

## Reading it out of Firestore

No dashboard exists for this — it's a handful of documents, read directly.

**Firebase console** (fastest for a spot check): Firestore → `events`
collection → filter `name == "board_sent"` to get the denominator boards,
then filter `name == "order_placed"` and cross-reference `boardId`.

**A short script**, if you're doing this more than once — the repositories
are already set up for exactly this read (`AnalyticsRepository.listByBoard`),
so the fastest path is a one-off Node script using the Firebase Admin SDK
(not the client SDK the app uses) pointed at the same project, reading the
whole `events` collection and grouping by `boardId` and `name`. That's
intentionally not shipped in this repo — it's a one-time query against
production data, not app functionality.

## Reading the drop-off, not just the hit rate

If the hit rate comes in under 50%, the funnel tells you roughly where it
broke, in order:

- **Few or no `board_opened` relative to `board_sent`** — the invitation
  itself isn't landing. Look at the share message copy
  (`ShareBoardScreen.tsx`'s `invitation()`), not the shopping experience.
- **`board_opened` without `intake_completed`** — the sizing form is where
  people bail before ever seeing the shop. Worth watching someone hit this
  screen live if the numbers show it.
- **`intake_completed` without `item_added`** — he got to the shop and didn't
  like anything in it. This is the catalog-imagery risk
  (`docs/plans/build-sprints.md` blockers) showing up as data: grey
  placeholder boxes don't sell.
- **`item_added` without `order_placed`** — he liked something, put it in the
  bag, and walked away at checkout. Worth a direct follow-up with that
  tester; this is the step no design change fixes as easily as a text message.

## What this data can't tell you

There's no user table linking `userId` to who that person actually is beyond
a name typed in once (`CLAUDE.md` — no real auth). If two testers share a
device, or a name gets typed differently twice, the funnel will undercount or
double-count them. For a small pilot, cross-checking against who you actually
sent codes to by hand is more reliable than trusting `userId` alone.
