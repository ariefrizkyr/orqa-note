## ADDED Requirements

### Requirement: Right-click on empty sidebar space shows context menu
The system SHALL display a context menu when the user right-clicks on any empty space within the sidebar file tree area. The context menu SHALL target the workspace root directory for all creation actions.

#### Scenario: Right-click on empty space below all nodes
- **WHEN** user right-clicks on the empty area below all file tree nodes in the sidebar
- **THEN** a context menu appears at the mouse position with creation actions (New File, New Spreadsheet, New Canvas, New Bookmark, New Folder), Paste (when clipboard has content), and utility actions (Refresh, Collapse All, Reveal in Finder)

#### Scenario: Right-click between nodes does not trigger empty-space menu
- **WHEN** user right-clicks directly on a file or folder node
- **THEN** the standard node-specific context menu appears (not the empty-space menu)

#### Scenario: Create new file from empty-space menu
- **WHEN** user selects "New File" from the empty-space context menu
- **THEN** an inline file input SHALL appear at the bottom of the root node list
- **AND** submitting the input SHALL create the file in the workspace root directory
- **AND** the new file SHALL open in a tab

### Requirement: Empty-space context menu shows Collapse All action
The system SHALL include a "Collapse All" action in the empty-space context menu that collapses all expanded folders in the tree.

#### Scenario: Collapse all folders from empty-space menu
- **WHEN** user selects "Collapse All" from the empty-space context menu
- **AND** multiple folders are expanded in the tree
- **THEN** all folders SHALL collapse and show their collapsed arrow state

### Requirement: Empty-space context menu hides node-specific actions
The system SHALL NOT show Rename, Delete, Copy, or Cut actions in the empty-space context menu, since there is no target node.

#### Scenario: Empty-space menu lacks node actions
- **WHEN** the empty-space context menu is displayed
- **THEN** the menu SHALL NOT contain Rename, Delete, Copy, or Cut options
