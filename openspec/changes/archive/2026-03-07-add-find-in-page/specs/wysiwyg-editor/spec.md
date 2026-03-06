## MODIFIED Requirements

### Requirement: Editor package architecture
The editor SHALL be implemented in `packages/editor` as a standalone package (`@orqa-note/editor`) that does not depend on Electron APIs directly. File I/O and external actions are injected via props/callbacks.

#### Scenario: Import editor in desktop app
- **WHEN** the desktop app imports `@orqa-note/editor`
- **THEN** it receives a React component that accepts content and save/change/linkClick callbacks as props

#### Scenario: Programmatic find access
- **WHEN** the host app calls `editorRef.current.openFind()`
- **THEN** the find bar opens inside the editor with the search input focused
