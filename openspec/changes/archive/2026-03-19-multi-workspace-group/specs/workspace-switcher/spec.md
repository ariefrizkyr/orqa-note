## ADDED Requirements

### Requirement: Workspace switcher dropdown
The sidebar header SHALL display a dropdown showing the active workspace name (folder basename) with a chevron indicator. Clicking it SHALL open a popover listing all workspaces in the current group.

#### Scenario: Display active workspace
- **WHEN** the sidebar is visible and a workspace is active
- **THEN** the header shows the workspace folder basename with a dropdown chevron, replacing the previous static folder name display

#### Scenario: Open dropdown
- **WHEN** user clicks the workspace name in the sidebar header
- **THEN** a popover appears listing all workspaces in the current group with the active one marked with a checkmark

#### Scenario: Close dropdown
- **WHEN** user clicks outside the dropdown or presses Escape
- **THEN** the dropdown closes

### Requirement: Switch workspace via dropdown
Selecting a workspace from the dropdown SHALL switch the active workspace within the current group, saving the current workspace state and restoring the target workspace state.

#### Scenario: Switch to different workspace
- **WHEN** user selects "backend-api" from the dropdown while "frontend-app" is active
- **THEN** the system saves current state (tabs, expandedPaths, sidebarVisible), loads backend-api's persisted state, updates the file tree, and sets backend-api as active

#### Scenario: Select already-active workspace
- **WHEN** user selects the workspace that is already active
- **THEN** the dropdown closes with no state change

#### Scenario: Switch to workspace with cached state
- **WHEN** user switches to a workspace that has been preloaded in memory
- **THEN** the switch is instantaneous — cached rootNodes, tabs, and expandedPaths are loaded into stores without disk reads

#### Scenario: Switch to workspace without cached state
- **WHEN** user switches to a workspace that is not in the memory cache
- **THEN** the system reads the workspace directory and state file from disk, then loads the state into stores

### Requirement: Add workspace to group
The dropdown SHALL include an "+ Add workspace..." option that adds a workspace to the current group. When the group has exactly one workspace (becoming a multi-workspace group for the first time), the system SHALL prompt the user to name the group before proceeding with the folder picker. When the group already has two or more workspaces, the folder picker opens directly.

#### Scenario: Add workspace to single-workspace group (first time)
- **WHEN** user clicks "+ Add workspace..." and the group has exactly 1 workspace
- **THEN** the system shows an inline input pre-filled with the current group name, asking the user to name the group

#### Scenario: Confirm group name and add workspace
- **WHEN** user enters a group name and clicks "Continue"
- **THEN** the system renames the group, opens the macOS folder picker, adds the selected folder, and switches to it

#### Scenario: Cancel group naming
- **WHEN** user clicks "Cancel" on the group naming prompt
- **THEN** no workspace is added and the dropdown remains open

#### Scenario: Add workspace to multi-workspace group
- **WHEN** user clicks "+ Add workspace..." and the group already has 2 or more workspaces
- **THEN** the system opens the macOS folder picker directly, adds the selected folder to the current group's workspace list, and switches to it

#### Scenario: Add workspace that already exists in group
- **WHEN** user selects a folder that is already in the current group
- **THEN** the system switches to the existing workspace without creating a duplicate entry

#### Scenario: Cancel add workspace
- **WHEN** user cancels the folder picker
- **THEN** no workspace is added and the dropdown closes

### Requirement: Remove workspace from group
Right-clicking a workspace in the dropdown SHALL show a context menu with "Remove from group" option. Removing a workspace SHALL remove it from the group's workspace list without deleting any persisted state on disk.

#### Scenario: Remove workspace via context menu
- **WHEN** user right-clicks a workspace in the dropdown and selects "Remove from group"
- **THEN** the workspace is removed from the group's workspace list

#### Scenario: Remove the currently active workspace
- **WHEN** user removes the currently active workspace and other workspaces exist in the group
- **THEN** the system switches to the next workspace in the list

#### Scenario: Remove the last workspace in group
- **WHEN** user removes the only workspace in a group
- **THEN** the system deletes the group, unbinds it from the window, rebuilds the app menu, and shows the welcome screen

#### Scenario: Removed workspace state preserved on disk
- **WHEN** a workspace is removed from a group
- **THEN** its persisted state files (workspace-state.json) remain on disk so re-adding the workspace later restores its state

### Requirement: Lazy preload inactive workspaces
After the active workspace loads, the system SHALL preload up to 2 inactive workspaces in the group (most recently used first) into an in-memory cache after a 2-second idle delay.

#### Scenario: Preload after active workspace loads
- **WHEN** the active workspace finishes loading and the group has 3 workspaces
- **THEN** after 2 seconds of idle, the system reads the directory tree and state file for the other 2 workspaces into memory

#### Scenario: Cache eviction
- **WHEN** the cache holds 3 workspace snapshots and a new one needs to be added
- **THEN** the least-recently-used entry is evicted from the cache

#### Scenario: Preload of workspace whose folder no longer exists
- **WHEN** the system attempts to preload a workspace whose folder has been deleted from disk
- **THEN** the system skips the preload for that workspace without error
