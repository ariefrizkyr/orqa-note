## MODIFIED Requirements

### Requirement: File tab content routing
The ContentArea SHALL route file tabs to the appropriate editor based on file extension. `.xlsx` and `.csv` files SHALL open in the spreadsheet editor.

#### Scenario: Open XLSX file in spreadsheet editor
- **WHEN** a tab with a `.xlsx` file becomes active
- **THEN** ContentArea SHALL render the SpreadsheetFileEditor component for that file

#### Scenario: Open CSV file in spreadsheet editor
- **WHEN** a tab with a `.csv` file becomes active
- **THEN** ContentArea SHALL render the SpreadsheetFileEditor component for that file

#### Scenario: XLSX not treated as binary
- **WHEN** a `.xlsx` file is opened
- **THEN** it SHALL NOT fall through to the binary file "Preview not available" screen
