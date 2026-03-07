## MODIFIED Requirements

### Requirement: Create new file from context menu
The file tree context menu SHALL include a "New Spreadsheet" option that creates a blank `.xlsx` file in the selected directory.

#### Scenario: Create new spreadsheet
- **WHEN** a user right-clicks a directory in the file tree and selects "New Spreadsheet"
- **THEN** the system SHALL create a new blank `.xlsx` file with a default name (e.g., `Untitled.xlsx`) in that directory and open it in a new tab

#### Scenario: Name the new spreadsheet
- **WHEN** the "New Spreadsheet" option is selected
- **THEN** the system SHALL show an inline input field (matching existing "New File" behavior) for the user to enter a file name, defaulting to `.xlsx` extension
