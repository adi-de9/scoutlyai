---
tags:
  - secondbrain
  - documentation
---
# Project Overview

See also [[01-architecture]], [[03-feature-map]], and [[09-current-progress]].

## Project Name

`anapp`

Evidence: `package.json` has `"name": "anapp"` and `app.json` has Expo `name` and `slug` set to `anapp`.

## Main Purpose

This is an Expo React Native starter application. The current UI only shows one placeholder home screen.

## User Problem

No real user problem is implemented yet. The repository is ready for app development, but the product feature direction is not visible in code.

## Target Users

Unknown from the repository.

## Main Features

- Placeholder home screen at `src/app/index.tsx`.
- Expo Router stack navigation from `src/app/_layout.tsx`.
- Android native project checked in under `android/`.
- Web output is configured as static in `app.json`.

## Technology Stack

- TypeScript.
- React 19.
- React Native 0.86.
- Expo SDK 57.
- Expo Router.
- Native Android with Gradle and Kotlin.
- Hermes JavaScript engine on Android.

## Current Project State

The project is in starter-template state. There is no implemented app domain, no API layer, no database layer, no authentication, and no state-management module.

## Supported Platforms

- Android: configured in `app.json` and `android/`.
- iOS: basic Expo config exists in `app.json`, but no native `ios/` folder is present.
- Web: configured through `react-native-web` and `expo start --web`.

## Important Limitations

- The home screen is placeholder text.
- There are no business features implemented yet.
- Android release signing uses the debug signing config in `android/app/build.gradle`, which is not production-ready.
- The app requests Android permissions that are not used by current source code.
