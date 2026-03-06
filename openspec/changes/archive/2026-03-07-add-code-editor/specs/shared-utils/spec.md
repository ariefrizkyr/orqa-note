## ADDED Requirements

### Requirement: Shared useAutoSave hook package
The system SHALL provide a `@orqa-note/shared` package that exports the `useAutoSave` hook for reuse across editor packages (`@orqa-note/editor` and `@orqa-note/code-editor`).

#### Scenario: Import from shared package
- **WHEN** `@orqa-note/editor` or `@orqa-note/code-editor` needs auto-save functionality
- **THEN** they import `useAutoSave` from `@orqa-note/shared`

### Requirement: Backward-compatible re-export from editor
The `@orqa-note/editor` package SHALL continue to re-export `useAutoSave` from its public API (sourced from `@orqa-note/shared`) so that existing consumers (`ContentArea.tsx`) do not break.

#### Scenario: Existing import still works
- **WHEN** `ContentArea.tsx` imports `useAutoSave` from `@orqa-note/editor`
- **THEN** the import resolves successfully (re-exported from `@orqa-note/shared`)
