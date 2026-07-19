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

Use the dedicated DeadlineOS Supabase project for email/password accounts, Expo SecureStore for device session storage, and Expo Router `Stack.Protected` for route access control.

### Reason

This gives DeadlineOS its own trusted identity service instead of sharing the `event` project, keeps session tokens out of ordinary app storage, and prevents signed-out users from navigating to DeadlineOS screens.

### Impact

`/` and `/sign-in` are available while signed out. All DeadlineOS routes require a valid session from the DeadlineOS project and signing out returns the user to a public route. Existing demo deadlines remain local and are not yet linked to a Supabase database. Existing users in the old shared `event` project are deliberately not copied.

### Related Files

- `src/features/auth/`
- `src/app/_layout.tsx`
- `src/app/sign-in.tsx`
- `app.json`
- `package.json`

## Use Browser-Based Google OAuth With Supabase

### Decision

Use Supabase Google OAuth in the system browser and return to the app using the existing `anapp://auth/callback` deep link with PKCE enabled in the mobile client.

### Reason

The required Expo Linking and WebBrowser packages and the native app scheme already exist. PKCE returns an exchangeable query code instead of fragment-only tokens that Android deep-link routing can omit. This avoids adding another native Google sign-in dependency while preserving the same secure Supabase session and protected routes.

### Impact

Users can choose Google from the sign-in screen. The callback exchanges the PKCE code through the SecureStore-backed Supabase client, while legacy implicit pairs remain supported as a fallback. The Supabase Dashboard must enable the Google provider and permit the redirect URL before the live flow can complete.

### Related Files

- `src/features/auth/google.ts`
- `src/features/auth/AuthScreen.tsx`
- `app.json`

## Use Supplied DeadlineOS Fox Artwork For App Branding

### Decision

Use the supplied `deadlineos.png` fox artwork for the launcher icon, Android adaptive and themed icons, Android splash image, and web favicon. Keep `src/assets/dew-base.png` as the separate in-app Dew mascot.

### Reason

The user selected the fox artwork as the application identity but explicitly kept Dew for the app's on-screen experience.

### Impact

Expo source assets and the current Android density resources now use the fox artwork, so a debug APK receives the new branding without regenerating the native Android project. The app's routes, authentication, state, and in-app mascot artwork are unchanged. The direct Android resource files remain subject to the repository's existing `android/` Git-ignore policy.

### Related Files

- `app.json`
- `assets/images/`
- `android/app/src/main/res/mipmap-*`
- `android/app/src/main/res/drawable-*`
- `src/assets/dew-base.png`

## Use Snake Case For Future DeadlineOS Database Identifiers

### Decision

Use `snake_case` for every future DeadlineOS application table, column, foreign-key column, index, constraint, SQL migration name, and database function.

### Reason

The user selected one consistent database naming style before the application schema is created. It keeps SQL names easy to read and avoids having to mix styles later.

### Impact

Examples include `deadline_items`, `user_id`, `created_at`, and `deadline_items_user_id_idx`. No application table exists yet, so this decision does not rename or migrate any data.

### Related Files

- Future `supabase/migrations/` files
- Future database types and repositories

## Use Gemini Server-Side With Explicit Demo Mode

### Decision

Use Gemini `gemini-2.5-flash-lite` for normal structured extraction and retry once with `gemini-2.5-flash`; keep the local deterministic analyzer as a clearly selected Demo Mode.

### Reason

Gemini supports the required text, screenshot, and PDF inputs from one private server-side integration, while Demo Mode makes the hackathon flow reliable without network or a key.

### Impact

The Gemini key belongs only in Supabase Edge Function secrets. User originals use private Storage and analysis jobs persist queue progress instead of a fake timer.

## Receive Android PDF And Screenshot Shares Through Expo Sharing

### Decision

Use Expo SDK 57 `expo-sharing` with narrow Android `ACTION_SEND` MIME filters. Redirect an incoming one-file share to a confirmation route before calling the existing private upload service.

### Reason

It lets users send a notice directly from Files, Gallery, email, or chat apps without adding broad storage access or a second extraction path.

### Impact

The app appears in Android's Share sheet for text, PDF, JPG, PNG, and WebP. The app accepts one reviewed item at a time; text is analyzed directly while files are validated and privately uploaded. Unsupported, oversized, or cancelled shares do not upload. A signed-out user is sent to sign-in and returned to the pending shared item afterward.

## Keep Deadline OS Technical Identifiers Stable

### Decision

Show the app as `Deadline OS` while retaining package `com.adityaakffa.anapp`, Expo slug `anapp`, and scheme `anapp`.

### Reason

The visible product name should be clear without breaking installed-app identity, the existing Android deep link, Supabase redirects, or local data.

### Impact

Only the launcher/display name changes. Existing Android installs and `anapp://auth/callback` remain compatible.

## Use Android-Only `anapp://auth/callback` For Auth Completion

### Decision

Use one Android deep link for Google OAuth and email confirmation, with a public Expo Router callback route.

### Reason

It prevents Supabase from falling back to a browser localhost URL and lets the mobile app create the protected local session itself.

### Impact

Supabase must allow the exact URL and its email template must preserve `{{ .ConfirmationURL }}`. This decision is Android-only; iOS universal links are out of scope.
