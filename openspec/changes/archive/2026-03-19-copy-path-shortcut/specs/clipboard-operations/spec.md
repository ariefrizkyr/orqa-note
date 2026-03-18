## MODIFIED Requirements

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
