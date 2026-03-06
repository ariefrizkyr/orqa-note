## ADDED Requirements

### Requirement: Slash command menu
The system SHALL provide a slash command menu in the WYSIWYG editor that appears when the user types `/` in a paragraph, allowing insertion of block types.

#### Scenario: Open slash menu
- **WHEN** user types `/` in the editor
- **THEN** a command palette appears with available block types

#### Scenario: Filter commands
- **WHEN** user types additional characters after `/` (e.g., `/mer`)
- **THEN** the command list filters to show only matching items

#### Scenario: Insert block via slash command
- **WHEN** user selects a command from the slash menu (click or Enter)
- **THEN** the corresponding block is inserted at the cursor position, the slash trigger text is removed, and the slash menu closes

#### Scenario: Keyboard navigation
- **WHEN** the slash menu is visible
- **THEN** user can navigate with Arrow Up/Down, select with Enter, and dismiss with Escape

### Requirement: Available slash commands
The slash menu SHALL include the following commands: Heading 1, Heading 2, Heading 3, Bullet List, Ordered List, Code Block, Table, Blockquote, Horizontal Rule, and Mermaid Diagram.

#### Scenario: Heading commands
- **WHEN** user selects `/heading1`, `/heading2`, or `/heading3` from the slash menu
- **THEN** the current paragraph converts to the corresponding heading level

#### Scenario: Mermaid command
- **WHEN** user selects `/mermaid` from the slash menu
- **THEN** a new Mermaid diagram block is inserted with empty code

#### Scenario: Table command
- **WHEN** user selects `/table` from the slash menu
- **THEN** a new editable table block is inserted

#### Scenario: Code command
- **WHEN** user selects `/code` from the slash menu
- **THEN** a new code block is inserted

#### Scenario: Divider command
- **WHEN** user selects `/divider` from the slash menu
- **THEN** a horizontal rule is inserted
