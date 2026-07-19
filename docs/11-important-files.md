---
tags:
  - secondbrain
  - documentation
---
# Important Files

See also [[02-folder-map]] and [[15-ai-agent-workflow]].

## Application Entry

- `package.json`: Defines `"main": "expo-router/entry"` and all scripts/dependencies.
- `src/app/_layout.tsx`: Root Expo Router layout.
- `src/app/index.tsx`: Only current app screen.
- `src/global.css`: Tailwind CSS v4 global stylesheet imported by the root layout.
- `metro.config.js`: NativeWind Metro setup.
- `postcss.config.mjs`: Tailwind v4 PostCSS plugin setup.

## Navigation

- `src/app/_layout.tsx`: Creates the root stack navigator.
- `src/app/index.tsx`: Defines the `/` route.

## State Management

- None currently. Future agents should search for stores/hooks before adding one.

## Database

- None currently.

## Services

- None currently.

## Authentication

- `src/features/auth/supabase.ts`: Configures the Supabase client and SecureStore session adapter.
- `src/features/auth/AuthProvider.tsx`: Loads and observes the Supabase session.
- `src/features/auth/AuthScreen.tsx`: Email/password sign-in and sign-up UI.
- `src/features/auth/google.ts`: Google browser OAuth launch and Supabase authorization-code exchange.
- `src/app/_layout.tsx`: Router guards for signed-in and signed-out routes.
- `.env.local`: Local Supabase URL and publishable key; ignored by Git.

## Notifications

- No JavaScript notification service exists. Android manifest includes `VIBRATE`.

## Native Code

- `android/settings.gradle`: Configures Expo and React Native Gradle plugin autolinking.
- `android/build.gradle`: Top-level Android build configuration.
- `android/gradle.properties`: Android, Hermes, new architecture, image support, and packaging flags.
- `android/app/build.gradle`: Android app module config, namespace, application ID, release/debug config, Hermes/JSC choice.
- `android/app/src/main/AndroidManifest.xml`: Android permissions, deep link scheme, app/activity config.
- `android/app/src/main/java/com/adityaakffa/anapp/MainActivity.kt`: Main React Native Android activity and splash registration.
- `android/app/src/main/java/com/adityaakffa/anapp/MainApplication.kt`: React Native host and Expo lifecycle setup.

## Widgets

- None currently.

## Configuration

- `app.json`: Expo app config for icons, splash screen, scheme, Android package, web output, and experiments.
- `tsconfig.json`: TypeScript strict mode and path aliases.
- `metro.config.js`: Enables NativeWind with `react-native-css`.
- `postcss.config.mjs`: Enables `@tailwindcss/postcss`.
- `AGENTS.md`: AI-agent workflow and project-specific rules.
- `CLAUDE.md`: Points to `AGENTS.md`.

## Testing

- No testing files or scripts are currently configured.
