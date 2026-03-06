## MODIFIED Requirements

### Requirement: Debounced auto-save
The system SHALL automatically save the active document 2 seconds after the user stops typing, if the document has unsaved changes. The system SHALL also save when the window loses focus or the tab becomes hidden. The `useAutoSave` hook SHALL be sourced from `@orqa-note/shared` instead of being defined locally in `@orqa-note/editor`.

#### Scenario: Auto-save after typing stops
- **WHEN** user has made edits and 2 seconds have elapsed since the last edit
- **THEN** the system serializes the editor content and writes it to the file on disk

#### Scenario: Auto-save on window blur
- **WHEN** user switches to another application while the document has unsaved changes
- **THEN** the system saves immediately

#### Scenario: Auto-save on visibility hide
- **WHEN** the browser tab becomes hidden (e.g., user switches OS windows) while the document has unsaved changes
- **THEN** the system saves immediately

#### Scenario: No save when clean
- **WHEN** the document has no unsaved changes and the debounce timer fires
- **THEN** no file write occurs

#### Scenario: Auto-save works for code editor
- **WHEN** user edits a file in the Monaco code editor and 2 seconds elapse since the last edit
- **THEN** the system saves the file content to disk using the same auto-save mechanism as the markdown editor
