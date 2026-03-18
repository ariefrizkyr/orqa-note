## ADDED Requirements

### Requirement: Create new window via menu
The system SHALL provide a "New Window" menu item under the File menu with the keyboard shortcut `Cmd+N` that creates a new blank application window.

#### Scenario: New window from menu
- **WHEN** user clicks File > New Window or presses `Cmd+N`
- **THEN** system creates a new BrowserWindow with no workspace loaded, displaying the WelcomeScreen with recent workspaces list and "Open Folder" button

#### Scenario: New window while workspace is open
- **WHEN** user presses `Cmd+N` while working in a window with an active workspace
- **THEN** system creates a new blank window without affecting the existing window's state

#### Scenario: New window with no focused window (macOS)
- **WHEN** all windows are closed and user presses `Cmd+N` or clicks the dock icon
- **THEN** system creates a new blank window displaying the WelcomeScreen
