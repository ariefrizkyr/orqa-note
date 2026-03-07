## ADDED Requirements

### Requirement: Spreadsheet editor component
The system SHALL provide a `SpreadsheetEditor` React component in `packages/spreadsheet/` that wraps Univer Sheets and renders a full spreadsheet UI with cell grid, formula bar, sheet tabs, and toolbar.

#### Scenario: Render spreadsheet with data
- **WHEN** the SpreadsheetEditor receives workbook data (parsed from XLSX or CSV)
- **THEN** it SHALL render an interactive spreadsheet grid with all cell values, formatting, and formulas intact

#### Scenario: Mount and dispose lifecycle
- **WHEN** the component mounts
- **THEN** it SHALL create a Univer instance, register sheet/formula/UI plugins, and load the workbook data
- **WHEN** the component unmounts
- **THEN** it SHALL dispose the Univer instance and clean up all subscriptions

### Requirement: Cell editing
The system SHALL allow users to edit any cell by clicking on it and typing a value. Changes SHALL be reflected immediately in the grid.

#### Scenario: Edit a cell value
- **WHEN** a user clicks a cell and types a new value
- **THEN** the cell SHALL display the new value and the onChange callback SHALL be invoked

#### Scenario: Edit a formula
- **WHEN** a user enters a formula (e.g., `=SUM(A1:A10)`) in a cell
- **THEN** the cell SHALL display the computed result and the formula bar SHALL show the formula text

### Requirement: Formula support
The system SHALL support spreadsheet formulas via Univer's built-in formula engine, including arithmetic, logical, lookup, statistical, and text functions.

#### Scenario: Formula computation
- **WHEN** a cell contains a formula referencing other cells
- **THEN** the formula SHALL compute and display the result based on referenced cell values

#### Scenario: Formula recalculation on dependency change
- **WHEN** a cell referenced by a formula is modified
- **THEN** all dependent formulas SHALL recalculate automatically

### Requirement: Cell formatting
The system SHALL support basic cell formatting including bold, italic, font size, cell background color, text color, borders, and cell merge.

#### Scenario: Apply formatting
- **WHEN** a user selects cells and applies formatting (e.g., bold, background color)
- **THEN** the selected cells SHALL reflect the formatting visually

### Requirement: Multiple sheet tabs
The system SHALL support multiple sheets within a single workbook, with sheet tabs displayed at the bottom of the editor.

#### Scenario: Switch between sheets
- **WHEN** a user clicks a sheet tab
- **THEN** the grid SHALL display the contents of that sheet

#### Scenario: Add a new sheet
- **WHEN** a user adds a new sheet
- **THEN** a new empty sheet tab SHALL appear and become active

### Requirement: Dirty state tracking
The system SHALL track whether the workbook has been modified since the last save and invoke the onChange callback to mark the tab as dirty.

#### Scenario: Mark dirty on edit
- **WHEN** a user modifies any cell, adds/removes sheets, or changes formatting
- **THEN** the onChange callback SHALL be called to signal unsaved changes

### Requirement: Save callback
The system SHALL expose a save mechanism that serializes the current workbook state and invokes the onSave callback with the serialized data.

#### Scenario: Save workbook
- **WHEN** save is triggered (via auto-save or keyboard shortcut)
- **THEN** the component SHALL serialize the workbook to the appropriate format and call onSave with the result
