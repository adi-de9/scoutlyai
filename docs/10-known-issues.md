# Known Issues

## Live AI End-To-End Test Pending

- Severity: Medium. Demo Mode remains available.
- Related files: `supabase/migrations/202607190001_deadlineos_hackathon.sql`, `supabase/functions/`, `src/features/deadlineos/services/live-analysis.ts`.
- Description: The migration and all three Edge Functions are deployed to DeadlineOS. One signed-in app user must still upload a real text/PDF/screenshot notice to confirm the Gemini secret, private Storage access, queue progress, and extraction result together.
- Suggested fix: Run one live analysis from a rebuilt Android app, then inspect the relevant Edge Function invocation and logs in the Supabase Dashboard.

## Native Picker And Notification Verification Pending

- Severity: Medium.
- Related files: `app.json`, `src/features/deadlineos/services/`, `src/app/_layout.tsx`.
- Description: The new Expo native modules need an Android rebuild and device test for picker cancel/reject flows, notification permission, reminder delivery, Done cancellation, Later rescheduling, and notification navigation.
- Suggested fix: Also test Android Files, Gallery, WhatsApp, and Gmail sharing one PDF/image into DeadlineOS, including signing in after sharing. Verify unsupported types and files above 10 MB are rejected without upload.

## Local Android Rebuild Exceeds Available Tool Window

- Severity: Medium. Android source remains unchanged by the local-state repair.
- Related files: `android/`, Gradle build configuration.
- Description: The existing debug rebuild had already exceeded five minutes. A 19 July 2026 `assembleRelease` QA attempt also timed out after six minutes without producing a new APK, so a rebuilt bundle could not be installed on the emulator.
- Suggested fix: Run `npm run android` or `android\\gradlew.bat assembleRelease` from a local terminal with a longer build window, then install the resulting APK and repeat the interactive checks.

## Device Input Is Not Connected

- Severity: Medium.
- Related files: `src/features/deadlineos/screens.tsx`.
- Description: This older note is superseded for pasted text, PDF, and screenshot: those sources now have picker/live-service code. Voice, email, and camera capture remain deliberately out of scope.
- Suggested fix: Keep the three-source hackathon limit unless product scope changes.

## Demo Analysis Is Deterministic

- Severity: Medium.
- Related files: `src/features/deadlineos/store.ts`.
- Description: The deterministic analyzer remains intentionally for explicit Demo Mode. Live extraction and blocker recovery use Gemini only after the Supabase backend is deployed.
- Suggested fix: Deploy the documented backend; do not remove Demo Mode because it is the offline/reliable fallback.

## Real Device Verification Pending

- Severity: Medium.
- Related files: `src/app/`, `src/features/deadlineos/`, `assets/images/`, `android/app/src/main/res/`.
- Description: Android JavaScript bundling and native resource compilation pass, but the screens and new fox launcher, round/themed icon, and corrected full-fox Android 12+ splash screen have not yet been checked on an emulator or physical device.
- Suggested fix: Run `npm run android` using the rebuilt debug APK. Check the splash shows the complete fox without zooming or clipping, confirm the fox is not clipped by the device launcher mask, confirm the themed icon uses a single-color fox mark where supported, then test splash startup, onboarding selection feedback and persistence, every bottom tab including the raised Add control, Calendar date/deadline interactions, Insights empty and populated graph states, add/analysis, generated plan, blocker recovery, and persisted restart state.

## Stale Development Builds Use Session-Only Storage

- Severity: Low.
- Related files: `src/features/deadlineos/store.ts`.
- Description: If an installed development binary does not contain the AsyncStorage native module, the app now stays open by using in-memory storage. Data in that fallback is lost when the app process closes.
- Suggested fix: Rebuild and reinstall the debug app when Gradle is available; rebuilt binaries automatically use persisted AsyncStorage.

## Legacy Local Demo State Can Be Incomplete

- Severity: Low. The app now recovers safely.
- Related files: `src/features/deadlineos/store.ts`.
- Description: Earlier development builds could leave an incomplete or malformed `deadlineos-demo` AsyncStorage value. That caused Demo Mode analysis to crash while updating a notice.
- Suggested fix: Version 1 persistence migration now replaces invalid arrays/maps/profile fields with safe defaults, and `setAnalysis` includes a defensive fallback. Verify this once on a rebuilt development app with existing local data.

## Emulator Metro Connection Is IPv4/IPv6 Mismatched

