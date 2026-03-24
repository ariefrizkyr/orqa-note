## ADDED Requirements

### Requirement: PTY session creation
The main process SHALL create a PTY session using `node-pty` when requested via IPC, returning a unique session ID.

#### Scenario: Create PTY with workspace directory
- **WHEN** the renderer sends `terminal:create` with a workspace path as `cwd`
- **THEN** a new PTY is spawned using the user's default shell in the specified directory, and a session ID is returned

#### Scenario: Create PTY with no workspace
- **WHEN** the renderer sends `terminal:create` with a null/undefined `cwd`
- **THEN** a new PTY is spawned in the user's home directory

### Requirement: PTY data streaming
The main process SHALL stream PTY output to the renderer via IPC events.

#### Scenario: PTY produces output
- **WHEN** the PTY session produces output (stdout/stderr)
- **THEN** the main process sends a `terminal:data` event with the session ID and output data to the renderer

### Requirement: PTY input forwarding
The main process SHALL forward input from the renderer to the PTY session.

#### Scenario: User types in terminal
- **WHEN** the renderer sends `terminal:write` with a session ID and input data
- **THEN** the data is written to the corresponding PTY session

### Requirement: PTY resize
The main process SHALL resize the PTY when the renderer reports new dimensions.

#### Scenario: Terminal panel resized
- **WHEN** the renderer sends `terminal:resize` with session ID, cols, and rows
- **THEN** the PTY session is resized to the specified dimensions

### Requirement: PTY session termination
The main process SHALL kill a PTY session when requested or when the session's shell exits.

#### Scenario: User closes terminal tab
- **WHEN** the renderer sends `terminal:kill` with a session ID
- **THEN** the PTY process is killed and resources are cleaned up

#### Scenario: Shell exits naturally
- **WHEN** the PTY process exits on its own (e.g., user types `exit`)
- **THEN** the main process sends a `terminal:exit` event with the session ID and exit code

### Requirement: Cleanup on window close
The main process SHALL kill all PTY sessions associated with a window when that window closes.

#### Scenario: Window closed
- **WHEN** a BrowserWindow is closed
- **THEN** all PTY sessions created by that window are killed
