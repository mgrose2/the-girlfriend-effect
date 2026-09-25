# Two-phone QA checklist (Sprint 6.5)

Not something that can be verified from a dev machine — every flow so far has
been driven end to end on a single emulator playing both roles
(`docs/plans/build-sprints.md`, Sprint 3/4 notes). The data is genuinely
shared through Firestore, so it *should* work across two real phones, but
that gap — "should" versus "did" — is exactly what this pass exists to close
before the test round starts. Needs two Android phones and two people (or one
person running the app twice).

Run this after deploying `firestore.rules` and building the release APK
(see `docs/install.md`), on the actual release build testers will get — not
a debug build talking to a different backend config.

## Setup

- [ ] Both phones have the release APK installed via sideload (not `adb
      install` from a dev machine — that's a different install path than
      what a tester will actually do).
- [ ] Both phones have working internet (not just Wi-Fi on the same LAN as
      each other — cellular data on at least one, to catch anything that
      only works when both devices happen to share a network).

## Phone A — stylist

- [ ] Role Select → pick Stylist → land on an empty board list.
- [ ] Create a board, add at least 2 tags.
- [ ] Add 3+ pins — at least one from the camera roll, one by pasting an
      image URL.
- [ ] Reorder/remove a pin, confirm the grid updates.
- [ ] Tap Send. Confirm a share code appears and the OS share sheet opens.
- [ ] Close the share sheet without actually sending (or send it to Phone B
      by whatever means — text, etc.) and back out to the board list —
      confirm the board now shows as sent.

## Phone B — recipient

- [ ] Role Select → pick Recipient.
- [ ] Enter the code from Phone A — **type it by hand**, not copy-paste, at
      least once during this pass. Copy-paste hides case/whitespace bugs that
      a real recipient reading a text message out loud will hit.
- [ ] Confirm the board that loads has the same pins, in the same order,
      with images actually rendering (not blank/broken — 3.6's known risk).
- [ ] Complete the sizing intake form.
- [ ] Open the shop — confirm items appear and are plausibly in-size.
- [ ] Add 2+ items to the bag from different categories.
- [ ] Open the bag, confirm both items, sizes, and the running total are
      correct.
- [ ] Complete checkout. Confirm the confirmation screen shows the right
      items and total, and the donate-bag card renders.

## Back to Phone A

- [ ] Return to the board list — confirm the stylist-side receipt now shows
      the order (Sprint 5.3's "he ordered N of your picks").

## Failure modes worth specifically trying to provoke

- [ ] Turn on airplane mode on Phone B mid-checkout, then turn it back on and
      retry — confirm the order eventually lands rather than silently
      vanishing, and that the error state (5.6) is legible if it doesn't.
- [ ] Enter a wrong/expired code on Phone B — confirm the message is the
      "check the code, check you're online" copy, not a raw error.
- [ ] Background one app mid-flow (app switcher, not force-quit) and return —
      confirm state survives rather than restarting to Role Select.

## After the pass

Record pass/fail per section above directly in this file or wherever the
pilot's notes live, and file anything that broke against the two open
blockers already tracked in `docs/plans/build-sprints.md` (catalog imagery,
two-phone testing) rather than as new one-off bugs — they're the same risk
this checklist exists to retire.
