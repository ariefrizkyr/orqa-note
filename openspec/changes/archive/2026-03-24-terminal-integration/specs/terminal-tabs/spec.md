## ADDED Requirements

### Requirement: Terminal tab bar
The terminal panel SHALL display a tab bar at the top showing all open terminal tabs, with a button to create new tabs.

#### Scenario: Tab bar display
- **WHEN** the terminal panel is visible
- **THEN** a tab bar is shown at the top with all terminal tabs and a "+" button

#### Scenario: Active tab highlight
- **WHEN** multiple terminal tabs exist
- **THEN** the active tab is visually distinguished from inactive tabs

### Requirement: Create new terminal tab
The user SHALL be able to create a new terminal tab, which spawns an independent PTY session.

#### Scenario: Create via plus button
- **WHEN** user clicks the "+" button in the terminal tab bar
- **THEN** a new terminal tab is created with a fresh PTY session in the current workspace directory

#### Scenario: Default tab on panel open
- **WHEN** the terminal panel becomes visible and no terminal tabs exist
- **THEN** a single terminal tab is automatically created

#### Scenario: Tab naming
- **WHEN** a new terminal tab is created
- **THEN** the tab displays a generic name based on the shell (e.g., "bash", "zsh")

### Requirement: Switch between terminal tabs
The user SHALL be able to switch between terminal tabs by clicking on them.

#### Scenario: Switch active tab
- **WHEN** user clicks on an inactive terminal tab
- **THEN** that tab becomes active and its terminal output is displayed

#### Scenario: Previous tab preserved
- **WHEN** user switches away from a tab and back
- **THEN** the terminal session and its output history are preserved

### Requirement: Close terminal tab
The user SHALL be able to close individual terminal tabs.

#### Scenario: Close tab
- **WHEN** user closes a terminal tab (via close button on the tab)
- **THEN** the associated PTY session is killed and the tab is removed

#### Scenario: Close last tab
- **WHEN** user closes the last remaining terminal tab
- **THEN** the terminal panel remains visible with no tabs (user can create a new one via "+")

### Requirement: Terminal tabs independent of workspace
Terminal tabs SHALL persist across workspace switches within the same window.

#### Scenario: Workspace switch
- **WHEN** user switches to a different workspace
- **THEN** all existing terminal tabs remain open and running

#### Scenario: New tab after workspace switch
- **WHEN** user creates a new terminal tab after switching workspaces
- **THEN** the new tab opens in the newly active workspace directory
