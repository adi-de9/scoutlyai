---
tags:
  - secondbrain
  - documentation
---
# Architecture

See also [[03-feature-map]], [[04-screen-flow]], [[05-data-flow]], and [[12-dependency-map]].

## Simple Explanation

DeadlineOS is now a phone app with several rooms instead of an empty house. Expo Router chooses the room (screen), the DeadlineOS feature folder holds the shared rules and visual pieces, and the phone keeps demo data locally so it remains after the app closes.

## UI Layer

Expo Router screens live in `src/app/` and delegate to native React Native screen components in `src/features/deadlineos/screens.tsx`.

The design is ported from `web_form/` using native components, not a WebView:

- Warm off-white, navy, indigo, sky, coral, mint, and amber palette.
- Fraunces headings and Plus Jakarta Sans body text.
- Native cards, gradient buttons, Feather icons, an SVG progress ring, and a fixed mobile bottom navigation bar.
- Dew mascot image from `src/assets/dew-base.png`.

## Navigation Layer

Navigation uses Expo Router and a root `Stack` with headers hidden. The active routes are the landing page, onboarding, home, add, notice analysis, deadline detail, blocker recovery, tasks, calendar, insights, and profile.

## State And Data Layer

`src/features/deadlineos/store.ts` is a typed Zustand store persisted with AsyncStorage under the key `deadlineos-demo`.

It holds the profile, notices, analyses, deadlines, and tasks. The flow uses deterministic mock analysis and plan generation, so it works offline without a backend.

## Native Layer

The native Android project still exists under `android/`. This conversion did not change Gradle, Kotlin, the Android manifest, or `app.json` Android settings.

## Design Reference

`web_form/` remains the unchanged Lovable web design reference. It is intentionally excluded from Expo TypeScript compilation because it is a separate browser/TanStack project with its own dependencies.
