## ADDED Requirements

### Requirement: Excalidraw editor package
The system SHALL provide an `@orqa-note/excalidraw` package that exports an `ExcalidrawEditor` React component and an `ExcalidrawEditorHandle` type.

#### Scenario: Package exports
- **WHEN** a consumer imports from `@orqa-note/excalidraw`
- **THEN** `ExcalidrawEditor` component and `ExcalidrawEditorHandle` type SHALL be available

### Requirement: Load initial canvas data
The `ExcalidrawEditor` SHALL accept an `initialContent` prop (string, JSON) and render the Excalidraw canvas with that data.

#### Scenario: Open existing canvas
- **WHEN** `initialContent` contains valid Excalidraw JSON
- **THEN** the editor SHALL render all elements from the saved scene

#### Scenario: Open empty canvas
- **WHEN** `initialContent` is an empty string or empty JSON object
- **THEN** the editor SHALL render a blank canvas

### Requirement: Save via ref handle
The `ExcalidrawEditor` SHALL expose a `save()` method via React ref (`ExcalidrawEditorHandle`) that serializes the current scene and calls the `onSave` callback.

#### Scenario: Auto-save triggers save
- **WHEN** `save()` is called on the ref handle
- **THEN** the editor SHALL serialize current elements and appState to JSON and call `onSave(jsonString)`

### Requirement: Change detection
The `ExcalidrawEditor` SHALL call an `onChange` callback when the canvas content changes.

#### Scenario: User draws on canvas
- **WHEN** the user adds, moves, or deletes elements on the canvas
- **THEN** the `onChange` callback SHALL be called

### Requirement: Dark theme
The `ExcalidrawEditor` SHALL render in dark mode matching the app's neutral-900 background.

#### Scenario: Editor renders with dark theme
- **WHEN** the editor mounts
- **THEN** the Excalidraw canvas SHALL use the built-in dark theme via `THEME.DARK` prop

### Requirement: Export to PNG and SVG
The `ExcalidrawEditor` SHALL support exporting the canvas to PNG and SVG via Excalidraw's built-in export menu. The editor SHALL accept an `onExportImage` callback prop that receives the exported data and metadata.

#### Scenario: Export to PNG
- **WHEN** the user triggers PNG export from Excalidraw's built-in menu
- **THEN** the editor SHALL call `onExportImage` with a `Blob` of type `image/png` and the suggested filename

#### Scenario: Export to SVG
- **WHEN** the user triggers SVG export from Excalidraw's built-in menu
- **THEN** the editor SHALL call `onExportImage` with a `Blob` of type `image/svg+xml` and the suggested filename

### Requirement: Export saves to disk via Electron
The parent `ExcalidrawFileEditor` in `ContentArea.tsx` SHALL wire the `onExportImage` callback to show an Electron save dialog and write the exported file to the user-chosen path.

#### Scenario: User chooses export location
- **WHEN** `onExportImage` is called
- **THEN** the system SHALL open a save dialog with the suggested filename and appropriate file extension filter
- **AND** write the exported data to the selected path

### Requirement: Clean appState serialization
The `ExcalidrawEditor` SHALL strip transient UI state (cursor position, selected elements, collaborators) from saved JSON, keeping only persistent state (viewBackgroundColor, theme).

#### Scenario: Save excludes transient state
- **WHEN** save is triggered
- **THEN** the saved JSON SHALL NOT contain `cursorButton`, `selectedElementIds`, `collaborators`, or other transient fields
