---
tags:
  - secondbrain
  - documentation
---
# Known Issues


## Real Device Verification Pending

- Severity: Medium.
- Related files: `src/app/`, `src/features/deadlineos/`.
- Description: Android JavaScript bundling passes, but the screens have not yet been tapped through on an emulator or physical device.
- Suggested fix: Run `npm run android` and check onboarding, add/analysis, generated plan, task completion, blocker recovery, and persisted restart state.

## Stale Development Builds Use Session-Only Storage

- Severity: Low.
- Related files: `src/features/deadlineos/store.ts`.
- Description: If an installed development binary does not contain the AsyncStorage native module, the app now stays open by using in-memory storage. Data in that fallback is lost when the app process closes.
- Suggested fix: Rebuild and reinstall the debug app when Gradle is available; rebuilt binaries automatically use persisted AsyncStorage.

## TypeScript Check Is Slow In This Environment

- Severity: Low.
- Related files: `tsconfig.json`.
- Description: The reference web project is excluded from Expo type checking, but `npx tsc --noEmit` still times out in this environment. It did not report Expo-source errors before timing out; Android bundling succeeds.

## Android Release Uses Debug Signing

- Severity: High.
- Related files: `android/app/build.gradle`.
- Description: Release builds use the debug signing configuration and are not ready for Play Store distribution.

## Dependency Checks Are Manual

- Severity: Low.
- Related files: `package.json`, `package-lock.json`.
- Description: The project has no automated unused-dependency or compatibility check. The 18 July 2026 audit found no installed `framer-motion` package; its old unused source files were removed.
- Suggested fix: Add a dependency audit command when the dependency list grows, and review Expo SDK compatibility before adding native packages.

## Auth Flow Needs Device Verification

- Severity: Medium.
- Related files: `src/features/auth/`, `src/app/_layout.tsx`.
- Description: The Supabase project is active and the code protects routes, but sign-up, confirmation-email behavior, sign-in, session restoration, and sign-out have not yet been tapped through on a device.
- Suggested fix: Test those flows in an Android development build and confirm the desired email-confirmation setting in the Supabase dashboard.
- **Expo Share Intent**: Handling shared files natively requires a clean native build (`npx expo prebuild --clean` or `npm run android`). If it throws intent filter errors, ensure there are no duplicate AndroidManifest blocks.
- **Gemini API Key**: A valid `EXPO_PUBLIC_GEMINI_API_KEY` environment variable must be set in `.env` for the extraction to work.

## Google Provider Dashboard Setup Pending

- Severity: Medium.
- Related files: `src/features/auth/google.ts`, `app.json`.
- Description: The app-side Google OAuth flow is implemented, but Supabase Dashboard must enable the Google provider with Google Cloud OAuth credentials and allow `anapp://auth/callback` as a redirect URL.
- Suggested fix: In Supabase Dashboard, configure Authentication > Providers > Google, then add `anapp://auth/callback` under Authentication > URL Configuration > Redirect URLs.