- Severity: Low. This is a local test-environment limitation, not a confirmed app defect.
- Related files: local Expo/ADB setup; no product source file.
- Description: The installed Android debug app requests `localhost:8081` through ADB reverse, while the local Expo server started on Windows as IPv6-only (`::1`). The app therefore showed the native "Unable to load script" screen before any current JavaScript could run. Android export on 19 July 2026 completed successfully.
- Suggested fix: Rebuild/reinstall the development app using `npm run android`, or start Metro with an IPv4-compatible binding and configure the development client to use it. Then repeat the interactive Demo Mode flow test.

## TypeScript Check Is Slow In This Environment

- Severity: Low.
- Related files: `tsconfig.json`.
- Description: The reference web project is excluded from Expo type checking, but `npx tsc --noEmit` still times out in this environment. A narrow no-config check on 19 July 2026 reached `src/features/deadlineos/store.ts` and reported three pre-existing typing issues: the dynamic `require` declaration, an inferred optional `requiredDocument`, and a widened deadline status. None are in the local-state recovery added in this task; Android bundling succeeds.
- Suggested fix: Keep using the Android export as the build guard, then resolve the existing store typings in a focused type-cleanup task and add targeted automated tests when the product behavior is stable.

## Android Release Uses Debug Signing

- Severity: High.
- Related files: `android/app/build.gradle`.
- Description: Release builds use the debug signing configuration and are not ready for Play Store distribution.

## Native Android Resources Are Ignored By Git

- Severity: Low.
- Related files: `.gitignore`, `android/app/src/main/res/`.
- Description: The current debug APK uses the replaced fox density resources, but the repository ignores the whole `android/` folder. The direct native resource replacements will not appear in Git status or a future commit unless the repository policy changes.
- Suggested fix: Keep the tracked Expo source assets as the rebuild source of truth. If direct Android resources must be versioned too, explicitly approve a narrow `.gitignore` exception for the affected resource files or version the native Android project.

## Dependency Checks Are Manual

- Severity: Low.
- Related files: `package.json`, `package-lock.json`.
- Description: The project has no automated unused-dependency or compatibility check. The 18 July 2026 audit found no installed `framer-motion` package; its old unused source files were removed.
- Suggested fix: Add a dependency audit command when the dependency list grows, and review Expo SDK compatibility before adding native packages.

## Auth Flow Needs Device Verification

- Severity: Medium.
- Related files: `src/features/auth/`, `src/app/_layout.tsx`.
- Description: The dedicated DeadlineOS project is active and intentionally starts with zero users. Confirm Email is now disabled for the hackathon flow, so first email sign-up should create a device session immediately instead of sending a confirmation link. The code also ignores stale callback links once that session exists, but this needs a device tap-through.
- Suggested fix: In an Android development build, verify Landing > Get Started opens sign-in, create a new DeadlineOS account and confirm it opens onboarding without email confirmation, then test ordinary sign-in, session restoration, sign-out, Google cancellation, a valid Google callback, and a signed-out expired callback link.

## Google Provider Dashboard Setup Pending

- Severity: Medium.
- Related files: `src/features/auth/google.ts`, `app.json`.
- Description: The app-side Google OAuth flow requests `anapp://auth/callback`, but the remote project still falls back to `localhost:3000`. This confirms a Supabase Auth URL configuration issue, not a mobile-route failure.
- Suggested fix: In the DeadlineOS Supabase Dashboard, configure Authentication > Providers > Google with the Google Cloud OAuth credentials; under URL Configuration add exact redirect `anapp://auth/callback` and ensure the confirmation-email template uses `{{ .ConfirmationURL }}`. Keep Google Cloud's authorized callback at `https://ldsewokysfbqshhjsied.supabase.co/auth/v1/callback`.

## Updated Android Share And Tab Verification Pending

- Severity: Medium.
- Related files: `app.json`, `android/app/src/main/AndroidManifest.xml`, `src/app/share.tsx`, `src/features/deadlineos/ui.tsx`.
- Description: The new native `text/plain` intent and centred 68px icon-only Add-tab layout need a rebuilt APK/device check. Static code checks cannot confirm the Android share-sheet listing or physical centre alignment.
- Suggested fix: Rebuild the debug APK, share a text notice from Gmail/WhatsApp/Notes, a URL-only share, a PDF, and a screenshot; then test the Add action on narrow and wide emulator widths.

## Final Visual Density Check Pending

- Severity: Low.
- Related files: `src/features/deadlineos/screens.tsx`, `src/features/deadlineos/ui.tsx`.
- Description: The Add notice information-density pass is code-reviewed, but needs a device-size check to confirm the shorter source/input layout feels balanced with the keyboard open.
- Suggested fix: On a narrow Android device, switch among text, PDF, and screenshot; test empty input, selected file, Change, Remove, keyboard-open scrolling, and the primary action visibility.
