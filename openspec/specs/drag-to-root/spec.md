## ADDED Requirements

### Requirement: Drop file on empty sidebar space moves to root
The system SHALL accept file and folder drops on the empty sidebar space and move the dropped item to the workspace root directory.

#### Scenario: Drag file from subfolder to empty space
- **WHEN** user drags a file from inside a subfolder and drops it on the empty sidebar space
- **THEN** the file SHALL be moved to the workspace root directory
- **AND** the file tree SHALL update to reflect the new location

#### Scenario: Drag folder to empty space
- **WHEN** user drags a folder from inside another folder and drops it on the empty sidebar space
- **THEN** the folder (and all its contents) SHALL be moved to the workspace root directory

#### Scenario: Drop on folder still targets that folder
- **WHEN** user drags a file and drops it on a folder node (not empty space)
- **THEN** the file SHALL be moved into that folder (existing behavior preserved)
- **AND** the drop event SHALL NOT bubble to the container drop handler

#### Scenario: Drag root-level file to empty space is no-op
- **WHEN** user drags a file that is already in the workspace root and drops it on empty space
- **THEN** no move operation SHALL be performed (the file is already at root)

### Requirement: Visual feedback when dragging over empty sidebar space
The system SHALL provide subtle visual feedback when a dragged item is hovering over the empty sidebar space.

#### Scenario: Drag over empty space shows highlight
- **WHEN** user is dragging a file and hovers over the empty sidebar space
- **THEN** the file tree container SHALL display a subtle background highlight

#### Scenario: Drag leaves empty space removes highlight
- **WHEN** user drags a file away from the empty sidebar space
- **THEN** the background highlight SHALL be removed
