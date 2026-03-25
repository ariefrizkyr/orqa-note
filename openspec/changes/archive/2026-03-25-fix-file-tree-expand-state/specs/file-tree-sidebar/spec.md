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

#### Scenario: Re-expand directory with previously expanded descendants
- **WHEN** user re-expands a directory that was collapsed while descendant directories were still marked as expanded in `expandedPaths`
- **THEN** the system eagerly reloads children for all expanded descendants in parallel, and all nested folders render with correct arrow direction and visible children

#### Scenario: Restore sidebar after toggle
- **WHEN** user hides the sidebar and then shows it again
- **THEN** the file tree is re-rendered with the same expanded paths and scroll position preserved in the workspace store

#### Scenario: Restore expanded paths on workspace switch
- **WHEN** user switches to a workspace that has persisted expanded paths
- **THEN** the sidebar restores the expanded folder state and reads children for each expanded directory

### Requirement: Real-time filesystem sync
The sidebar SHALL reflect external filesystem changes in real time via chokidar. When files are added, renamed, or deleted outside the app (e.g., in Finder), the sidebar updates within 500ms. When a directory is refreshed by the FS watcher, expanded subdirectories within that directory SHALL have their children reloaded to prevent arrow/content desync.

#### Scenario: File created externally
- **WHEN** a new file is created in the workspace folder via Finder or terminal
- **THEN** the sidebar adds the file node in the correct position within 500ms

#### Scenario: File deleted externally
- **WHEN** a file is deleted from the workspace folder externally
- **THEN** the sidebar removes the file node and closes any open tab for that file

#### Scenario: File deleted in nested expanded folder
- **WHEN** a file is deleted from an expanded subfolder and the FS watcher refreshes the parent directory
- **THEN** expanded subdirectories within the refreshed directory have their children reloaded, and arrow indicators remain consistent with rendered content

#### Scenario: File renamed externally
- **WHEN** a file is renamed externally
- **THEN** sidebar removes the old node and adds the renamed node; any open tab updates its label
