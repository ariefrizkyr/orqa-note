## ADDED Requirements

### Requirement: Sidebar mirrors filesystem
The sidebar file tree SHALL be a 1:1 reflection of the workspace folder on disk. Creating, renaming, moving, or deleting files/folders in the sidebar MUST perform the corresponding filesystem operation on disk. When the sidebar is hidden, the file tree component SHALL NOT be rendered but the workspace state (expanded paths, root nodes) SHALL be preserved.

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

### Requirement: Real-time filesystem sync
The sidebar SHALL reflect external filesystem changes in real time via chokidar. When files are added, renamed, or deleted outside the app (e.g., in Finder), the sidebar updates within 500ms.

#### Scenario: File created externally
- **WHEN** a new file is created in the workspace folder via Finder or terminal
- **THEN** the sidebar adds the file node in the correct position within 500ms

#### Scenario: File deleted externally
- **WHEN** a file is deleted from the workspace folder externally
- **THEN** the sidebar removes the file node and closes any open tab for that file

#### Scenario: File renamed externally
- **WHEN** a file is renamed externally
- **THEN** sidebar removes the old node and adds the renamed node; any open tab updates its label

### Requirement: File type icons
Each file in the sidebar SHALL display a type-specific icon based on its extension. Supported extensions: `.md`, `.orqa`, `.csv`, `.xlsx`, `.pdf`, `.docx`, `.mmd`, `.excalidraw`, `.drawio`. Unsupported extensions SHALL show a generic file icon and appear greyed out.

#### Scenario: Supported file icon
- **WHEN** sidebar renders a `.md` file
- **THEN** the file node displays the Markdown icon with full opacity

#### Scenario: Unsupported file
- **WHEN** sidebar renders a `.zip` file
- **THEN** the file node displays a generic file icon at reduced opacity (greyed out)

#### Scenario: Open unsupported file
- **WHEN** user double-clicks an unsupported file in the sidebar
- **THEN** system opens the file in the macOS default application via `shell.openPath`

### Requirement: Sidebar context menu
Right-clicking a file or folder in the sidebar SHALL display a native context menu with actions: New File, New Folder, Rename, Delete, Reveal in Finder, Copy Path.

#### Scenario: Create new file
- **WHEN** user selects "New File" from context menu
- **THEN** system prompts for a filename, creates the file on disk in the right-clicked directory, and adds it to the sidebar

#### Scenario: Delete file
- **WHEN** user selects "Delete" from context menu
- **THEN** system shows a confirmation dialog and, if confirmed, moves the item to Trash via `shell.trashItem`

#### Scenario: Rename file
- **WHEN** user selects "Rename" from context menu
- **THEN** the file name becomes an inline editable text field; pressing Enter renames the file on disk

#### Scenario: Reveal in Finder
- **WHEN** user selects "Reveal in Finder" from context menu
- **THEN** system opens Finder with the item selected via `shell.showItemInFolder`

### Requirement: Drag and drop reorder
Users SHALL be able to drag files and folders within the sidebar to move them to different directories. Moving an item in the sidebar MUST move the file on disk.

#### Scenario: Move file to folder
- **WHEN** user drags a file onto a folder in the sidebar
- **THEN** system moves the file on disk into that folder and updates the sidebar tree

#### Scenario: Invalid drop target
- **WHEN** user drags a folder onto one of its own descendants
- **THEN** system rejects the drop and shows no change
