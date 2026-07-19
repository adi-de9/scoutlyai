---
tags:
  - secondbrain
  - documentation
---
# Decisions

See also [[01-architecture]] and [[14-open-questions]].

## Use Expo Router

### Decision

Use Expo Router for app entry and routing.

### Evidence

`package.json` sets `"main": "expo-router/entry"` and `src/app/_layout.tsx` imports `Stack` from `expo-router`.

### Reason

Reason unknown. This is likely from the selected Expo template, but the repository does not explicitly say why.

### Impact

Routes should be created through files under `src/app/`.

### Related Files

- `package.json`
- `src/app/_layout.tsx`
- `src/app/index.tsx`

## Use TypeScript Strict Mode

### Decision

Use TypeScript with strict checking.

### Evidence

`tsconfig.json` sets `"strict": true`.

### Reason

Reason unknown.

### Impact

Future code should satisfy stricter type checks and avoid loose `any` usage unless justified.

### Related Files

- `tsconfig.json`

## Keep Native Android Project In Repository

### Decision

Keep a native Android project under `android/`.

### Evidence

The repository contains `android/settings.gradle`, `android/app/build.gradle`, Android manifests, Kotlin `MainActivity`, and Kotlin `MainApplication`.

### Reason

Reason unknown.

### Impact

Android changes may require both Expo config changes and native Gradle/Kotlin changes.

### Related Files

- `android/`
- `app.json`

## Enable Hermes And React Native New Architecture On Android

### Decision

Hermes and the React Native new architecture are enabled.

### Evidence

`android/gradle.properties` sets `hermesEnabled=true` and `newArchEnabled=true`.

### Reason

Reason unknown.

### Impact

Native dependencies must be compatible with Hermes and the new architecture.

### Related Files

- `android/gradle.properties`
- `android/app/build.gradle`

## Use Static Web Output

### Decision

Use static web output.

### Evidence

`app.json` sets `"web": { "output": "static" }`.

### Reason

Reason unknown.

### Impact

Future web behavior should be checked against static export constraints.

### Related Files

- `app.json`

## Use Tailwind CSS v4 With NativeWind v5 And React Native CSS

### Decision

Prepare universal styling through Tailwind CSS v4, NativeWind v5, and `react-native-css`.

### Evidence

`package.json` lists `tailwindcss`, `nativewind`, `react-native-css`, `@tailwindcss/postcss`, `tailwind-merge`, and `clsx`. `metro.config.js`, `postcss.config.mjs`, `src/global.css`, and `src/tw/*` were added for the setup.

### Reason

The user explicitly requested the `expo-tailwind-setup` skill. The skill referenced an older `react-native-css` nightly, but npm reported that nightly as Expo SDK 54-era and incompatible with newer Expo peer metadata. The project uses `react-native-css@^3.0.7` because its current package metadata supports React Native 0.81+ and `@expo/metro-config` 54+.

### Impact

Future screens should use CSS-wrapped components from `src/tw/` when applying Tailwind `className` styles.

### Related Files

- `package.json`
- `metro.config.js`
- `postcss.config.mjs`
- `src/global.css`
- `src/tw/index.tsx`
- `src/tw/image.tsx`
- `src/tw/animated.tsx`

## Port DeadlineOS As Native Expo Router Screens

### Decision

Port the `web_form` Lovable design into dedicated Expo Router screens, using native React Native components and local persisted demo state rather than embedding the web app in a WebView.

### Reason

Native UI gives correct Android touch, safe-area, font, navigation, and offline behavior while retaining the reference design's colors, fonts, copy, and user flow.

### Impact

The active application routes now live under `src/app/`; `web_form/` remains an unchanged design reference. The demo data is persisted in AsyncStorage under `deadlineos-demo`.

### Related Files

- `src/app/`
- `src/features/deadlineos/screens.tsx`
- `src/features/deadlineos/store.ts`
- `src/features/deadlineos/ui.tsx`

## Keep Lovable Source As A Design Reference

### Decision

Keep `web_form/` in the repository but exclude it, and the copied web-only support files, from Expo TypeScript compilation.

### Reason

The folder is a separate Vite/TanStack web application. Its browser dependencies are not part of the mobile app and must not be required for Android builds.

### Impact

The Expo app validates only its active routes and native feature code. `web_form/` remains available for visual and copy comparison.

## Remove Unused Browser-Only Framer Motion Source

### Decision

Remove the unused copied browser source files that imported `framer-motion`; keep `web_form/` as the sole web design reference.

### Reason

Framer Motion targets DOM elements such as `div` and `button`, which are not React Native Android/iOS components. The active Expo app already uses native React Native screens and does not install Framer Motion.

### Impact

The mobile dependency boundary is clearer and an accidental future import of the old browser code cannot cause a missing-package or platform-compatibility error. Native wrapper support through `react-native-reanimated` remains unchanged.

### Related Files

- `src/features/deadlineos/`
- `src/tw/`
- `tsconfig.json`
- `package.json`

## Use Supabase Email/Password Authentication With Protected Routes

### Decision

Use Supabase Auth for email/password accounts, Expo SecureStore for device session storage, and Expo Router `Stack.Protected` for route access control.

### Reason

This gives the mobile app one trusted identity service, keeps session tokens out of ordinary app storage, and prevents signed-out users from navigating to DeadlineOS screens.

### Impact

`/` and `/sign-in` are available while signed out. All DeadlineOS routes require a valid session and signing out returns the user to a public route. Existing demo deadlines remain local and are not yet linked to a Supabase database.

### Related Files

- `src/features/auth/`
- `src/app/_layout.tsx`
- `src/app/sign-in.tsx`
- `app.json`
- `package.json`

## Use Browser-Based Google OAuth With Supabase

### Decision

Use Supabase Google OAuth in the system browser and return to the app using the existing `anapp://auth/callback` deep link.

### Reason

The required Expo Linking and WebBrowser packages and the native app scheme already exist. This avoids adding another native Google sign-in dependency while preserving the same secure Supabase session and protected routes.

### Impact

Users can choose Google from the sign-in screen. The Supabase Dashboard must enable the Google provider and permit the redirect URL before the live flow can complete.

### Related Files

- `src/features/auth/google.ts`
- `src/features/auth/AuthScreen.tsx`
- `app.json`

## Integrate Share Intent and Gemini for Data Extraction

### Decision

Enable Android share intent support and integrate Gemini for AI-driven data extraction.

### Reason

To allow users to import documents (images/PDFs) directly from other Android apps into the DeadlineOS flow, automatically extracting deadline information using generative AI.

### Impact

The app can receive shared files, convert them to base64, and process them via `gemini-1.5-flash` to populate deadlines.

### Related Files

- `src/features/share/`
- `src/features/ai/gemini.ts`
- `app.json`

## Map Project as Obsidian Second Brain

### Decision

Map the project documentation as an Obsidian Second Brain by keeping files flat, adding YAML frontmatter, creating a central Map of Content (Home.md), and initializing an `.obsidian` vault.

### Reason

To leverage Obsidian for second brain knowledge management (tags, bi-directional linking, MOC) while preventing hardcoded documentation links in `AGENTS.md` and `CLAUDE.md` from breaking if files were moved to subfolders.

### Impact

The repository root is now an Obsidian vault, and documentation contains metadata and a structural entry point.

### Related Files

- `docs/Home.md`
- `docs/*.md`
