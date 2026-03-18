## ADDED Requirements

### Requirement: Copy action in context menu
The system SHALL include a "Copy" action in the file/folder context menu that stores the node's path and a "copy" operation type in the renderer-side clipboard state.

#### Scenario: Copy a file
- **WHEN** user right-clicks a file and selects "Copy"
- **THEN** the file's path and operation type "copy" SHALL be stored in clipboard state

#### Scenario: Copy a folder
- **WHEN** user right-clicks a folder and selects "Copy"
- **THEN** the folder's path and operation type "copy" SHALL be stored in clipboard state

#### Scenario: Copy replaces previous clipboard content
- **WHEN** user has previously copied or cut a file
- **AND** user copies a different file
- **THEN** the clipboard state SHALL contain only the new file's path

### Requirement: Cut action in context menu
The system SHALL include a "Cut" action in the file/folder context menu that stores the node's path and a "cut" operation type in the renderer-side clipboard state.

#### Scenario: Cut a file
- **WHEN** user right-clicks a file and selects "Cut"
- **THEN** the file's path and operation type "cut" SHALL be stored in clipboard state

### Requirement: Paste action in context menu
The system SHALL include a "Paste" action in the context menu when clipboard state is non-empty. Paste SHALL copy or move the source file/folder to the target directory based on the clipboard operation type.

#### Scenario: Paste a copied file into a folder
- **WHEN** user has copied a file
- **AND** user right-clicks a folder and selects "Paste"
- **THEN** the file SHALL be copied into the target folder
- **AND** the clipboard state SHALL be preserved (can paste again)

#### Scenario: Paste a cut file into a folder
- **WHEN** user has cut a file
- **AND** user right-clicks a folder and selects "Paste"
- **THEN** the file SHALL be moved into the target folder
- **AND** the clipboard state SHALL be cleared

#### Scenario: Paste into root via empty-space context menu
- **WHEN** user has copied or cut a file
- **AND** user right-clicks on empty sidebar space and selects "Paste"
- **THEN** the file SHALL be copied/moved to the workspace root directory

#### Scenario: Paste is hidden when clipboard is empty
- **WHEN** clipboard state is null (no previous copy or cut)
- **THEN** the "Paste" action SHALL NOT appear in the context menu

#### Scenario: Paste a copied folder recursively
- **WHEN** user has copied a folder containing files and subfolders
- **AND** user pastes into a target directory
- **THEN** the entire folder and its contents SHALL be recursively copied to the target

### Requirement: fs:copy IPC handler
The system SHALL provide a new `fs:copy` IPC handler that copies a file or directory to a destination folder. Both source and destination paths MUST be validated as within the workspace boundary.

#### Scenario: Copy a file via IPC
- **WHEN** `fs:copy` is called with a source file path and a destination folder path
- **THEN** the file SHALL be copied to `<destination>/<basename>`
- **AND** both paths SHALL be validated with `assertWithinWorkspace()`

#### Scenario: Copy a directory recursively via IPC
- **WHEN** `fs:copy` is called with a source directory path and a destination folder path
- **THEN** the directory and all its contents SHALL be recursively copied to `<destination>/<basename>`

#### Scenario: Copy to path outside workspace is rejected
- **WHEN** `fs:copy` is called with a destination outside the workspace boundary
- **THEN** the operation SHALL throw an error

### Requirement: Copy Path context menu action for bookmark files
The "Copy Path" context menu action SHALL detect `.orqlnk` bookmark files and copy the bookmark URL instead of the file system path. The menu label SHALL change to "Copy URL" for `.orqlnk` files.

#### Scenario: Copy URL for .orqlnk file
- **WHEN** user right-clicks an `.orqlnk` file in the sidebar and selects "Copy URL"
- **THEN** the system SHALL read the bookmark file via `readBookmark` IPC
- **AND** write the bookmark's `url` field to the system clipboard

#### Scenario: Copy URL label for .orqlnk file
- **WHEN** user right-clicks an `.orqlnk` file in the sidebar
- **THEN** the context menu SHALL display "Copy URL" instead of "Copy Path"

#### Scenario: Copy Path for regular files unchanged
- **WHEN** user right-clicks a non-`.orqlnk` file and selects "Copy Path"
- **THEN** the file's absolute path SHALL be copied to the system clipboard (existing behavior)

#### Scenario: Fallback on corrupted .orqlnk
- **WHEN** user selects "Copy URL" on an `.orqlnk` file
- **AND** the bookmark file cannot be read or parsed
- **THEN** the system SHALL fall back to copying the file system path
