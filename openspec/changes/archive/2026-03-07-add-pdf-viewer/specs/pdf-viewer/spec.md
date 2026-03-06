## ADDED Requirements

### Requirement: PDF rendering with continuous scroll
The system SHALL render PDF files as a continuous vertically-scrollable list of pages using `react-pdf`. All pages SHALL be rendered in order within a single scrollable container.

#### Scenario: Open a single-page PDF
- **WHEN** user opens a 1-page PDF file from the sidebar
- **THEN** the PDF page is rendered in the content area with the page fully visible

#### Scenario: Open a multi-page PDF
- **WHEN** user opens a 12-page PDF file from the sidebar
- **THEN** all 12 pages are rendered in a vertically scrollable container in order

#### Scenario: Scroll through pages
- **WHEN** user scrolls down through a multi-page PDF
- **THEN** pages flow continuously without page breaks or gaps beyond a small spacing

### Requirement: Zoom controls
The system SHALL provide zoom in, zoom out, and fit-to-width controls. The zoom level SHALL be displayed as a percentage. Minimum zoom is 25% and maximum zoom is 300%.

#### Scenario: Zoom in via button
- **WHEN** user clicks the zoom-in button
- **THEN** the zoom level increases by 25 percentage points and all pages re-render at the new scale

#### Scenario: Zoom out via button
- **WHEN** user clicks the zoom-out button
- **THEN** the zoom level decreases by 25 percentage points and all pages re-render at the new scale

#### Scenario: Zoom in via keyboard
- **WHEN** user presses `Cmd+=` (or `Ctrl+=` on non-Mac)
- **THEN** the zoom level increases by 25 percentage points

#### Scenario: Zoom out via keyboard
- **WHEN** user presses `Cmd+-` (or `Ctrl+-` on non-Mac)
- **THEN** the zoom level decreases by 25 percentage points

#### Scenario: Fit to width
- **WHEN** user clicks the "Fit Width" button
- **THEN** the page width adjusts to fill the available container width and the zoom percentage updates accordingly

#### Scenario: Zoom at minimum
- **WHEN** zoom is at 25% and user attempts to zoom out
- **THEN** the zoom level remains at 25%

#### Scenario: Zoom at maximum
- **WHEN** zoom is at 300% and user attempts to zoom in
- **THEN** the zoom level remains at 300%

### Requirement: Page indicator
The system SHALL display the current page number and total page count in the toolbar. The current page SHALL update as the user scrolls.

#### Scenario: Page indicator on load
- **WHEN** a 12-page PDF is opened
- **THEN** the toolbar displays "Page 1 / 12"

#### Scenario: Page indicator on scroll
- **WHEN** user scrolls so that page 5 is the most visible page
- **THEN** the toolbar updates to display "Page 5 / 12"

### Requirement: Page navigation
The system SHALL provide previous/next page buttons and allow direct page number input for navigation.

#### Scenario: Navigate to next page
- **WHEN** user clicks the next-page button
- **THEN** the view scrolls to the top of the next page

#### Scenario: Navigate to previous page
- **WHEN** user clicks the previous-page button while on page 5
- **THEN** the view scrolls to the top of page 4

#### Scenario: Previous page at first page
- **WHEN** user is on page 1 and clicks previous-page
- **THEN** nothing happens (button is disabled)

#### Scenario: Next page at last page
- **WHEN** user is on the last page and clicks next-page
- **THEN** nothing happens (button is disabled)

### Requirement: Text selection and copy
The system SHALL render the PDF text layer so users can select and copy text from the PDF.

#### Scenario: Select text in PDF
- **WHEN** user clicks and drags over text content in a PDF page
- **THEN** the text is visually highlighted as selected

#### Scenario: Copy selected text
- **WHEN** user selects text in the PDF and presses `Cmd+C`
- **THEN** the selected text is copied to the clipboard

### Requirement: Loading and error states
The system SHALL display appropriate loading and error states during PDF rendering.

#### Scenario: PDF loading
- **WHEN** a PDF file is being loaded and parsed
- **THEN** the viewer displays a loading indicator

#### Scenario: Corrupt or invalid PDF
- **WHEN** user opens a file with `.pdf` extension that is not a valid PDF
- **THEN** the viewer displays an error message indicating the file could not be read

### Requirement: PdfViewer component API
The `@orqa-note/pdf-viewer` package SHALL export a `PdfViewer` React component that accepts a `filePath` string prop and a `data` prop (Uint8Array of the PDF binary content).

#### Scenario: Render with data prop
- **WHEN** `PdfViewer` receives a valid PDF binary as `data`
- **THEN** the component renders the PDF content
