# APIs And Services

See also [[05-data-flow]], [[06-database-schema]], and [[14-open-questions]].

## External APIs

Supabase Auth is called through `@supabase/supabase-js` for email/password and Google OAuth sign-in, session refresh, and sign-out.

## Internal Services

No internal service modules are present.

## SDKs

| SDK / Package      | Purpose                 | Configuration                         | Files Using It        |
| ------------------ | ----------------------- | ------------------------------------- | --------------------- |
| Expo               | App runtime and tooling | `app.json`, `package.json`            | Project-wide          |
| Expo Router        | File-based routing      | `package.json`, `src/app/_layout.tsx` | `src/app/_layout.tsx` |
| React Native       | Native UI runtime       | `package.json`                        | `src/app/index.tsx`   |
| React Native Web   | Web rendering           | `package.json`, `app.json`            | Web build/runtime     |
| Expo Splash Screen | Splash screen config    | `app.json`, native generated files    | Android native layer  |
| Supabase JS        | Email/password auth and session refresh | `.env.local` | `src/features/auth/` |
| Expo SecureStore   | Device-protected auth-session storage | `app.json` plugin | `src/features/auth/supabase.ts` |

## Authentication Providers

Supabase Auth with email/password and Google OAuth client flow is configured in the app for project `event` (`fommedcwcbstrmotqoje`). The Google provider still needs dashboard credentials and redirect configuration.

## Notification Services

None found.

## Analytics Services

None found.

## Error Tracking

None found.

## Payment Services

None found.

## Background Services

None found.

## Environment Variables

The app requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `.env.local` contains local configuration and is ignored by Git; `.env.example` documents the names without a real key.
