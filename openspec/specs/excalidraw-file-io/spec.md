### Requirement: Route excalidraw files to editor
`ContentArea.tsx` SHALL route files with `.excalidraw` extension to the `ExcalidrawEditor` component.

#### Scenario: Open excalidraw file
- **WHEN** a tab with a `.excalidraw` file path is active
- **THEN** the content area SHALL render the Excalidraw editor with the file's content

### Requirement: Read excalidraw files as text
The system SHALL read `.excalidraw` files using the text-based `readFile` API (not binary).

#### Scenario: Load excalidraw file
- **WHEN** an `.excalidraw` file is opened
- **THEN** the system SHALL read the file as a text string and pass it to the editor as `initialContent`

### Requirement: Write excalidraw files as text
The system SHALL write `.excalidraw` files using the text-based `writeFile` API.

#### Scenario: Save excalidraw file
- **WHEN** the editor triggers save with JSON content
- **THEN** the system SHALL write the JSON string to disk using `writeFile`

### Requirement: Auto-save integration
The excalidraw file editor SHALL use the existing `useAutoSave` hook with the same debounce pattern as other editors.

#### Scenario: Auto-save after changes
- **WHEN** the user modifies the canvas and 2 seconds of inactivity pass
- **THEN** the file SHALL be saved automatically

### Requirement: New Canvas in context menu
The sidebar context menu SHALL include a "New Canvas" option that creates a `.excalidraw` file.

#### Scenario: Create canvas from context menu
- **WHEN** user right-clicks a folder and selects "New Canvas"
- **THEN** an inline input SHALL appear with default value "Untitled.excalidraw"
- **AND** on submit, a new `.excalidraw` file SHALL be created in that folder

### Requirement: New Canvas in New Tab screen
The New Tab screen SHALL include a "Canvas" card that creates a new `.excalidraw` file.

#### Scenario: Create canvas from new tab
- **WHEN** user clicks the "Canvas" card on the New Tab screen
- **THEN** the system SHALL prompt for a filename and create a `.excalidraw` file in the workspace root
