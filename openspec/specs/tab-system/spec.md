## ADDED Requirements

### Requirement: Multi-tab interface
The app SHALL support opening unlimited files as tabs in a horizontal tab bar. Each tab displays the file name, a type-colored dot indicator, a dirty state indicator when the document has unsaved changes, and a close button.

#### Scenario: Open file as tab
- **WHEN** user clicks a file in the sidebar
- **THEN** system opens the file in a new tab and makes it the active tab

#### Scenario: Close tab
- **WHEN** user clicks the close button on a tab or presses `Cmd+W`
- **THEN** system closes the tab and activates the nearest remaining tab (or shows empty state)

#### Scenario: Middle-click close
- **WHEN** user middle-clicks a tab
- **THEN** system closes that tab

#### Scenario: Dirty indicator on tab
- **WHEN** a document has unsaved changes
- **THEN** the tab displays a dot indicator next to the file name to signal dirty state

### Requirement: Tab deduplication
Clicking a sidebar item for an already-open file SHALL switch to the existing tab rather than opening a duplicate.

#### Scenario: File already open
- **WHEN** user clicks a sidebar file that is already open in a tab
- **THEN** system switches to the existing tab without creating a new one

### Requirement: Tab persistence
Open tabs and their order SHALL be persisted to `userData/workspaces/<folder-hash>/workspace-state.json` and restored on workspace activation (either on app launch or workspace switch within a group). Sidebar width is NOT included in per-workspace state — it is persisted globally.

#### Scenario: App restart with tabs
- **WHEN** user closes the app with 3 tabs open and relaunches
- **THEN** system restores all 3 tabs in the same order with the same active tab

#### Scenario: Persisted file missing
- **WHEN** a persisted tab references a file that no longer exists on disk
- **THEN** system shows a "File not found" state in that tab with option to close

#### Scenario: Debounced persistence
- **WHEN** user opens or closes tabs rapidly
- **THEN** system debounces save operations at 1-second intervals to avoid excessive disk writes

#### Scenario: Backward compatibility with tabs.json
- **WHEN** `workspace-state.json` does not exist but `tabs.json` does
- **THEN** system reads tab state from `tabs.json` as a fallback

#### Scenario: Workspace switch preserves tabs
- **WHEN** user switches from workspace A to workspace B within a group
- **THEN** workspace A's tabs are saved, workspace B's tabs are restored, and no tabs are lost

### Requirement: Tab keyboard navigation
The system SHALL support keyboard shortcuts for tab management.

#### Scenario: Switch to tab by number
- **WHEN** user presses `Cmd+3`
- **THEN** system activates the 3rd tab

#### Scenario: Cycle tabs
- **WHEN** user presses `Cmd+Tab`
- **THEN** system activates the next tab (wrapping to first after last)

#### Scenario: Reopen closed tab
- **WHEN** user presses `Cmd+Shift+T`
- **THEN** system reopens the most recently closed tab

### Requirement: File tab content routing
The ContentArea SHALL route file tabs to the appropriate editor based on file extension. `.xlsx` and `.csv` files SHALL open in the spreadsheet editor.

#### Scenario: Open XLSX file in spreadsheet editor
- **WHEN** a tab with a `.xlsx` file becomes active
- **THEN** ContentArea SHALL render the SpreadsheetFileEditor component for that file

#### Scenario: Open CSV file in spreadsheet editor
- **WHEN** a tab with a `.csv` file becomes active
- **THEN** ContentArea SHALL render the SpreadsheetFileEditor component for that file

#### Scenario: XLSX not treated as binary
- **WHEN** a `.xlsx` file is opened
- **THEN** it SHALL NOT fall through to the binary file "Preview not available" screen

### Requirement: New Tab screen
Pressing the `+` button in the tab bar SHALL open a New Tab screen with a grid of file type cards for creating new files or adding bookmarks.

#### Scenario: Create file from New Tab
- **WHEN** user clicks "Markdown" card on the New Tab screen
- **THEN** system prompts for a filename, creates the `.md` file in the workspace root, and opens it in a new tab
