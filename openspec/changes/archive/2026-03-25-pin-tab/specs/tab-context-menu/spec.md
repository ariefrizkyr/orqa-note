## ADDED Requirements

### Requirement: Tab context menu
Right-clicking an editor tab SHALL display a context menu with tab management actions. The menu SHALL close when the user clicks outside it or presses Escape.

#### Scenario: Open context menu
- **WHEN** user right-clicks an editor tab
- **THEN** a context menu appears at the cursor position with available actions

#### Scenario: Close context menu on outside click
- **WHEN** the context menu is open and user clicks outside it
- **THEN** the context menu closes without performing any action

#### Scenario: Close context menu on Escape
- **WHEN** the context menu is open and user presses Escape
- **THEN** the context menu closes without performing any action

### Requirement: Context menu actions
The context menu SHALL include the following actions in order: Pin Tab / Unpin Tab, Close Tab, Close Others, Close All, Close to the Right.

#### Scenario: Pin Tab action on unpinned tab
- **WHEN** user right-clicks an unpinned tab
- **THEN** the menu shows "Pin Tab" as the first item

#### Scenario: Unpin Tab action on pinned tab
- **WHEN** user right-clicks a pinned tab
- **THEN** the menu shows "Unpin Tab" as the first item

#### Scenario: Close Tab disabled for pinned tab
- **WHEN** user right-clicks a pinned tab
- **THEN** the "Close Tab" menu item is visually disabled and non-interactive

#### Scenario: Close Others action
- **WHEN** user selects "Close Others" from the context menu of a tab
- **THEN** all unpinned tabs except the right-clicked tab are closed

#### Scenario: Close All action
- **WHEN** user selects "Close All" from the context menu
- **THEN** all unpinned tabs are closed; pinned tabs remain

#### Scenario: Close to the Right action
- **WHEN** user selects "Close to the Right" from the context menu of a tab
- **THEN** all unpinned tabs to the right of the right-clicked tab are closed
