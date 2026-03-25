## ADDED Requirements

### Requirement: Debounced auto-save
The system SHALL automatically save the active document 2 seconds after the user stops typing, if the document has unsaved changes. The system SHALL also save when the window loses focus or the tab becomes hidden. The system SHALL skip the write if the editor's serialized content matches the content baseline (no real user changes). The `useAutoSave` hook SHALL be sourced from `@orqa-note/shared` instead of being defined locally in `@orqa-note/editor`.

#### Scenario: Auto-save after typing stops
- **WHEN** user has made edits and 2 seconds have elapsed since the last edit
- **THEN** the system serializes the editor content and writes it to the file on disk

#### Scenario: Auto-save on window blur
- **WHEN** user switches to another application while the document has unsaved changes
- **THEN** the system saves immediately

#### Scenario: Auto-save on visibility hide
- **WHEN** the browser tab becomes hidden (e.g., user switches OS windows) while the document has unsaved changes
- **THEN** the system saves immediately

#### Scenario: Auto-save skips when content matches baseline
- **WHEN** the auto-save timer fires or blur/hide triggers a save
- **AND** the editor's serialized content is identical to the content baseline
- **THEN** no file write occurs and the dirty flag is cleared

#### Scenario: No save when clean
- **WHEN** the document has no unsaved changes and the debounce timer fires
- **THEN** no file write occurs

#### Scenario: Auto-save works for code editor
- **WHEN** user edits a file in the Monaco code editor and 2 seconds elapse since the last edit
- **THEN** the system saves the file content to disk using the same auto-save mechanism as the markdown editor

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
The system SHALL detect when a file is modified externally and always reload the file content into the editor, treating disk as the source of truth regardless of the editor's dirty state.

#### Scenario: External modification while clean
- **WHEN** chokidar detects a file change for a document with no unsaved changes
- **THEN** the system reloads the file content into the editor automatically

#### Scenario: External modification while dirty
- **WHEN** chokidar detects a file change for a document that has unsaved editor changes
- **THEN** the system reloads the file content into the editor automatically (disk wins)

#### Scenario: Self-written change ignored
- **WHEN** chokidar detects a file change caused by the editor's own save operation
- **THEN** the system ignores the event (no reload)
