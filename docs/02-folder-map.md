# Folder Map

See also [[11-important-files]] and [[12-dependency-map]].

Generated folders such as `node_modules`, `.git`, `.expo`, `android/build`, and cache folders are intentionally ignored.

## `src/`

- Purpose: Application source root.
- Important files: `src/app/_layout.tsx`, `src/app/index.tsx`.
- What imports it: Expo Router loads the route files through `expo-router/entry`.
- Depends on: React, React Native, Expo Router.
- Edit carefully: Yes. This is where app screens and future app logic will live.

## `src/app/`

- Purpose: Expo Router route directory.
- Important files: `_layout.tsx`, `index.tsx`.
- What imports it: Expo Router.
- Depends on: `expo-router`, `react-native`.
- Edit carefully: Yes. File names become routes.

## `android/`

- Purpose: Native Android project generated for Expo/React Native.
- Important files: `settings.gradle`, `build.gradle`, `gradle.properties`, `app/build.gradle`, Android manifests, `MainActivity.kt`, `MainApplication.kt`.
- What imports it: Android Gradle build and `expo run:android`.
- Depends on: Android Gradle Plugin, React Native Gradle Plugin, Expo autolinking, Kotlin.
- Edit carefully: Yes. Native changes can break Android builds.

## `assets/`

- Purpose: App icons, splash images, Expo images, and tab icon image assets.
- Important files: `assets/images/icon.png`, `assets/images/splash-icon.png`, `assets/images/android-icon-foreground.png`, `assets/images/android-icon-background.png`, `assets/expo.icon/icon.json`.
- What imports it: `app.json` references app icon and splash assets.
- Depends on: Expo asset handling.
- Edit carefully: Medium. Asset path changes must match `app.json`.

## `.vscode/`

- Purpose: Editor configuration.
- Important files: Unknown until opened for editor-specific changes.
- What imports it: VS Code only.
- Depends on: Local editor.
- Edit carefully: Low for app behavior, medium for team workflow.

## `.claude/`

- Purpose: Claude-related local/project agent configuration.
- Important files: Not inspected because it is not part of the runtime app.
- What imports it: AI tooling, not app runtime.
- Depends on: Local agent tooling.
- Edit carefully: Medium if changing AI workflow.

## Root Files

- `package.json`: dependencies, scripts, app entry.
- `package-lock.json`: exact npm dependency lock.
- `app.json`: Expo config.
- `tsconfig.json`: TypeScript config and path aliases.
- `README.md`: default Expo starter readme.
- `AGENTS.md`: instructions for future AI agents.
- `CLAUDE.md`: points to `AGENTS.md`.
- `.gitignore`: ignored files.
