# Getting TGE onto iPhones via TestFlight

The test round's recipients are iPhone users, which makes iOS the platform the
measurement actually depends on — a >50% hit rate can't be measured on a
cohort that can't install the app. This supersedes the "Android only this
round" call in `CLAUDE.md`, which was made when there was no Mac in the loop.

**None of this can be done from the Windows dev machine.** Every step below
runs on the MacBook Pro. The app has never been compiled for iOS, so expect
the first build to surface things this doc can't predict.

## What's already done in the repo

- `AppDelegate.swift` calls `FirebaseApp.configure()`. Android gets this free
  from the google-services Gradle plugin; iOS doesn't, and without it every
  Firestore call fails with *"No Firebase App '[DEFAULT]' has been created."*
- `Info.plist` has `NSPhotoLibraryUsageDescription` (the photo picker) and
  `ITSAppUsesNonExemptEncryption = false` (skips the export-compliance
  question on every upload; correct here because the app only talks HTTPS).
- `.gitignore` already covers `GoogleService-Info.plist` — do not commit it.

Both native edits were written on Windows and have **never been compiled**.
They're standard and small, but they're the first thing to suspect if the
initial build fails oddly.

## 1. Apple Developer Program

TestFlight requires a paid membership ($99/yr) — a free Apple ID can run the
app on your own device but cannot distribute to anyone else.

If you're not enrolled: developer.apple.com/programs → Enroll. Approval is
usually same-day but can take 24–48h, occasionally longer if they ask for ID.
**Start this first** — everything else is blocked on it, and it's the one step
that involves waiting on someone else.

## 2. Pick a bundle identifier

Currently the React Native template placeholder:
`org.reactjs.native.example.TGE`. It must change before any upload.

Pick reverse-DNS, something you won't regret: `com.mgrose.tge` is a safe
default. Avoid `com.tge` — short and generic enough that someone may already
hold it, which blocks registration.

This is close to permanent: once a build is uploaded under a bundle ID, that
ID is registered to your account and can't be reused for a different app or
renamed. Decide once.

Set it in Xcode: open `ios/TGE.xcworkspace` → TGE target → Signing &
Capabilities → Bundle Identifier. While you're there, tick **Automatically
manage signing** and pick your Team.

## 3. Firebase for iOS

The Firebase project already exists (Android uses it). You're adding a second
app to the same project, so both platforms share one database and one funnel —
which is what you want: an iPhone recipient must be able to open a board sent
from an Android phone.

1. Firebase console → Project settings → Your apps → **Add app → iOS**.
2. Enter the exact bundle ID from step 2. A mismatch here fails at runtime,
   not at build time.
3. Download `GoogleService-Info.plist`.
4. Drag it into the `TGE` folder **in the Xcode sidebar** — tick "Copy items
   if needed" and confirm the TGE target is checked. Copying it into the
   folder in Finder is not enough: if it isn't a member of the target it
   won't be in the app bundle, and the app will crash on launch.

## 4. Build it locally first

Don't go near TestFlight until it runs on a simulator.

```sh
bundle install              # first time only; the Gemfile pins CocoaPods
cd ios && bundle exec pod install && cd ..
npm run ios
```

**If `pod install` or the build fails on Firebase**, the usual culprit is
static-library linkage. The Podfile already reads a `USE_FRAMEWORKS` env var,
so try:

```sh
cd ios && USE_FRAMEWORKS=static bundle exec pod install
```

If that still fights you, add `$RNFirebaseAsStaticFramework = true` above the
`target 'TGE' do` line in `ios/Podfile` and re-run. This is the most common
react-native-firebase iOS snag — it is not a sign anything is wrong with the
app code.

Then actually exercise it on the simulator: role select → create a board → add
a pin from the photo library → send → note the code. The photo picker and the
Firebase Storage upload are the two paths most likely to behave differently
from Android, and both are far easier to debug here than from a TestFlight
build.

## 5. App Store Connect record

appstoreconnect.apple.com → Apps → **+** → New App.

- Platform iOS, pick the bundle ID from the dropdown (it appears once Xcode
  has registered it via automatic signing, or register it manually under
  Certificates, Identifiers & Profiles → Identifiers)
- Name: `TGE` — must be unique across the whole App Store. If taken, use
  something like `TGE — The Girlfriend Effect`. It's only a TestFlight build,
  so the name matters little, but it can't collide.
- SKU: any internal string, e.g. `tge-prototype`
- Full access, primary language English

## 6. Archive and upload

1. In Xcode, set the run destination to **Any iOS Device (arm64)** — Archive
   is greyed out while a simulator is selected.
2. Product → **Archive**.
3. When Organizer opens: **Distribute App** → App Store Connect → Upload.
   Accept the defaults for symbols and signing.
4. Processing takes ~5–15 minutes. You'll get an email when the build is
   ready in TestFlight.

Every subsequent upload needs a **unique build number**. Bump
`CURRENT_PROJECT_VERSION` in Xcode (General → Build) each time;
`MARKETING_VERSION` (1.0) can stay put. Re-uploading the same build number is
rejected outright.

## 7. TestFlight testers

Two routes, and the choice matters for your timeline:

**Internal testers** — up to 100, each added as a User in App Store Connect
with their own Apple ID and a role. **No Beta App Review**, so builds are
available within minutes of processing. Best for you and anyone you'd add to
the account.

**External testers** — up to 10,000, invited by email or a public link.
Requires **Beta App Review** on the first build, typically under 24–48h.
Later builds usually pass without re-review. This is the realistic route for
friends and partners, since they don't need to be on your team.

For a pilot: create an external group, add the build, submit for review, then
share the public link. Testers install the TestFlight app from the App Store,
tap your link, and get TGE.

Note the expiry: **TestFlight builds expire after 90 days.** Fine for a test
round, worth knowing if the pilot drags.

## 8. Before handing codes out

`docs/install.md` covers the Firestore rules deploy and demo-board seeding.
Both still apply and both are platform-independent. The rules deploy in
particular is still outstanding, and a mistake there breaks iOS exactly as it
would break Android.

Seeding still has to come from a debug build, and can be done from either
platform since the boards live in Firestore, not on the device. Seeding from
Android and joining from an iPhone is a genuinely good first cross-platform
check — it's the real product path, and the thing two emulators could never
prove.

## Known unknowns

The app has never run on iOS. Specific things to watch, none of them tested:

- **Photo picker URIs.** `pickImage.ts` assumes a local `file://` copy.
  react-native-image-picker should produce one on iOS too since the app
  requests resizing, but if pins upload blank, look here first.
- **Storage upload.** Sprint 3.6 rewrites local pin URIs to download URLs.
  Verified on Android only.
- **StatusBar and safe areas.** Sprint 0 hit RN 0.87 changes around
  edge-to-edge on Android; iOS notch and home-indicator insets are a
  different code path that no screen has been checked against.
