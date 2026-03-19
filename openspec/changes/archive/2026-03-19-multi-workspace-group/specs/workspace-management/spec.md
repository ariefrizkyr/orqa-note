## MODIFIED Requirements

### Requirement: Open folder as workspace
The system SHALL allow users to open a local folder via macOS native folder picker (`NSOpenPanel`). The selected folder is added to the current workspace group and becomes the active workspace. If no workspace group exists yet, the system SHALL create a default group named after the folder.

#### Scenario: First launch — no previous workspace
- **WHEN** user launches the app for the first time
- **THEN** system displays the Welcome Screen with "Open Folder" button and no recent workspaces listed

#### Scenario: Open folder via button
- **WHEN** user clicks "Open Folder" on the Welcome Screen
- **THEN** system opens macOS native folder picker dialog restricted to directory selection

#### Scenario: Folder selected with no existing group
- **WHEN** user selects a folder named "my-project" and no workspace groups exist
- **THEN** system creates a workspace group named "my-project" with that folder, sets it as the active workspace, displays its contents in the sidebar, and hides the Welcome Screen

#### Scenario: Folder selected with existing group
- **WHEN** user selects a folder while a workspace group is active in the current window
- **THEN** system adds the folder to the current group's workspace list and switches to it as the active workspace

#### Scenario: Folder picker cancelled
- **WHEN** user cancels the folder picker dialog
- **THEN** system returns to the previous state (Welcome Screen or current workspace) with no changes

### Requirement: Recent workspaces
The system SHALL maintain a list of up to 10 recently opened folder paths, persisted in Electron `userData` as `recent-workspaces.json`, deduplicated by absolute path.

#### Scenario: Open recent workspace
- **WHEN** user clicks a folder path in the Recent list on the Welcome Screen
- **THEN** system opens that folder as a workspace within the current group (or creates a default group if none exists)

#### Scenario: Recent folder no longer exists
- **WHEN** user clicks a recent workspace path that no longer exists on disk
- **THEN** system shows an error message and removes the entry from the recent list

#### Scenario: Recent list ordering
- **WHEN** user opens a workspace
- **THEN** that folder path moves to the top of the recent list, pushing others down, capped at 10 entries

### Requirement: Switch workspace
The system SHALL allow users to switch workspaces via the sidebar dropdown within the current workspace group. `Cmd+O` SHALL open the folder picker to add a new workspace to the current group. Switching workspace SHALL save the current workspace state, then restore the target workspace state (tabs, expandedPaths, sidebarVisible) within the same window.

#### Scenario: Switch via sidebar dropdown
- **WHEN** user selects a different workspace from the sidebar dropdown
- **THEN** system saves current workspace state, restores the target workspace state, and updates the file tree

#### Scenario: Add workspace via keyboard shortcut
- **WHEN** user presses `Cmd+O` while a workspace is open
- **THEN** system opens the folder picker to add a new workspace to the current group

#### Scenario: Workspace switch with open tabs
- **WHEN** user switches to a different workspace while tabs are open
- **THEN** system saves current tab state and expandedPaths, loads the target workspace's persisted tabs and expandedPaths, and updates all views

#### Scenario: Open folder from Welcome Screen
- **WHEN** user presses `Cmd+O` on the Welcome Screen (no workspace loaded)
- **THEN** system opens the folder picker, creates a default group if needed, and loads the selected folder

## REMOVED Requirements

### Requirement: Switch workspace
**Reason**: Replaced by workspace switching within groups via sidebar dropdown. The old behavior (Cmd+O replaces workspace in window, destroying all state) is superseded by the group-based model where Cmd+O adds to the current group.
**Migration**: Cmd+O now adds workspaces to the current group. Workspace switching happens via the sidebar dropdown.
