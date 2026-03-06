## MODIFIED Requirements

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
