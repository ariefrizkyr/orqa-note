## ADDED Requirements

### Requirement: Auto-updater service initialization
The system SHALL initialize an auto-updater service in the main process on app startup that is configured to check GitHub Releases for new versions with `autoDownload` set to `false`.

#### Scenario: App starts and configures updater
- **WHEN** the app starts
- **THEN** the auto-updater service is initialized with GitHub Releases as the update provider and auto-download disabled

### Requirement: Background update check on launch
The system SHALL automatically check for updates 10 seconds after the app finishes launching, silently in the background.

#### Scenario: App launches and checks for updates after delay
- **WHEN** the app window is ready
- **THEN** the system waits 10 seconds and checks for updates without showing any UI if no update is found

#### Scenario: Network is unavailable during background check
- **WHEN** the background update check fails due to network error
- **THEN** the system silently ignores the error and does not show any notification

### Requirement: Manual update check via menu
The system SHALL provide a "Check for Updates..." menu item in the macOS app menu between "About Orqa Note" and the first separator.

#### Scenario: User clicks Check for Updates with no update available
- **WHEN** the user clicks "Check for Updates..." and no update is available
- **THEN** the system sends an "up-to-date" status event to the renderer

#### Scenario: User clicks Check for Updates with update available
- **WHEN** the user clicks "Check for Updates..." and a new version is available
- **THEN** the system sends an "available" status event to the renderer with the new version info

#### Scenario: User clicks Check for Updates with network error
- **WHEN** the user clicks "Check for Updates..." and the check fails
- **THEN** the system sends an "error" status event to the renderer

### Requirement: Update download on user request
The system SHALL download the update only when the renderer sends a download command via the `updater:download` IPC channel.

#### Scenario: User initiates download
- **WHEN** the renderer invokes `updater:download`
- **THEN** the system begins downloading the update and sends progress events to all windows via `updater:status`

#### Scenario: Download completes
- **WHEN** the update download finishes
- **THEN** the system sends a "downloaded" status event to all windows

### Requirement: Install update on user request
The system SHALL quit the app and install the downloaded update when the renderer sends an install command via the `updater:install` IPC channel.

#### Scenario: User triggers install
- **WHEN** the renderer invokes `updater:install`
- **THEN** the system quits the app and installs the update

### Requirement: Update status IPC channel
The system SHALL broadcast update status events to all open windows via the `updater:status` IPC channel. Status events SHALL include a `status` field with one of: `checking`, `available`, `not-available`, `downloading`, `downloaded`, `error`, and optionally `version`, `progress`, and `error` fields.

#### Scenario: Update available event
- **WHEN** a new version is found
- **THEN** the system sends `{ status: 'available', version: '<version>' }` to all windows

#### Scenario: Download progress event
- **WHEN** the update is downloading
- **THEN** the system sends `{ status: 'downloading', progress: <percent> }` to all windows

### Requirement: Preload bridge for updater
The system SHALL expose an `updater` namespace in the preload context bridge with methods: `check()`, `download()`, `install()`, and `onStatus(callback)`.

#### Scenario: Renderer checks for updates
- **WHEN** the renderer calls `window.electronAPI.updater.check()`
- **THEN** it invokes the `updater:check` IPC handle in the main process

#### Scenario: Renderer listens for status updates
- **WHEN** the renderer calls `window.electronAPI.updater.onStatus(callback)`
- **THEN** the callback is invoked whenever the main process sends a `updater:status` event, and a cleanup function is returned

### Requirement: Build configuration for auto-update
The system SHALL include both `dmg` and `zip` targets in the macOS electron-builder configuration, and SHALL include a `publish` configuration pointing to the GitHub repository.

#### Scenario: Build produces update-compatible artifacts
- **WHEN** the app is built for macOS
- **THEN** both a DMG and a ZIP file are produced, along with a `latest-mac.yml` manifest
