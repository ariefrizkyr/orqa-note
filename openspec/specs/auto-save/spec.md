## ADDED Requirements

### Requirement: Debounced auto-save
The system SHALL automatically save the active document 2 seconds after the user stops typing, if the document has unsaved changes. The system SHALL also save when the window loses focus or the tab becomes hidden.

#### Scenario: Auto-save after typing stops
- **WHEN** user has made edits and 2 seconds have elapsed since the last edit
- **THEN** the system serializes the editor content to markdown and writes it to the file on disk

#### Scenario: Auto-save on window blur
- **WHEN** user switches to another application while the document has unsaved changes
- **THEN** the system saves immediately

#### Scenario: Auto-save on visibility hide
- **WHEN** the browser tab becomes hidden (e.g., user switches OS windows) while the document has unsaved changes
- **THEN** the system saves immediately

#### Scenario: No save when clean
- **WHEN** the document has no unsaved changes and the debounce timer fires
- **THEN** no file write occurs

### Requirement: Save on tab switch
The system SHALL automatically save the active document when the user switches to a different tab.

#### Scenario: Switch tab with unsaved changes
- **WHEN** user switches to a different tab while the current document has unsaved changes
- **THEN** the system saves the current document before switching

### Requirement: Dirty state indicator
The system SHALL display a visual indicator on the tab when a document has unsaved changes.

#### Scenario: Document becomes dirty
- **WHEN** user makes an edit to the document
- **THEN** the tab displays a dirty indicator (dot) next to the file name

#### Scenario: Document saved
- **WHEN** the document is saved (auto or manual)
- **THEN** the dirty indicator is removed from the tab

### Requirement: Save status display
The system SHALL display a save status message in the editor area.

#### Scenario: After successful save
- **WHEN** auto-save completes successfully
- **THEN** the editor briefly displays "Auto-saved" with a checkmark, fading after 2 seconds

### Requirement: External change conflict handling
The system SHALL detect when a file is modified externally while it has unsaved editor changes.

#### Scenario: External modification while dirty
- **WHEN** chokidar detects a file change for a document that has unsaved editor changes
- **THEN** the system displays a conflict dialog: "File changed externally. Reload or keep your version?"

#### Scenario: External modification while clean
- **WHEN** chokidar detects a file change for a document with no unsaved changes
- **THEN** the system reloads the file content into the editor automatically
