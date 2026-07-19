# Data Flow

## Simple Explanation

The app keeps its demo notebook on the device. While a user writes a notice, it also saves a local intake draft. When the user extracts it, the original source is retained with the notice, the extracted details open as an editable draft, and the approved version makes a deadline and small tasks.

## Main Flow

```mermaid
sequenceDiagram
  participant User
  participant Add as Add screen
  participant Store as Zustand store
  participant Analyze as Mock analyzer
  participant Device as AsyncStorage

  User->>Add: Enter notice text (saved as an intake draft)
  Add->>Store: addNotice
  Add->>Analyze: analyzeNotice
  Analyze->>Store: setAnalysis and open editable extracted draft
  User->>Store: Generate plan
  Store->>Store: Create deadline and tasks
  Store->>Device: Persist deadlineos-demo
```

## Authentication

- Supabase Auth manages the user identity and issued session.
- The session is persisted on device with Expo SecureStore and refreshed while the app is active.
- Expo Router blocks all DeadlineOS routes until a valid session exists.
- Google sign-in returns through `anapp://auth/callback`. The mobile Supabase client uses PKCE, so Google normally returns a `code` query parameter that the callback exchanges through the existing SecureStore-backed client. The callback also accepts an implicit access/refresh-token pair as a compatibility fallback. Email confirmation uses the same route only when it is enabled in Supabase. With Confirm Email disabled, email sign-up returns a session immediately and opens onboarding or Home without a confirmation link.
- The callback checks an existing device session first. An old or incomplete deep link cannot block a user who is already signed in; a signed-out user with an expired link receives a clear error.
- Android may deliver a successful Google callback both to the browser session and the app route. Its one-time code is exchanged only once; a second delivery is treated as successful when the device already has the resulting session.

## Storage

- Storage: AsyncStorage.
- Key: `deadlineos-user-<Supabase user id>`. The signed-out state uses a separate empty key.
- Entities: profile, notices, analyses, deadlines, and tasks.
- The old shared `deadlineos-demo` key is cleared during the first signed-in migration because its owner is unknown.
- Signing out clears the visible local notebook and cancels its scheduled local reminders, so a later account on the same phone cannot see or receive the prior account's data.
- Intake drafts preserve pasted text and selected-file metadata locally until successful extraction. The original text remains on the saved notice; a PDF or screenshot itself remains private in Supabase Storage after live upload.

## Live Notice Analysis (Hackathon Path)

Live text, PDF, and screenshot uploads are stored privately under the signed-in user's ID, then a persisted `analysis_jobs` record moves through queued, reading, extracting, planning, and awaiting approval. Gemini returns a validated extraction. The app polls this saved job while open and resumes up to three queued jobs when a signed-in app session returns. An error offers Retry and an explicitly selected Demo Mode sample, never a silent substitution. Text is limited to 50,000 characters and files to 10 MB before Gemini is called.

## Android Shared Notices

Android apps can send one text/URL, PDF, JPG, PNG, or WebP notice to DeadlineOS from their Share sheet. Text is passed directly to private analysis; files are resolved from a temporary URI and checked against the MIME type and 10 MB limit. A cancelled, unsupported, or failed item is never sent to Gemini. If the user is signed out, the payload stays pending through sign-in and returns to the review screen.
