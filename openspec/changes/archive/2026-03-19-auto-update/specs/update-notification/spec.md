## ADDED Requirements

### Requirement: Update toast notification component
The system SHALL display a toast notification in the bottom-right corner of the app window to communicate update status to the user.

#### Scenario: Toast appears when update is available
- **WHEN** the renderer receives an "available" status event
- **THEN** a toast notification appears at the bottom-right showing the new version number with "Download" and "Later" buttons

#### Scenario: Toast dismissed with Later
- **WHEN** the user clicks "Later" on the update available toast
- **THEN** the toast is dismissed and does not reappear until the next app launch or manual check

### Requirement: Download progress display
The system SHALL show download progress in the toast notification when the user initiates a download.

#### Scenario: Download progress shown
- **WHEN** the user clicks "Download" and the update is downloading
- **THEN** the toast shows a progress bar with the download percentage

#### Scenario: Download completes
- **WHEN** the download finishes
- **THEN** the toast updates to show "Update ready" with "Restart Now" and "Later" buttons

### Requirement: Restart prompt after download
The system SHALL allow the user to restart the app immediately or defer the restart after an update is downloaded.

#### Scenario: User clicks Restart Now
- **WHEN** the user clicks "Restart Now"
- **THEN** the app quits and installs the update

#### Scenario: User clicks Later on restart prompt
- **WHEN** the user clicks "Later" on the restart prompt
- **THEN** the toast is dismissed and the update will be installed on the next manual quit

### Requirement: Up-to-date confirmation on manual check
The system SHALL show a brief toast confirming the app is up to date when a manual check finds no update.

#### Scenario: Manual check finds no update
- **WHEN** the user triggers "Check for Updates..." and no update is available
- **THEN** a toast appears saying "You're up to date" with the current version, and auto-dismisses after 3 seconds

### Requirement: Error display on manual check failure
The system SHALL show an error toast when a manually triggered update check fails.

#### Scenario: Manual check fails
- **WHEN** the user triggers "Check for Updates..." and the check fails
- **THEN** a toast appears saying "Could not check for updates" and auto-dismisses after 5 seconds

### Requirement: Update state management
The system SHALL manage update UI state in a Zustand store that tracks the current update status, version info, download progress, and toast visibility.

#### Scenario: State resets on dismiss
- **WHEN** the user dismisses the toast
- **THEN** the toast visibility is set to false but the underlying update status is preserved (so a downloaded update is still installed on quit)
