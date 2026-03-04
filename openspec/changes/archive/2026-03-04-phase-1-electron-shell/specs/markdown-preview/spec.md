## ADDED Requirements

### Requirement: Read-only markdown preview
Opening a `.md` file SHALL render the file contents as formatted HTML using GitHub Flavored Markdown (GFM). The preview is read-only in Phase 1.

#### Scenario: Open markdown file
- **WHEN** user opens a `.md` file from the sidebar
- **THEN** system reads the file content via IPC and renders it as formatted HTML with GFM support (tables, task lists, strikethrough, fenced code blocks)

#### Scenario: Syntax-highlighted code blocks
- **WHEN** the markdown file contains a fenced code block with a language identifier
- **THEN** system renders the code block with syntax highlighting

#### Scenario: Scroll position persistence
- **WHEN** user scrolls a markdown preview, switches to another tab, then switches back
- **THEN** the markdown tab restores to the previous scroll position

#### Scenario: External file change
- **WHEN** the `.md` file is modified externally while open in a tab
- **THEN** system detects the change via chokidar and refreshes the preview with updated content
