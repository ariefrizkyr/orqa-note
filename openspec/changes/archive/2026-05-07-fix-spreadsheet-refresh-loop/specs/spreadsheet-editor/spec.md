## MODIFIED Requirements

### Requirement: Dirty state tracking
The system SHALL track whether the workbook has been modified since the last save and invoke the `onChange` callback to mark the tab as dirty. The `onChange` callback SHALL be invoked only when Univer dispatches a command whose `type` is `CommandType.MUTATION`. Non-mutating commands — including selection changes, viewport scroll, focus, and other UI-only operations — SHALL NOT invoke `onChange`.

#### Scenario: Mark dirty on edit
- **WHEN** a user modifies any cell, adds/removes sheets, or changes formatting
- **THEN** the `onChange` callback SHALL be called to signal unsaved changes

#### Scenario: Selection does not mark dirty
- **WHEN** a user clicks a cell or changes the selection without modifying any value
- **THEN** the `onChange` callback SHALL NOT be invoked and the tab SHALL remain in its prior dirty state

#### Scenario: Viewport interaction does not mark dirty
- **WHEN** a user scrolls, focuses, or otherwise interacts with the viewport without modifying any cell
- **THEN** the `onChange` callback SHALL NOT be invoked

#### Scenario: Initial render does not mark dirty
- **WHEN** the spreadsheet editor mounts and Univer dispatches its initial non-mutating commands during workbook setup
- **THEN** the `onChange` callback SHALL NOT be invoked and the tab SHALL NOT be marked dirty solely from initialization
