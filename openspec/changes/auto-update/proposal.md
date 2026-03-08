## Why

Orqa Note is distributed as a macOS DMG with code signing and notarization, but users have no way to know when a new version is available. They must manually check for updates. Adding auto-update support ensures users stay on the latest version with minimal friction.

## What Changes

- Add `electron-updater` to check for updates against GitHub Releases
- Add a toast notification (bottom-right) when a new version is available, with download progress and restart prompt
- Add a "Check for Updates..." menu item in the macOS app menu (between About and Preferences)
- Add a ZIP build target alongside DMG for macOS auto-update compatibility
- Configure `publish` provider in electron-builder for GitHub Releases

## Capabilities

### New Capabilities

- `update-checker`: Main process service that checks GitHub Releases for new versions, downloads updates, and manages the update lifecycle (check → notify → download → install)
- `update-notification`: Renderer-side toast UI component that displays update availability, download progress, and restart prompt

### Modified Capabilities

## Impact

- **Dependencies**: Add `electron-updater` package
- **Build config**: Add `publish` provider and `zip` target to `electron-builder.yml`
- **Main process**: New auto-updater service, new IPC handlers for update events
- **Preload**: New `updater` namespace in context bridge
- **Renderer**: New toast component, new state management for update status
- **App menu**: Switch from `appMenu` role to custom menu with "Check for Updates..." item
