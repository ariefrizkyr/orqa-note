## MODIFIED Requirements

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
