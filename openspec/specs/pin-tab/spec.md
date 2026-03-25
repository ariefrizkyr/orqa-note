### Requirement: Pin and unpin editor tabs
The system SHALL allow users to pin editor tabs via a right-click context menu. Pinned tabs display a pin icon in place of the close button. The tab label SHALL remain visible.

#### Scenario: Pin a tab
- **WHEN** user right-clicks an unpinned tab and selects "Pin Tab"
- **THEN** the tab becomes pinned, the close button is replaced with a pin icon, and the tab moves to the end of the pinned zone (leftmost group)

#### Scenario: Unpin a tab
- **WHEN** user right-clicks a pinned tab and selects "Unpin Tab"
- **THEN** the tab becomes unpinned, the pin icon is replaced with a close button, and the tab moves to the start of the unpinned zone

### Requirement: Pinned tabs cannot be closed
Pinned tabs SHALL be protected from all close operations: close button click, `Cmd+W`, middle-click, Close All, Close Others, and Close to the Right.

#### Scenario: Cmd+W on pinned tab
- **WHEN** user presses `Cmd+W` while a pinned tab is active
- **THEN** the tab SHALL remain open and no action is taken

#### Scenario: Middle-click on pinned tab
- **WHEN** user middle-clicks a pinned tab
- **THEN** the tab SHALL remain open and no action is taken

#### Scenario: Close All with pinned tabs
- **WHEN** user triggers "Close All" with 2 pinned and 3 unpinned tabs
- **THEN** only the 3 unpinned tabs are closed; the 2 pinned tabs remain

#### Scenario: Close Others with pinned tabs
- **WHEN** user right-clicks an unpinned tab and selects "Close Others"
- **THEN** all other unpinned tabs are closed; all pinned tabs remain

#### Scenario: Close to the Right with pinned tabs
- **WHEN** user right-clicks a tab and selects "Close to the Right"
- **THEN** only unpinned tabs to the right of the target are closed; pinned tabs are skipped

### Requirement: Pinned tabs auto-sort to the left
Pinned tabs SHALL always occupy the leftmost positions in the tab bar, before all unpinned tabs.

#### Scenario: Pin moves tab to pinned zone
- **WHEN** user pins the 4th tab out of 5
- **THEN** the tab moves to the rightmost position within the pinned zone (after any existing pinned tabs)

#### Scenario: Tab order after multiple pins
- **WHEN** user pins tab C, then tab A (original order: A, B, C, D)
- **THEN** tab bar order becomes: C, A, B, D (pinned zone: C, A; unpinned zone: B, D)

### Requirement: Zone-restricted drag-and-drop
Pinned tabs SHALL only be reorderable within the pinned zone. Unpinned tabs SHALL only be reorderable within the unpinned zone. Cross-zone dragging SHALL be blocked.

#### Scenario: Drag pinned tab within pinned zone
- **WHEN** user drags a pinned tab to a different position within the pinned zone
- **THEN** the tab is reordered within the pinned zone

#### Scenario: Drag pinned tab to unpinned zone
- **WHEN** user drags a pinned tab toward the unpinned zone
- **THEN** the drop is clamped to the last position in the pinned zone; the tab does not enter the unpinned zone

#### Scenario: Drag unpinned tab to pinned zone
- **WHEN** user drags an unpinned tab toward the pinned zone
- **THEN** the drop is clamped to the first position in the unpinned zone; the tab does not enter the pinned zone

### Requirement: Pin state persistence
The `isPinned` state SHALL be persisted as part of the tab data in `workspace-state.json` and restored on app launch or workspace switch.

#### Scenario: Restart preserves pin state
- **WHEN** user pins 2 tabs, closes the app, and relaunches
- **THEN** the same 2 tabs are restored as pinned in their pinned-zone positions

#### Scenario: Backward compatibility
- **WHEN** workspace state is loaded from a file that does not include `isPinned` fields
- **THEN** all tabs default to unpinned behavior
