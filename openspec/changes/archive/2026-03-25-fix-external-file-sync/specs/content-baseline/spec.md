## ADDED Requirements

### Requirement: Baseline capture after editor initialization
The system SHALL capture a content baseline — the editor's own serialized output — after the editor mounts with loaded file content. This baseline represents "what the editor thinks disk contains" and is used to detect real user changes vs serialization noise.

#### Scenario: Baseline set after markdown editor loads
- **WHEN** a markdown file is loaded and the Milkdown editor finishes initializing
- **THEN** the system captures the editor's serialized markdown output as the baseline

#### Scenario: Baseline set after code editor loads
- **WHEN** a code file is loaded and the Monaco editor finishes initializing
- **THEN** the system captures the editor's getValue() output as the baseline

#### Scenario: Baseline set after excalidraw editor loads
- **WHEN** an excalidraw file is loaded and the Excalidraw editor API becomes available
- **THEN** the system captures the editor's serialized JSON output as the baseline

### Requirement: Baseline update after save
The system SHALL update the content baseline after each successful save, setting it to the content that was written to disk.

#### Scenario: Baseline updated on auto-save
- **WHEN** auto-save writes editor content to disk successfully
- **THEN** the baseline is updated to match the saved content

#### Scenario: Baseline updated on manual save
- **WHEN** the user triggers a manual save (Cmd/Ctrl+S)
- **THEN** the baseline is updated to match the saved content

### Requirement: Baseline update after external reload
The system SHALL update the content baseline after reloading a file due to an external change, using the editor's serialized output after re-initialization.

#### Scenario: Baseline reset on external file change reload
- **WHEN** an external file change is detected and the editor reloads the file
- **THEN** the baseline is updated to the editor's serialized output after re-initialization

### Requirement: Editor exposes content serialization
Each editor type SHALL expose a `getContent(): string` method on its imperative handle, returning the current serialized content without triggering a save.

#### Scenario: Markdown editor getContent
- **WHEN** `getContent()` is called on the markdown editor handle
- **THEN** it returns the full serialized markdown (including frontmatter) without writing to disk

#### Scenario: Code editor getContent
- **WHEN** `getContent()` is called on the code editor handle
- **THEN** it returns the current editor text value without writing to disk

#### Scenario: Excalidraw editor getContent
- **WHEN** `getContent()` is called on the excalidraw editor handle
- **THEN** it returns the serialized JSON scene data without writing to disk
