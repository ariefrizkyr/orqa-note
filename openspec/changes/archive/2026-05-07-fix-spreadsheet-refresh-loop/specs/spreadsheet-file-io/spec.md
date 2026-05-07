## ADDED Requirements

### Requirement: Self-write registration on spreadsheet save
The spreadsheet save path SHALL register the target file path as self-written before invoking the disk write IPC, so the FS watcher's external-change handler does not misclassify the resulting `change` event as an external modification and remount the editor.

#### Scenario: Self-write registered before CSV write
- **WHEN** the spreadsheet save handler is invoked for a `.csv` file
- **THEN** the system SHALL call `markSelfWritten(filePath)` immediately before `fs:writeFile` is invoked

#### Scenario: Self-write registered before XLSX write
- **WHEN** the spreadsheet save handler is invoked for a `.xlsx` file
- **THEN** the system SHALL call `markSelfWritten(filePath)` immediately before `fs:writeBinaryFile` is invoked

#### Scenario: Watcher ignores the editor's own save
- **WHEN** the FS watcher receives a `change` event for a path registered as self-written
- **THEN** the system SHALL NOT increment the tab's `contentVersion` and SHALL NOT remount the spreadsheet editor

#### Scenario: External edit still triggers a reload
- **WHEN** an external process modifies an open spreadsheet file (no self-write cookie present)
- **THEN** the system SHALL increment the tab's `contentVersion` and remount the editor with the on-disk content
