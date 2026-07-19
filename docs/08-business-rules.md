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

## Google OAuth And Optional Email Confirmation Callback

- Rule: Google OAuth must return through `anapp://auth/callback` before a Supabase session is created. Email confirmation uses that route only when Confirm Email is enabled in Supabase; it is currently disabled for the hackathon flow, so new email/password accounts receive a session immediately.
- Rule: A valid stored session takes priority over an old or incomplete callback link, so an already signed-in user continues to onboarding or Home.
- Rule: A repeated Google callback code is not an error after the first exchange has created a device session.
- Rule: Google uses the PKCE flow on mobile, so the return link has an exchangeable code query parameter instead of fragment-only tokens. The app still accepts a legacy implicit access/refresh pair without displaying or logging it, and simultaneous browser/router handling shares one in-flight callback result.
- Evidence: `src/features/auth/callback.ts` exchanges provider codes or verifies email tokens.
- Related files: `src/features/auth/callback.ts`, `src/app/auth/callback.tsx`, `app.json`.

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

## Hackathon Notice Rules

- Only pasted text, PDF, and screenshot are accepted. PDF/image sources must be allowed MIME types and at most 10 MB.
- Live failure always offers Retry and a user-selected Demo Mode sample. The demo path is offline and deterministic.
- Plans build backward from the extracted deadline and use the onboarding planning style. Reminder proposals require approval before local scheduling.
- Done records completion and cancels scheduled reminders. Later moves a task to tomorrow at the chosen reminder time. Blocked raises deterministic risk and opens the recovery assistant.
- A share received from another Android app must be one text/URL, PDF, JPG, PNG, or WebP item. Files must be no larger than 10 MB. DeadlineOS shows a review screen and requires confirmation before private analysis.
- A typed notice is saved as a local intake draft while the user is adding it. After analysis, the original source remains available beside an automatically opened editable extracted draft. Creating a plan never replaces the original notice text.
- Pasted text is limited to 50,000 characters. Files are limited to 10 MB. The mobile app validates these limits and the Edge Functions enforce them again.
- No account can read another account's remote rows or local notebook. Signing out clears the active notebook and cancels its local notifications.
- Gemini is rate-limited per user: six analyses and fifteen blocker requests per rolling ten-minute bucket. Reaching the limit never runs Gemini and returns a retry-later message.

## Static Web Output

- Rule: Web output is static.
- Evidence: `app.json` has `"web": { "output": "static" }`.
- Related files: `app.json`.

## Strict TypeScript

- Rule: TypeScript strict mode is enabled.
- Evidence: `tsconfig.json` sets `"strict": true`.
- Related files: `tsconfig.json`.
