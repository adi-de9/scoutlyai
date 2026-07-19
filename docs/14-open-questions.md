---
tags:
  - secondbrain
  - documentation
---
# Open Questions

See also [[00-project-overview]], [[09-current-progress]], and [[10-known-issues]].

## Product Direction

- What is the app supposed to do?
- Who are the target users?
- What is the first complete user flow?

## Authentication

- Supabase email/password authentication is selected.
- Sessions persist across app restarts through Expo SecureStore.
- Should email confirmation remain enabled, and is Google OAuth provider configuration complete in Supabase and Google Cloud?

## Data And Storage

- Is data local-only, remote-only, or both?
- Which database should be used?
- Are migrations required?
- What data needs encryption?

## APIs And Services

- Are there backend APIs?
- Are there required environment variables?
- Is there an error tracking or analytics requirement?

## Notifications And Background Work

- Does the app need push notifications?
- Does the app need local reminders?
- Does the app need background sync?
- Does anything need to work when the app is killed?

## Android

- Are all current Android permissions needed?
- Should release signing be configured now or later?
- Is predictive back intentionally disabled?

## iOS

- Is iOS a target platform for production?
- Should a native `ios/` folder be generated?

## Web

- Is web a real target or only a development convenience?
- Does static web output need production verification?

## Design

- Is there a design reference, brand guide, or Figma file?
- Are the tab icon assets intended for future navigation?
