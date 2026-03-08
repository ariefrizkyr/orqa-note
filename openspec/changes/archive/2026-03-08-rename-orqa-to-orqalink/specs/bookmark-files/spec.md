## MODIFIED Requirements

### Requirement: .orqa bookmark file format
Bookmarks SHALL be stored as `.orqlnk` JSON files on disk with the schema: `{ type: "bookmark", url: string, label: string, service: string }`. Valid service values are `docs`, `sheets`, `slides`, `figma`, and `other`.

#### Scenario: Valid bookmark file
- **WHEN** the sidebar encounters a file named `metrics.orqlnk` containing `{"type":"bookmark","url":"https://docs.google.com/...","label":"Q2 Metrics","service":"sheets"}`
- **THEN** sidebar displays it with a green "Sheets" chip and the label "Q2 Metrics"

#### Scenario: Invalid bookmark file
- **WHEN** an `.orqlnk` file contains invalid JSON or missing required fields
- **THEN** sidebar displays the file with a warning icon and opening it shows an error message

### Requirement: Bookmark sidebar display
`.orqlnk` files SHALL appear in the sidebar alongside regular files with a service-colored chip indicator: green for Sheets, blue for Docs, red for Slides, orange for Figma, grey for other.

#### Scenario: Service-colored chip
- **WHEN** sidebar renders a `.orqlnk` file with `service: "figma"`
- **THEN** the file node displays an orange "Figma" chip next to the label

### Requirement: Create bookmark via New Tab
Users SHALL be able to create new `.orqlnk` bookmark files from the New Tab screen by entering a URL, label, and selecting a service type.

#### Scenario: Add bookmark
- **WHEN** user clicks "Bookmark" on the New Tab screen and enters URL `https://figma.com/file/...`, label "Checkout Flow", service "figma"
- **THEN** system creates `checkout-flow.orqlnk` in the workspace root with the correct JSON and opens it as a tab

### Requirement: Webview toolbar for bookmarks
Each bookmark tab SHALL display a toolbar above the webview content showing the bookmark label, a Reload button, and an "Open in Browser" button.

#### Scenario: Reload webview
- **WHEN** user clicks "Reload" in the webview toolbar
- **THEN** the WebContentsView reloads the current URL

#### Scenario: Open in browser
- **WHEN** user clicks "Open in Browser" in the webview toolbar
- **THEN** system opens the bookmark URL in the user's default browser via `shell.openExternal`
