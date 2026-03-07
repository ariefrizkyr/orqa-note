## ADDED Requirements

### Requirement: XLSX file reading
The system SHALL read `.xlsx` files as binary data via the existing `fs:readBinaryFile` IPC channel and deserialize them into Univer workbook data using `@zwight/luckyexcel`.

#### Scenario: Open an XLSX file
- **WHEN** a user opens a `.xlsx` file from the file tree
- **THEN** the system SHALL read the binary data, convert it to Univer workbook format, and display it in the spreadsheet editor with all formulas, formatting, and sheets preserved

### Requirement: XLSX file writing
The system SHALL serialize Univer workbook data to XLSX binary format and write it via a new `fs:writeBinaryFile` IPC channel.

#### Scenario: Save an XLSX file
- **WHEN** auto-save triggers or user saves manually
- **THEN** the system SHALL serialize the workbook to XLSX bytes and write the binary data to disk at the original file path

### Requirement: Binary file write IPC channel
The system SHALL provide an `fs:writeBinaryFile` IPC handler in the main process that accepts a file path and binary data (Uint8Array) and writes it to disk.

#### Scenario: Write binary data to file
- **WHEN** the renderer invokes `fs:writeBinaryFile(filePath, data)`
- **THEN** the main process SHALL write the binary data to the specified path within the workspace boundary

#### Scenario: Reject writes outside workspace
- **WHEN** the renderer invokes `fs:writeBinaryFile` with a path outside the workspace
- **THEN** the main process SHALL throw an error and not write the file

### Requirement: CSV file reading
The system SHALL read `.csv` files as text via the existing `fs:readFile` IPC channel and parse them into Univer workbook data using PapaParse.

#### Scenario: Open a CSV file
- **WHEN** a user opens a `.csv` file from the file tree
- **THEN** the system SHALL parse the CSV text, convert it to a single-sheet Univer workbook (treating the first row as headers), and display it in the spreadsheet editor

### Requirement: CSV file writing
The system SHALL serialize the active sheet's data from the Univer workbook back to CSV text using PapaParse and write it via the existing `fs:writeFile` IPC channel.

#### Scenario: Save a CSV file
- **WHEN** auto-save triggers or user saves manually on a CSV file
- **THEN** the system SHALL serialize the active sheet to CSV text (computed formula values, no formatting) and write it to disk

#### Scenario: Formula values in CSV
- **WHEN** a CSV file contains cells with formulas
- **THEN** on save, the system SHALL write the computed values (not the formula text) to the CSV file

### Requirement: Auto-save integration
The system SHALL integrate with the existing `useAutoSave` hook to automatically save spreadsheet changes after a debounce period.

#### Scenario: Auto-save after edit
- **WHEN** a user edits a cell and stops editing for the debounce period (2000ms)
- **THEN** the system SHALL auto-save the file in its original format (XLSX or CSV)
