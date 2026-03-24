## ADDED Requirements

### Requirement: xterm.js terminal rendering
Each terminal tab SHALL render an xterm.js instance that displays the PTY session output.

#### Scenario: Terminal output display
- **WHEN** a `terminal:data` event is received for the active session
- **THEN** the data is written to the corresponding xterm.js instance and rendered

#### Scenario: Terminal hidden tab buffering
- **WHEN** a `terminal:data` event is received for an inactive (background) tab
- **THEN** the data is still written to that tab's xterm.js instance (preserving history)

### Requirement: Terminal input handling
The xterm.js instance SHALL capture keyboard input and forward it to the PTY session.

#### Scenario: User types in terminal
- **WHEN** user types in a focused xterm.js instance
- **THEN** the keystrokes are sent via `terminal:write` IPC to the corresponding PTY session

### Requirement: Terminal fit on resize
The xterm.js instance SHALL automatically refit to its container when the terminal panel is resized.

#### Scenario: Panel width changes
- **WHEN** the terminal panel width changes (via resize handle drag)
- **THEN** the xterm.js fit addon recalculates cols/rows and sends `terminal:resize` to the PTY

#### Scenario: Window resize
- **WHEN** the app window is resized
- **THEN** the xterm.js fit addon recalculates cols/rows and sends `terminal:resize` to the PTY

### Requirement: Terminal custom key bindings
The xterm.js instance SHALL support custom key bindings for improved UX.

#### Scenario: Shift+Enter inserts newline
- **WHEN** user presses Shift+Enter in a focused terminal
- **THEN** a literal newline character (`\n`) is sent to the PTY instead of a carriage return, inserting a new line without executing the command (Ghostty-style behavior)

#### Scenario: Cmd+Backspace kills line
- **WHEN** user presses Cmd+Backspace in a focused terminal
- **THEN** a Ctrl+U signal (`\x15`) is sent to the PTY, erasing the current input line from cursor to start

### Requirement: Terminal theme
The xterm.js instance SHALL use a dark theme consistent with the app's UI.

#### Scenario: Terminal appearance
- **WHEN** a terminal is rendered
- **THEN** it uses a dark background and light text matching the app's neutral-900 color scheme
