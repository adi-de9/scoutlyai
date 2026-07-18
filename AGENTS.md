# AI Agent Instructions

## How To Explain Work

The user is a coder but still learning. Explain technical work in simple words first, like teaching a 10-year-old, then add the exact developer details needed to make the change safely.

## Before Making Changes

1. Read `docs/00-project-overview.md`.
2. Read `docs/01-architecture.md`.
3. Read `docs/09-current-progress.md`.
4. Read `docs/10-known-issues.md`.
5. Read the documentation related to the requested feature.
6. Inspect only the necessary source files.
7. Explain the implementation plan before editing.

## Expo SDK 57 Rule

Expo has changed. Before writing any Expo code, read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/.

## Android Project Rule

This project has a native `android/` folder and uses Expo SDK 57.

Before changing Android behavior, check both:

- `app.json` for Expo Android config.
- `android/` for native Gradle/Kotlin/Java changes.

After Android-related changes, verify with the narrowest useful command:

- `npm run android` when checking the app on a device or emulator.
- `cd android; .\gradlew.bat assembleDebug` when checking native Android compilation only.

Do not regenerate or overwrite the native Android project unless the user explicitly asks.

## Development Rules

- Follow the existing project architecture.
- Do not rewrite unrelated code.
- Do not change working behaviour without a clear reason.
- Do not install a package without explaining why it is required.
- Reuse existing components and utilities.
- Keep business logic outside UI components when possible.
- Follow existing naming conventions.
- Follow existing code formatting.
- Preserve platform-specific behaviour.
- Handle loading, empty, success and error states.
- Validate user input.
- Avoid exposing secrets.
- Do not use placeholder implementations.
- Do not mark work complete without verification.

## Testing Rules

After changes, verify:

- Main success flow.
- Error flow.
- Empty state.
- Loading state.
- Offline behaviour when relevant.
- Android behaviour when relevant.
- iOS behaviour when relevant.
- Background behaviour when relevant.
- App-killed behaviour when relevant.
- Database update when relevant.
- UI refresh.
- Navigation behaviour.

## Documentation Rules

After making changes, update:

- `docs/09-current-progress.md`.
- `docs/10-known-issues.md`.
- `docs/13-decisions.md` when an architectural decision changes.
- Feature-specific documentation.

## Final Response Format

Always explain:

1. What changed.
2. Why it changed.
3. Files changed.
4. Tests performed.
5. Remaining risks.
6. Recommended next step.
