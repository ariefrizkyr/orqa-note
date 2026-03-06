## MODIFIED Requirements

### Requirement: Default fallback viewer in ContentArea
The `ContentArea` component SHALL route `.pdf` files to the `PdfViewer` component from `@orqa-note/pdf-viewer`. All other binary files continue to show the "Open in Default App" UI. The routing order SHALL be: markdown → PDF → bookmark → binary → code editor (fallback).

#### Scenario: Routing for PDF files
- **WHEN** user opens a `.pdf` file from the sidebar
- **THEN** the file is displayed in the PdfViewer component with toolbar and zoom controls

#### Scenario: Routing for other binary files
- **WHEN** user opens a `.docx`, `.xlsx`, `.png`, or other binary file
- **THEN** the system displays the existing "Open in Default App" UI

#### Scenario: Routing for code files
- **WHEN** user opens a `.json`, `.ts`, `.js`, `.css`, `.yaml`, `.py`, or other code file
- **THEN** the file is displayed in the Monaco code editor

### Requirement: Binary extension detection
The system SHALL maintain a set of known binary file extensions and export an `isBinaryExtension()` function from `@orqa-note/code-editor`. The `pdf` extension SHALL be removed from the binary extensions set since it is now handled by the PDF viewer.

#### Scenario: PDF extension check
- **WHEN** `isBinaryExtension('pdf')` is called
- **THEN** it returns `false`

#### Scenario: Known binary extension
- **WHEN** `isBinaryExtension('docx')` is called
- **THEN** it returns `true`
