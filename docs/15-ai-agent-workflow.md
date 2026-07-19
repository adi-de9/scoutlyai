---
tags:
  - secondbrain
  - documentation
---
# AI Agent Workflow

See also [[00-project-overview]], [[09-current-progress]], and [[10-known-issues]].

## Simple Explanation

Future AI agents should not run around the whole project randomly. They should first read the map, then open only the rooms they need, then make a small careful change.

## Required Process

1. Read `AGENTS.md`.
2. Read [[00-project-overview]].
3. Read [[01-architecture]].
4. Read [[09-current-progress]].
5. Read [[10-known-issues]].
6. Read documentation related to the requested feature.
7. Inspect only relevant source files.
8. Create a change plan.
9. Make focused changes.
10. Test the affected flow.
11. Update documentation after the work.

## Expo Rule

Before writing Expo code, read the exact SDK 57 docs at:

https://docs.expo.dev/versions/v57.0.0/

## Android Rule

Before Android changes, inspect both:

- `app.json`
- `android/`

After Android changes, verify with the narrowest useful command:

- `npm run android` for device/emulator behavior.
- `cd android; .\gradlew.bat assembleDebug` for native Android compilation.

## Documentation Update Rule

After app changes, update:

- [[09-current-progress]]
- [[10-known-issues]]
- [[13-decisions]] when architecture changes
- The feature-specific doc file

## Final Response Rule

Final responses should explain:

1. What changed.
2. Why it changed.
3. Files changed.
4. Tests performed.
5. Remaining risks.
6. Recommended next step.
