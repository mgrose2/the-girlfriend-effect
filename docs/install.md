# Installing TGE for the test round

Android only — there is no iOS build this round (see `CLAUDE.md`).

## Before handing out the APK

1. **Deploy the Firestore rules** in `firestore.rules` (Firebase console → Firestore
   → Rules, or `firebase deploy --only firestore:rules` if you have the CLI set up).
   Do this before testers start, and do one full create → send → join → order
   pass yourself afterward — a rules mistake fails silently as "could not load
   your board," not as an obvious error.
2. **Seed demo boards.** The release build testers install has dev tools
   compiled out (`flags.showDevTools` is `__DEV__`-gated), so demo seeding has
   to happen once from a debug build, by whoever is running the pilot:
   - Run the app in debug (`npm run android`, or open in Android Studio).
   - Pick "Stylist" on Role Select, open the dev tools panel, tap **Seed demo
     boards**.
   - The result line lists each board's title and share code
     (`Fall Layers: TGE-4F9K`, etc.) — copy these down.
   - Because boards live in Firestore, not on the device, those codes work
     from anyone's release-build install from that point on. You only need to
     do this once per test round, not once per tester.
3. Build the release APK: `cd android && ./gradlew assembleRelease`. Output
   lands at `android/app/build/outputs/apk/release/app-release.apk`. It's
   signed with the debug key (see `build.gradle` — no dedicated release
   keystore exists, which is a deliberate call for a prototype test round: one
   less credential to lose track of, and every install is one you control).

## Getting the APK onto a tester's phone

There's no Play Store listing — this is a direct sideload:

1. Send `app-release.apk` to the tester however is easiest (Drive link, email
   attachment, AirDrop-to-Android equivalent, USB cable).
2. On their phone, opening the file will prompt **"Install unknown apps"** —
   they need to allow it for whichever app they downloaded it through
   (Settings → Apps → Special access → Install unknown apps, or the inline
   prompt handles it directly on most Android versions).
3. They'll likely see a Play Protect warning since the app isn't from the
   Play Store. "Install anyway" — this is expected for a sideloaded APK, not a
   sign anything is wrong.
4. Open the app, pick a role. A **recipient** enters one of the share codes
   from step 2 above on the join screen. A **stylist** can start a board from
   scratch, or use a seeded one as a reference for what a finished board looks
   like.

## If something looks broken

- **"No board with that code"** on join — the code is checked against
  Firestore over the network. Double-check the tester is online and the code
  was copied correctly (see `JoinBoardScreen`'s bad-code message).
- **Blank/grey catalog images** — known, open issue. The catalog uses
  `placehold.co` placeholders, not real product photography (see
  `docs/plans/build-sprints.md`, Sprint 1 blockers). Testers will see labeled
  grey boxes instead of clothes; this is expected for now, not a bug to chase.
- **Checkout fails to place an order** — almost always connectivity or a
  rules-deploy problem (see step 1 above), surfaced inline on the checkout
  screen rather than crashing.
