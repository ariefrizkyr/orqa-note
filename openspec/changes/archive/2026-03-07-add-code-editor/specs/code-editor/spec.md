## ADDED Requirements

### Requirement: Monaco-based code editing
The system SHALL provide a Monaco Editor-based code editor component (`CodeEditor`) in the `@orqa-note/code-editor` package that allows users to view and edit text files with syntax highlighting, line numbers, and language-aware formatting.

#### Scenario: Open a JSON file
- **WHEN** user opens a `.json` file from the sidebar
- **THEN** the file content is displayed in the Monaco editor with JSON syntax highlighting, line numbers, and a dark theme matching the app aesthetic

#### Scenario: Open a TypeScript file
- **WHEN** user opens a `.ts` file from the sidebar
- **THEN** the file content is displayed with TypeScript syntax highlighting and language features

#### Scenario: Open an unknown text file
- **WHEN** user opens a file with an unrecognized extension (e.g., `.conf`, `.txt`, `.log`)
- **THEN** the file content is displayed in the Monaco editor in plain text mode with line numbers

### Requirement: Language auto-detection from file path
The system SHALL use the file path (passed as Monaco model URI) to automatically detect the language for syntax highlighting. No manual language mapping is required for Monaco's built-in supported languages.

#### Scenario: Language detected from extension
- **WHEN** a file with extension `.yaml` is opened
- **THEN** Monaco applies YAML syntax highlighting automatically

#### Scenario: No language detected
- **WHEN** a file with no recognized extension is opened
- **THEN** Monaco falls back to plain text mode

### Requirement: Built-in document formatting
The system SHALL support formatting the current document using Monaco's built-in format action (`editor.action.formatDocument`).

#### Scenario: Format a JSON file
- **WHEN** user triggers format (Shift+Alt+F) on a JSON file
- **THEN** the JSON content is reformatted with proper indentation

#### Scenario: Format unavailable for language
- **WHEN** user triggers format on a file type without a built-in Monaco formatter
- **THEN** nothing happens (graceful no-op)

### Requirement: Save via imperative handle
The `CodeEditor` component SHALL expose a `save()` method via React ref that retrieves the current editor content and calls the `onSave` callback.

#### Scenario: Programmatic save
- **WHEN** the parent component calls `editorRef.current.save()`
- **THEN** the current Monaco editor content is passed to the `onSave` callback

### Requirement: Format via imperative handle
The `CodeEditor` component SHALL expose a `format()` method via React ref that triggers Monaco's built-in format action.

#### Scenario: Programmatic format
- **WHEN** the parent component calls `editorRef.current.format()`
- **THEN** Monaco's format document action is executed on the current editor content

### Requirement: Dirty state tracking via onChange
The `CodeEditor` component SHALL call the `onChange` callback whenever the editor content changes from user input.

#### Scenario: User types in editor
- **WHEN** user modifies the content in the Monaco editor
- **THEN** the `onChange` callback is invoked

### Requirement: Custom dark theme
The Monaco editor SHALL use a custom theme (`orqa-dark`) that matches the existing app's dark aesthetic, using colors derived from the app's neutral palette.

#### Scenario: Editor renders with custom theme
- **WHEN** the code editor component mounts
- **THEN** Monaco uses the `orqa-dark` theme with background `#171717`, foreground `#d4d4d4`, and matching selection/border colors

### Requirement: Default fallback viewer in ContentArea
The `ContentArea` component SHALL route files to the code editor as the default fallback for all non-markdown, non-binary file types.

#### Scenario: Routing for code files
- **WHEN** user opens a `.json`, `.ts`, `.js`, `.css`, `.yaml`, `.py`, or other code file
- **THEN** the file is displayed in the Monaco code editor

#### Scenario: Routing for unknown text files
- **WHEN** user opens a file with an unrecognized extension that is not in the binary extensions set
- **THEN** the file is displayed in the Monaco code editor in plain text mode

#### Scenario: Routing for binary files
- **WHEN** user opens a file with a known binary extension (`.pdf`, `.docx`, `.xlsx`, `.png`, `.jpg`, `.mp4`, etc.)
- **THEN** the system displays the existing "Open in Default App" UI

### Requirement: Binary extension detection
The system SHALL maintain a set of known binary file extensions and export an `isBinaryExtension()` function from `@orqa-note/code-editor` to determine whether a file should be opened in the code editor or shown with the "Open in Default App" fallback.

#### Scenario: Known binary extension
- **WHEN** `isBinaryExtension('pdf')` is called
- **THEN** it returns `true`

#### Scenario: Known text extension
- **WHEN** `isBinaryExtension('json')` is called
- **THEN** it returns `false`

#### Scenario: Unknown extension
- **WHEN** `isBinaryExtension('xyz')` is called
- **THEN** it returns `false` (assume text, let Monaco handle it)

### Requirement: Remove file dimming in sidebar
The sidebar file tree SHALL render all files at full opacity regardless of extension. The `isSupported()` function and `SUPPORTED_EXTENSIONS` set SHALL be removed from `file-utils.ts`.

#### Scenario: Previously unsupported file in sidebar
- **WHEN** a `.json` file is displayed in the file tree
- **THEN** it renders at full opacity (no dimming)

#### Scenario: Binary file in sidebar
- **WHEN** a `.pdf` file is displayed in the file tree
- **THEN** it renders at full opacity (no dimming) — clicking it opens the code editor or "Open in Default App" based on binary detection
