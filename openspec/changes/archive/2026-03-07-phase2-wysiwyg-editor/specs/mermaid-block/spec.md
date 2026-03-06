## ADDED Requirements

### Requirement: Mermaid diagram block
The system SHALL render ` ```mermaid ` fenced code blocks as interactive diagram nodes in the editor via `@milkdown/plugin-diagram`, displaying Mermaid DSL as SVG inline in the document.

#### Scenario: View mode rendering
- **WHEN** a document contains a mermaid fenced code block with valid DSL code
- **THEN** the block renders the Mermaid diagram as an SVG image with an "Edit" button visible on hover

#### Scenario: Invalid Mermaid syntax
- **WHEN** a Mermaid block contains invalid DSL syntax
- **THEN** the block displays an error message instead of the SVG

#### Scenario: Empty diagram
- **WHEN** a Mermaid block has no code content
- **THEN** the block displays "Empty diagram — click to edit"

### Requirement: Mermaid edit mode
The system SHALL provide a split-pane edit mode for Mermaid blocks with a code editor on the left and live SVG preview on the right.

#### Scenario: Enter edit mode via click
- **WHEN** user clicks on the rendered Mermaid diagram
- **THEN** the block expands to show a split-pane view with code textarea on the left and live SVG preview on the right

#### Scenario: Enter edit mode via Edit button
- **WHEN** user clicks the "Edit" button on hover
- **THEN** the block expands to show the split-pane editor

#### Scenario: Live preview during editing
- **WHEN** user types in the Mermaid code editor
- **THEN** the SVG preview updates after a 300ms debounce delay

#### Scenario: Exit edit mode
- **WHEN** user presses Escape or clicks outside the editor
- **THEN** the block collapses back to view mode showing the rendered SVG

### Requirement: Mermaid markdown serialization
Mermaid blocks SHALL be serialized as fenced code blocks with the `mermaid` language identifier in the markdown file. The `@milkdown/plugin-diagram` handles parsing and serialization natively via its remark plugin.

#### Scenario: Save document with Mermaid block
- **WHEN** a document containing a Mermaid block is saved
- **THEN** the Mermaid block is serialized as a ` ```mermaid ` fenced code block in the `.md` file

#### Scenario: Load document with Mermaid fenced block
- **WHEN** a `.md` file containing a ` ```mermaid ` fenced code block is opened
- **THEN** the fenced code block is parsed into a diagram node in the editor
