## ADDED Requirements

### Requirement: Sidebar visibility toggle
The system SHALL allow the user to toggle the sidebar between visible and hidden states. When hidden, the sidebar and its resize handle SHALL NOT be rendered, and the content area SHALL expand to fill the full width.

#### Scenario: Hide sidebar via keyboard shortcut
- **WHEN** user presses Cmd+B (macOS) or Ctrl+B (Windows/Linux) while sidebar is visible
- **THEN** the sidebar and resize handle are removed from the layout and the content area expands to full width

#### Scenario: Show sidebar via keyboard shortcut
- **WHEN** user presses Cmd+B (macOS) or Ctrl+B (Windows/Linux) while sidebar is hidden
- **THEN** the sidebar is rendered at its previously saved width and the content area adjusts accordingly

#### Scenario: Sidebar toggle does not conflict with editor formatting
- **WHEN** user presses Cmd+B while focus is inside a text editor content area (e.g., WYSIWYG or code editor)
- **THEN** the shortcut SHALL be handled by the editor (bold formatting) and NOT toggle the sidebar

### Requirement: Sidebar visibility persistence
The sidebar visibility state SHALL be persisted per workspace. When the user reopens a workspace, the sidebar visibility SHALL be restored to its last saved state.

#### Scenario: Save and restore hidden sidebar
- **WHEN** user hides the sidebar and closes the workspace
- **AND** user reopens the same workspace
- **THEN** the sidebar remains hidden

#### Scenario: Save and restore visible sidebar
- **WHEN** user leaves the sidebar visible and closes the workspace
- **AND** user reopens the same workspace
- **THEN** the sidebar is visible at its previously saved width

#### Scenario: Default visibility for new workspace
- **WHEN** user opens a workspace that has no saved state
- **THEN** the sidebar SHALL be visible by default
