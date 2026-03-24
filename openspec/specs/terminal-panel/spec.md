## ADDED Requirements

### Requirement: Terminal panel toggle button
The app SHALL display a terminal toggle button in the titlebar, positioned to the right of the existing sidebar toggle button.

#### Scenario: Toggle terminal panel open
- **WHEN** user clicks the terminal toggle button while the panel is hidden
- **THEN** the terminal panel appears on the right side of the content area

#### Scenario: Toggle terminal panel closed
- **WHEN** user clicks the terminal toggle button while the panel is visible
- **THEN** the terminal panel is hidden and the content area expands to fill the space

#### Scenario: Keyboard shortcut toggle
- **WHEN** user presses Cmd+T
- **THEN** the terminal panel visibility toggles (same as clicking the button)

### Requirement: Terminal panel layout
The terminal panel SHALL render as a right-side panel within the content area, between the editor and the right edge of the window.

#### Scenario: Panel position in layout
- **WHEN** the terminal panel is visible
- **THEN** the layout is: Sidebar | [FileTabBar | TerminalTabBar] | [Editor | ResizeHandle | TerminalContent] — the file tab bar and terminal tab bar render in the same row, each above its own column

#### Scenario: Panel hidden layout
- **WHEN** the terminal panel is hidden
- **THEN** the layout is unchanged from current: Sidebar | TabBar | Editor

### Requirement: Terminal panel resize
The terminal panel SHALL have a draggable resize handle on its left edge, allowing the user to adjust the panel width.

#### Scenario: Resize within bounds
- **WHEN** user drags the resize handle
- **THEN** the panel width adjusts, clamped between 250px and 600px

#### Scenario: Resize updates terminal dimensions
- **WHEN** the panel width changes (via drag)
- **THEN** the terminal emulator recalculates its column/row count to fit the new width

### Requirement: Terminal panel persistence
The terminal panel's visibility and width SHALL be persisted globally in `global-ui.json`.

#### Scenario: Restore panel state on app launch
- **WHEN** the app launches
- **THEN** the terminal panel visibility and width are restored from `global-ui.json`

#### Scenario: Panel state saves on change
- **WHEN** the user toggles visibility or resizes the panel
- **THEN** the new state is debounce-saved to `global-ui.json`

### Requirement: Default panel state
The terminal panel SHALL be hidden by default with a default width of 400px.

#### Scenario: First launch defaults
- **WHEN** no terminal state exists in `global-ui.json`
- **THEN** the panel is hidden with width 400px
