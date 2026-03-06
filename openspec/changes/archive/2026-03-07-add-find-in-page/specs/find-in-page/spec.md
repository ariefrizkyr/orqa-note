## ADDED Requirements

### Requirement: Text search with highlighting
The system SHALL allow users to search for text within the markdown editor. All matches SHALL be highlighted with inline decorations. The currently active match SHALL be visually distinct from other matches.

#### Scenario: Basic text search
- **WHEN** user opens the find bar and types a search term
- **THEN** all occurrences of the term in the document are highlighted, and the match count is displayed (e.g., "3 of 12")

#### Scenario: No matches found
- **WHEN** user types a search term that does not exist in the document
- **THEN** the match count displays "0 results" and no decorations are applied

#### Scenario: Active match distinction
- **WHEN** matches are found
- **THEN** the currently active match SHALL have a different highlight color than inactive matches

#### Scenario: Search updates on document change
- **WHEN** user edits the document while the find bar is open
- **THEN** matches are re-computed and decorations updated to reflect the current document content

### Requirement: Match navigation
The system SHALL allow users to navigate between matches sequentially.

#### Scenario: Navigate to next match
- **WHEN** user clicks the next button or presses Enter in the search input
- **THEN** the active match advances to the next occurrence, the editor scrolls to it, and the match counter updates

#### Scenario: Navigate to previous match
- **WHEN** user clicks the previous button or presses Shift+Enter in the search input
- **THEN** the active match moves to the previous occurrence, the editor scrolls to it, and the match counter updates

#### Scenario: Wrap around
- **WHEN** user navigates past the last match
- **THEN** navigation wraps to the first match (and vice versa for previous)

### Requirement: Replace
The system SHALL allow users to replace the currently active match with a replacement string.

#### Scenario: Replace single match
- **WHEN** user enters a replacement string and clicks "Replace"
- **THEN** the currently active match is replaced with the replacement text, and the next match becomes active

#### Scenario: Replace all matches
- **WHEN** user enters a replacement string and clicks "Replace All"
- **THEN** all matches in the document are replaced with the replacement text in a single transaction

#### Scenario: Replace preserves marks
- **WHEN** user replaces text that has inline formatting (bold, italic, links)
- **THEN** the replacement text inherits the surrounding marks from the replaced text

### Requirement: Case sensitivity toggle
The system SHALL provide a toggle to switch between case-sensitive and case-insensitive search.

#### Scenario: Case-insensitive search (default)
- **WHEN** the case sensitivity toggle is off
- **THEN** search matches text regardless of case (e.g., "Hello" matches "hello", "HELLO")

#### Scenario: Case-sensitive search
- **WHEN** the case sensitivity toggle is on
- **THEN** search matches only text with the exact same casing

### Requirement: Regex toggle
The system SHALL provide a toggle to switch between plain text and regular expression search.

#### Scenario: Plain text search (default)
- **WHEN** the regex toggle is off
- **THEN** the search term is treated as a literal string

#### Scenario: Regex search
- **WHEN** the regex toggle is on
- **THEN** the search term is treated as a regular expression pattern

#### Scenario: Invalid regex
- **WHEN** user enters an invalid regex pattern
- **THEN** no matches are highlighted and no error crashes the editor

### Requirement: Find bar keyboard shortcuts
The system SHALL provide keyboard shortcuts to open, navigate, and close the find bar.

#### Scenario: Open find bar
- **WHEN** user presses Cmd+F (or Ctrl+F) while the markdown editor is focused
- **THEN** the find bar opens with the search input focused

#### Scenario: Open find and replace
- **WHEN** user presses Cmd+H (or Ctrl+H) while the markdown editor is focused
- **THEN** the find bar opens with the replace input visible and the search input focused

#### Scenario: Close find bar
- **WHEN** user presses Escape while the find bar is open
- **THEN** the find bar closes, all search decorations are removed, and focus returns to the editor

### Requirement: Find bar UI
The find bar SHALL be rendered as a floating overlay positioned at the top-right of the editor area, without displacing document content.

#### Scenario: Find bar layout
- **WHEN** the find bar is open
- **THEN** it displays: search input, match counter, prev/next buttons, case toggle, regex toggle, and a close button

#### Scenario: Replace row visibility
- **WHEN** the find bar is opened via Cmd+F
- **THEN** the replace input row is hidden but can be expanded
- **WHEN** the find bar is opened via Cmd+H
- **THEN** the replace input row is visible with Replace and Replace All buttons
