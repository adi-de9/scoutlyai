---
tags:
  - secondbrain
  - documentation
---
# Feature Map

See also [[04-screen-flow]], [[05-data-flow]], and [[09-current-progress]].

## Placeholder Home Screen

- Status: Complete.
- User purpose: Confirms the app can render an initial screen.
- Related screens: `src/app/index.tsx`.
- Related components: React Native `View`, `Text`.
- Related services: None.
- Related database collections or tables: None.
- Related files: `src/app/index.tsx`.
- Missing parts: Real product content and interactions.
- Possible risks: Users see starter text instead of an actual app.

## Stack Navigation

- Status: Partially complete.
- User purpose: Provides a navigation container for current and future routes.
- Related screens: All files under `src/app/`.
- Related components: Expo Router `Stack`.
- Related services: None.
- Related database collections or tables: None.
- Related files: `src/app/_layout.tsx`, `package.json`.
- Missing parts: No extra screens, tabs, modals, auth redirects, or route groups.
- Possible risks: Future routes need to follow Expo Router conventions.

## Android Native Build Support

- Status: Partially complete.
- User purpose: Allows running/building the app on Android.
- Related screens: All React Native screens render through Android `MainActivity`.
- Related components: Native Android `MainActivity`, `MainApplication`.
- Related services: Expo autolinking, React Native Gradle Plugin.
- Related database collections or tables: None.
- Related files: `android/`, `app.json`, `package.json`.
- Missing parts: Production release signing and product-specific native integrations.
- Possible risks: Debug signing is used for release builds; native permissions may be broader than current app behavior.

## Web Support

- Status: Partially complete.
- User purpose: Allows running the app in a browser.
- Related screens: `src/app/index.tsx`.
- Related components: React Native Web.
- Related services: None.
- Related database collections or tables: None.
- Related files: `app.json`, `package.json`.
- Missing parts: Real web UX and web-specific verification.
- Possible risks: Web behavior is not tested in this task.

## Authentication

- Status: Complete for email/password and Google OAuth authentication.
- User purpose: Keeps DeadlineOS routes available only to signed-in users.
- Related screens: `src/app/sign-in.tsx`.
- Related components: `src/features/auth/AuthScreen.tsx`, `src/features/auth/AuthProvider.tsx`.
- Related services: Supabase Auth.
- Related database collections or tables: Supabase managed `auth.users` only; no application table is added.
- Related files: `src/app/_layout.tsx`, `src/features/auth/`, `.env.local`.
- Missing parts: Password reset, account deletion, and remote deadline-data sync.
- Possible risks: Google OAuth requires the provider and `anapp://auth/callback` redirect URL to be configured in Supabase.

## Database / Persistence

- Status: Not Started.
- User purpose: Unknown.
- Related screens: None found.
- Related components: None found.
- Related services: None found.
- Related database collections or tables: None found.
- Related files: None found.
- Missing parts: Database choice, schema, migrations, validation, security rules.
- Possible risks: Data model decisions are still open.

## Notifications / Background Tasks / Widgets

- Status: Not Started.
- User purpose: Unknown.
- Related screens: None found.
- Related components: None found.
- Related services: None found.
- Related database collections or tables: None found.
- Related files: None found.
- Missing parts: Notification permissions, handlers, background task registration, widget code.
- Possible risks: These features require platform-specific testing when added.
