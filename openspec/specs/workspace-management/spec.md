## ADDED Requirements

### Requirement: Open folder as workspace
The system SHALL allow users to open a local folder via macOS native folder picker (`NSOpenPanel`). The selected folder becomes the workspace root and its contents are displayed in the sidebar.

#### Scenario: First launch — no previous workspace
- **WHEN** user launches the app for the first time
- **THEN** system displays the Welcome Screen with "Open Folder" button and no recent workspaces listed

#### Scenario: Open folder via button
- **WHEN** user clicks "Open Folder" on the Welcome Screen
- **THEN** system opens macOS native folder picker dialog restricted to directory selection

#### Scenario: Folder selected
- **WHEN** user selects a folder in the picker
- **THEN** system sets that folder as workspace root, displays its contents in the sidebar, and hides the Welcome Screen

#### Scenario: Folder picker cancelled
- **WHEN** user cancels the folder picker dialog
- **THEN** system returns to the previous state (Welcome Screen or current workspace) with no changes

### Requirement: Recent workspaces
The system SHALL maintain a list of up to 10 recently opened folder paths, persisted in Electron `userData` as `recent-workspaces.json`, deduplicated by absolute path.

#### Scenario: Open recent workspace
- **WHEN** user clicks a folder path in the Recent list on the Welcome Screen
- **THEN** system opens that folder as the workspace root

#### Scenario: Recent folder no longer exists
- **WHEN** user clicks a recent workspace path that no longer exists on disk
- **THEN** system shows an error message and removes the entry from the recent list

#### Scenario: Recent list ordering
- **WHEN** user opens a workspace
- **THEN** that folder path moves to the top of the recent list, pushing others down, capped at 10 entries

### Requirement: Switch workspace
The system SHALL allow users to switch workspaces via `Cmd+O` or sidebar header, which opens the folder picker. Switching workspace always occurs in the current window — it closes all open tabs, resets the sidebar, and loads the new workspace. The system SHALL NOT spawn a new window from the Open Folder action.

#### Scenario: Switch via keyboard shortcut
- **WHEN** user presses `Cmd+O` while a workspace is open
- **THEN** system opens the folder picker to select a new workspace in the current window

#### Scenario: Workspace switch with open tabs
- **WHEN** user selects a different folder while tabs are open
- **THEN** system saves current tab state, closes all tabs, destroys all WebContentsViews, and loads the new workspace in the same window

#### Scenario: Open folder from Welcome Screen
- **WHEN** user presses `Cmd+O` on the Welcome Screen (no workspace loaded)
- **THEN** system opens the folder picker and loads the selected folder in the current window

#### Scenario: Open folder via menu while workspace exists
- **WHEN** user clicks File > Open Folder while a workspace is already open
- **THEN** system opens the folder picker and swaps the workspace in the current window (does not create a new window)
