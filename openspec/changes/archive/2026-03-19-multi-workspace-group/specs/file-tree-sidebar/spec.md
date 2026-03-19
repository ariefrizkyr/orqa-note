## MODIFIED Requirements

### Requirement: Sidebar mirrors filesystem
The sidebar file tree SHALL be a 1:1 reflection of the workspace folder on disk. Creating, renaming, moving, or deleting files/folders in the sidebar MUST perform the corresponding filesystem operation on disk. When the sidebar is hidden, the file tree component SHALL NOT be rendered but the workspace state (expanded paths, root nodes) SHALL be preserved. Expanded paths SHALL be persisted to disk and restored on workspace activation.

#### Scenario: Initial folder load
- **WHEN** user opens a workspace folder
- **THEN** sidebar displays the root folder's direct children (files and directories) sorted alphabetically with directories first

#### Scenario: Expand directory
- **WHEN** user clicks the expand chevron on a directory node
- **THEN** system reads that directory's children via IPC and displays them nested under the parent

#### Scenario: Collapse directory
- **WHEN** user clicks the collapse chevron on an expanded directory
- **THEN** children are hidden and the filesystem watcher for that subtree is removed

#### Scenario: Restore sidebar after toggle
- **WHEN** user hides the sidebar and then shows it again
- **THEN** the file tree is re-rendered with the same expanded paths and scroll position preserved in the workspace store

#### Scenario: Restore expanded paths on workspace switch
- **WHEN** user switches to a workspace that has persisted expanded paths
- **THEN** the sidebar restores the expanded folder state and reads children for each expanded directory
