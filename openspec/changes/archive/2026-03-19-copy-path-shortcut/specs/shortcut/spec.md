## ADDED Requirements

### Requirement: Copy path keyboard shortcut
The system SHALL register `Cmd/Ctrl+Shift+C` as a global keyboard shortcut that copies the active tab's path or URL to the system clipboard.

#### Scenario: Copy file path
- **WHEN** the active tab is a file tab with `filePath`
- **AND** user presses `Cmd/Ctrl+Shift+C`
- **THEN** the file's absolute path SHALL be written to the system clipboard
- **AND** a toast SHALL display "Path copied" at top-right for 2 seconds

#### Scenario: Copy bookmark URL
- **WHEN** the active tab is a bookmark tab with `bookmarkUrl`
- **AND** user presses `Cmd/Ctrl+Shift+C`
- **THEN** the bookmark URL SHALL be written to the system clipboard
- **AND** a toast SHALL display "URL copied" at top-right for 2 seconds

#### Scenario: No-op on new-tab
- **WHEN** the active tab is a new-tab (type `new-tab`)
- **AND** user presses `Cmd/Ctrl+Shift+C`
- **THEN** nothing SHALL happen (silent no-op, no toast)

#### Scenario: No-op when no active tab
- **WHEN** there is no active tab
- **AND** user presses `Cmd/Ctrl+Shift+C`
- **THEN** nothing SHALL happen

### Requirement: Shortcut works in all contexts
The `Cmd/Ctrl+Shift+C` shortcut SHALL work regardless of focus — including inside Monaco editors, contenteditable areas, and webviews.

#### Scenario: Inside Monaco editor
- **WHEN** user is focused inside a Monaco code editor
- **AND** user presses `Cmd/Ctrl+Shift+C`
- **THEN** the active tab's path SHALL be copied (no editor guard)
