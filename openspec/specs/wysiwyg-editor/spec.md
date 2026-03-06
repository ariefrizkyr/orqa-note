## ADDED Requirements

### Requirement: WYSIWYG markdown editing
The system SHALL provide a Milkdown-based WYSIWYG editor for `.md` files that renders formatting inline (bold, italic, headings, etc.) using remark for markdown parsing and ProseMirror for editing.

#### Scenario: Open markdown file for editing
- **WHEN** user opens a `.md` file from the sidebar
- **THEN** system reads the file content, sets the markdown body as the editor's default value (remark parses natively), and renders the WYSIWYG editor

#### Scenario: Edit text formatting
- **WHEN** user selects text and applies formatting (bold, italic, underline, strikethrough, inline code)
- **THEN** the formatting is applied visually inline and stored in the editor state

### Requirement: Heading support
The system SHALL support heading levels H1 through H6 in the editor.

#### Scenario: Create heading via keyboard
- **WHEN** user types `#`, `##`, or `###` followed by a space at the start of a line
- **THEN** the line converts to the corresponding heading level

#### Scenario: Create heading via shortcut
- **WHEN** user presses Cmd+Shift+1 through Cmd+Shift+6
- **THEN** the current block converts to the corresponding heading level (H1–H6)

### Requirement: List support
The system SHALL support unordered lists, ordered lists, and task lists with checkbox state.

#### Scenario: Create unordered list
- **WHEN** user types `-` or `*` followed by a space at the start of a line
- **THEN** the line converts to an unordered list item

#### Scenario: Create task list
- **WHEN** user types `[]` or `[ ]` followed by a space at the start of a line
- **THEN** the line converts to a task list item with an interactive checkbox

#### Scenario: Toggle task completion
- **WHEN** user clicks a task list checkbox
- **THEN** the checkbox toggles between checked and unchecked states

### Requirement: Blockquote support
The system SHALL support blockquote blocks.

#### Scenario: Create blockquote
- **WHEN** user types `>` followed by a space at the start of a line
- **THEN** the line converts to a blockquote block with visual indentation

### Requirement: Inline hyperlinks
The system SHALL support inline hyperlinks that are clickable in the editor.

#### Scenario: Open link in external browser
- **WHEN** user Cmd/Ctrl+Clicks on a hyperlink in the editor
- **THEN** the URL is opened in the system's external browser via a callback prop

### Requirement: Code block support
The system SHALL support fenced code blocks rendered with monospace font.

#### Scenario: Create code block
- **WHEN** user inserts a code block (via slash command or typing triple backticks)
- **THEN** the editor renders a code block with monospace font

### Requirement: Table block support
The system SHALL support editable GFM table blocks inline in the document.

#### Scenario: Insert table
- **WHEN** user inserts a table block
- **THEN** an editable grid appears inline where user can click cells to edit content

#### Scenario: Shift+Enter in table cell
- **WHEN** user presses Shift+Enter inside a table cell
- **THEN** a hard break (newline) is inserted within the cell instead of exiting the table

### Requirement: Markdown round-trip preservation
The system SHALL serialize editor content back to standard markdown format on save via Milkdown's remark-based serializer, preserving the structure and formatting of the document.

#### Scenario: Save edited document
- **WHEN** user's document is saved (auto or manual)
- **THEN** the editor content is serialized to markdown via `serializerCtx` and written to the `.md` file on disk

#### Scenario: Frontmatter preservation
- **WHEN** user opens a `.md` file containing YAML frontmatter (`---` delimited block at top)
- **THEN** the frontmatter is extracted before loading, stored separately, and re-prepended to the file on save without being displayed in or modified by the editor

### Requirement: Editor package architecture
The editor SHALL be implemented in `packages/editor` as a standalone package (`@orqa-note/editor`) that does not depend on Electron APIs directly. File I/O and external actions are injected via props/callbacks.

#### Scenario: Import editor in desktop app
- **WHEN** the desktop app imports `@orqa-note/editor`
- **THEN** it receives a React component that accepts content and save/change/linkClick callbacks as props

#### Scenario: Programmatic find access
- **WHEN** the host app calls `editorRef.current.openFind()`
- **THEN** the find bar opens inside the editor with the search input focused

### Requirement: Google Docs-style keyboard shortcuts
The editor SHALL support Google Docs-style keyboard shortcuts for common formatting actions.

#### Scenario: List shortcuts
- **WHEN** user presses Cmd+Shift+8
- **THEN** the current block converts to a bullet list
- **WHEN** user presses Cmd+Shift+7
- **THEN** the current block converts to an ordered list

#### Scenario: Blockquote shortcut
- **WHEN** user presses Cmd+Shift+9
- **THEN** the current block converts to a blockquote

#### Scenario: Code block shortcut
- **WHEN** user presses Cmd+Shift+C
- **THEN** a code block is inserted
