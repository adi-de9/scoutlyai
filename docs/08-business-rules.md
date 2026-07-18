# Business Rules

See also [[03-feature-map]], [[10-known-issues]], and [[14-open-questions]].

No product-specific business rules are implemented yet.

## Rules Visible In Code

## Authenticated Access

- Rule: DeadlineOS routes require an authenticated Supabase session.
- Evidence: `src/app/_layout.tsx` uses Expo Router `Stack.Protected` guards.
- Related files: `src/app/_layout.tsx`, `src/features/auth/AuthProvider.tsx`.

## Credential Validation

- Rule: Email must have a valid email shape and passwords must be at least six characters before a request is sent.
- Evidence: `src/features/auth/AuthScreen.tsx`.
- Related files: `src/features/auth/AuthScreen.tsx`.

## Google OAuth Callback

- Rule: Google OAuth must return through the app redirect URL before a Supabase session is created.
- Evidence: `src/features/auth/google.ts` uses `Linking.createURL("auth/callback")` and `exchangeCodeForSession`.
- Related files: `src/features/auth/google.ts`, `app.json`.

## Portrait Orientation

- Rule: App orientation is portrait.
- Evidence: `app.json` sets `"orientation": "portrait"` and Android `MainActivity` uses `android:screenOrientation="portrait"`.
- Related files: `app.json`, `android/app/src/main/AndroidManifest.xml`.

## Android Predictive Back Disabled

- Rule: Android predictive back is disabled.
- Evidence: `app.json` sets `"predictiveBackGestureEnabled": false`; Android application has `android:enableOnBackInvokedCallback="false"`.
- Related files: `app.json`, `android/app/src/main/AndroidManifest.xml`.

## Automatic Interface Style

- Rule: User interface style is automatic.
- Evidence: `app.json` sets `"userInterfaceStyle": "automatic"`; Android strings include `expo_system_ui_user_interface_style` as `automatic`.
- Related files: `app.json`, `android/app/src/main/res/values/strings.xml`.

## Static Web Output

- Rule: Web output is static.
- Evidence: `app.json` has `"web": { "output": "static" }`.
- Related files: `app.json`.

## Strict TypeScript

- Rule: TypeScript strict mode is enabled.
- Evidence: `tsconfig.json` sets `"strict": true`.
- Related files: `tsconfig.json`.
