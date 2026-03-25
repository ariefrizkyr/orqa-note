## MODIFIED Requirements

### Requirement: Multi-tab interface
The app SHALL support opening unlimited files as tabs in a horizontal tab bar. Each tab displays the file name, a type-colored dot indicator, a dirty state indicator when the document has unsaved changes, and either a close button (unpinned tabs) or a pin icon (pinned tabs).

#### Scenario: Open file as tab
- **WHEN** user clicks a file in the sidebar
- **THEN** system opens the file in a new tab and makes it the active tab

#### Scenario: Close tab
- **WHEN** user clicks the close button on an unpinned tab or presses `Cmd+W` on an unpinned active tab
- **THEN** system closes the tab and activates the nearest remaining tab (or shows empty state)

#### Scenario: Close pinned tab blocked
- **WHEN** user presses `Cmd+W` while a pinned tab is active, or middle-clicks a pinned tab
- **THEN** the tab SHALL remain open and no action is taken

#### Scenario: Middle-click close
- **WHEN** user middle-clicks an unpinned tab
- **THEN** system closes that tab

#### Scenario: Dirty indicator on tab
- **WHEN** a document has unsaved changes
- **THEN** the tab displays a dot indicator next to the file name to signal dirty state
