## ADDED Requirements

### Requirement: Workspace group data model
The system SHALL persist workspace groups in `workspace-groups.json` under `userData`. Each group SHALL have a unique ID, a user-assigned name, an ordered list of workspace folder paths, and the currently active workspace path within that group.

#### Scenario: Groups file structure
- **WHEN** the system reads `workspace-groups.json`
- **THEN** it contains a `groups` array (each with `id`, `name`, `workspaces[]`, `activeWorkspace`) and a `lastOpenedGroupIds` array

#### Scenario: Groups file does not exist
- **WHEN** the app launches and `workspace-groups.json` does not exist
- **THEN** the system treats it as an empty state with no groups

### Requirement: Create workspace group
The system SHALL allow users to create a new workspace group via "File > Open Workspace Group > New Group...". Creating a group SHALL prompt for a name and open a folder picker for the first workspace, then open the group in a new window.

#### Scenario: Create group via menu
- **WHEN** user selects "File > Open Workspace Group > New Group..."
- **THEN** the system prompts for a group name, opens a folder picker, creates the group with the selected folder, and opens a new window for it

#### Scenario: Cancel group creation
- **WHEN** user cancels the name prompt or folder picker during group creation
- **THEN** no group is created and no window is opened

### Requirement: Open workspace group
The system SHALL allow users to open an existing workspace group via "File > Open Workspace Group > {GroupName}". Opening a group SHALL create a new window bound to that group, restoring the group's active workspace with its persisted state.

#### Scenario: Open group not currently open
- **WHEN** user selects a group from "File > Open Workspace Group" that is not currently open in any window
- **THEN** the system creates a new window, loads the group's active workspace, and adds the group to `lastOpenedGroupIds`

#### Scenario: Open group already open in a window
- **WHEN** user selects a group that is already open in a window
- **THEN** the system focuses the existing window instead of creating a new one

### Requirement: One window per workspace group
Each workspace group SHALL be bound to exactly one Electron window. Opening a workspace group that is already open SHALL focus the existing window rather than creating a duplicate.

#### Scenario: Attempt to open duplicate group
- **WHEN** user tries to open a group that already has an associated window
- **THEN** the system focuses the existing window

### Requirement: Restore workspace groups on launch
On app launch, the system SHALL reopen all workspace groups that were open when the app was last quit, each in its own window, using the `lastOpenedGroupIds` array.

#### Scenario: App launch with previously open groups
- **WHEN** the app launches and `lastOpenedGroupIds` contains ["group-a", "group-b"]
- **THEN** the system creates two windows, one for each group, each restored to its active workspace

#### Scenario: App launch with no previous groups
- **WHEN** the app launches and `lastOpenedGroupIds` is empty or `workspace-groups.json` does not exist
- **THEN** the system shows the welcome screen in a single window

#### Scenario: Referenced group no longer exists
- **WHEN** `lastOpenedGroupIds` references a group ID that is not in the `groups` array
- **THEN** the system skips that group silently and removes it from `lastOpenedGroupIds`

### Requirement: Window close updates group state
When a window is closed, the system SHALL save the active workspace's state, update `activeWorkspace` in the group, and remove the group from `lastOpenedGroupIds`.

#### Scenario: Close window with workspace group
- **WHEN** user closes a window bound to a workspace group
- **THEN** the system flushes the current workspace state to disk, updates the group's `activeWorkspace`, and removes the group from `lastOpenedGroupIds`

### Requirement: Window title reflects group and workspace
The window title SHALL display the group name and active workspace name in the format "{GroupName} — {WorkspaceName}".

#### Scenario: Window title format
- **WHEN** user is in group "Work" with active workspace "/Users/.../frontend-app"
- **THEN** the window title reads "Work — frontend-app"

#### Scenario: Window title updates on workspace switch
- **WHEN** user switches to workspace "backend-api" within group "Work"
- **THEN** the window title updates to "Work — backend-api"

### Requirement: Menu integration
The app menu SHALL include "File > Open Workspace Group" with a submenu listing all existing groups, a separator, and a "New Group..." option.

#### Scenario: Menu lists all groups
- **WHEN** the user opens "File > Open Workspace Group"
- **THEN** the submenu lists all group names from `workspace-groups.json` and a "New Group..." option

#### Scenario: Menu updates when groups change
- **WHEN** a group is created or removed
- **THEN** the "Open Workspace Group" submenu is rebuilt to reflect the change

### Requirement: First launch creates default group
When a user opens their first folder (from welcome screen or Cmd+O) and no groups exist, the system SHALL transparently create a workspace group named after the folder's basename containing that single workspace.

#### Scenario: First folder open creates group
- **WHEN** user opens a folder named "my-project" and no workspace groups exist
- **THEN** the system creates a group named "my-project" with that folder as its only workspace, and binds it to the current window

### Requirement: Group naming
A group with a single workspace SHALL use the workspace folder's basename as its name automatically. When the user adds a second workspace to a single-workspace group, the system SHALL prompt the user to name the group before proceeding. The group name SHALL be displayed in the sidebar header only when the group contains two or more workspaces.

#### Scenario: Single workspace group name
- **WHEN** a group has exactly 1 workspace named "my-project"
- **THEN** the group name is "my-project" and only the workspace name is shown in the sidebar header (no group label)

#### Scenario: Multi-workspace group name display
- **WHEN** a group has 2 or more workspaces and is named "Work"
- **THEN** the sidebar header shows "WORK" as a small uppercase label above the active workspace name

#### Scenario: Rename group on second workspace addition
- **WHEN** user adds a second workspace to a single-workspace group
- **THEN** the system prompts with an inline input to name the group before opening the folder picker

### Requirement: Rename workspace group
The system SHALL allow renaming a workspace group via IPC. Renaming SHALL update the group name in `workspace-groups.json`, update the window title, and rebuild the app menu.

#### Scenario: Rename group
- **WHEN** the renderer calls the rename IPC with a new name
- **THEN** the group name is updated in persistence, the window title reflects the new name, and the menu is rebuilt
