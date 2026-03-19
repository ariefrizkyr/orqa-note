## ADDED Requirements

### Requirement: Persist expanded paths per workspace
The system SHALL persist the `expandedPaths` set for each workspace to `workspace-state.json` as a JSON array of absolute path strings, alongside existing tab state.

#### Scenario: Save expanded paths on workspace switch
- **WHEN** user switches from workspace A to workspace B within a group
- **THEN** workspace A's current `expandedPaths` set is serialized as an array and saved to its `workspace-state.json`

#### Scenario: Save expanded paths on app quit
- **WHEN** the app quits with expanded folders in the sidebar
- **THEN** the current `expandedPaths` set is saved to the active workspace's `workspace-state.json`

#### Scenario: Restore expanded paths on workspace activation
- **WHEN** user switches to a workspace that has persisted expanded paths
- **THEN** the system restores `expandedPaths` from the saved array, converting it back to a Set, and the sidebar displays the previously expanded folders

#### Scenario: Expanded path references deleted folder
- **WHEN** a restored expanded path references a folder that no longer exists on disk
- **THEN** the system silently ignores that path (it won't appear in the tree since the folder doesn't exist)

#### Scenario: No persisted expanded paths
- **WHEN** a workspace has no `expandedPaths` in its state file (e.g., first open or old format)
- **THEN** the system starts with all folders collapsed (empty Set)

### Requirement: Include expanded paths in debounced save
The debounced workspace state save SHALL include `expandedPaths` alongside tabs and other state, so that expand/collapse actions are persisted within the normal save cycle.

#### Scenario: Expand a folder triggers debounced save
- **WHEN** user expands a folder in the sidebar
- **THEN** the updated `expandedPaths` is included in the next debounced save (within 1 second)
