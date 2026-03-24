## Context

Orqa Note is an Electron desktop app (React + Zustand) for Product Managers. The app uses a three-tier persistence model: global UI state (`global-ui.json`), per-workspace state (`state.json`), and workspace groups (`workspace-groups.json`). The sidebar already demonstrates the pattern for a togglable, resizable panel with persisted dimensions.

The current layout is: `Sidebar | TabBar + ContentArea`, with a titlebar containing a sidebar toggle button. The terminal panel will slot in as a right-side panel within the content area.

Workspace paths are available via `useWorkspaceStore.workspacePath` as absolute filesystem paths.

## Goals / Non-Goals

**Goals:**
- Provide an integrated terminal experience without leaving the app
- Support multiple independent terminal tabs running concurrently
- Persist panel UI state (visible, width) across app restarts
- Open new terminals in the active workspace directory
- Keep terminal tabs alive across workspace switches

**Non-Goals:**
- Terminal session persistence across app restarts (PTY processes die on quit)
- Terminal profiles or shell configuration (uses system default shell)
- Terminal theming or customization beyond matching the app's dark theme
- Split panes within the terminal panel
- Terminal integration with the editor (e.g., "run selection in terminal")

## Decisions

### 1. PTY management via `node-pty` in main process

**Choice**: Spawn PTY sessions in the Electron main process using `node-pty`, communicate with renderer via IPC.

**Why**: The renderer process is sandboxed and cannot spawn PTY sessions directly. `node-pty` is the standard choice for Electron terminal apps (used by VS Code, Hyper). The main process manages the PTY lifecycle, and data flows through IPC channels.

**Alternatives considered**:
- Web-based terminal emulators (no real shell access)
- Spawning child processes directly (no PTY features like color, cursor positioning, signals)

### 2. IPC protocol design

**Choice**: Request-response for lifecycle operations (`create`, `kill`, `resize`), event-based for data streams (`data`, `exit`).

**Why**: Terminal output is continuous and high-throughput — polling or request-response would be too slow. `write` is fire-and-forget (renderer → main). `data` events stream from main → renderer per session ID.

Protocol:
- `terminal:create(cwd)` → `sessionId`
- `terminal:write(sessionId, data)` → void
- `terminal:resize(sessionId, cols, rows)` → void
- `terminal:kill(sessionId)` → void
- `terminal:data(sessionId, data)` → event
- `terminal:exit(sessionId, exitCode)` → event

### 3. Panel positioning and resize

**Choice**: Right-side panel with horizontal resize handle, mirroring the sidebar's resize pattern but on the opposite side.

**Why**: User preference. The resize implementation follows the same `mousedown → mousemove → mouseup` pattern already used by the sidebar, with width clamped between 250–600px.

### 4. Persistence scope — global only

**Choice**: Persist `terminalVisible` and `terminalWidth` in `global-ui.json`. Terminal tabs themselves are not persisted.

**Why**: Simplest approach. The sidebar width already uses this pattern. On app restart, the panel opens (if previously visible) with one fresh terminal tab in the active workspace.

### 5. xterm.js with fit addon

**Choice**: Use `@xterm/xterm` for terminal rendering and `@xterm/addon-fit` for automatic resize-to-container.

**Why**: xterm.js is the standard terminal renderer for web/Electron apps. The fit addon handles recalculating cols/rows when the panel resizes, then we forward the new dimensions to the PTY via `terminal:resize`.

### 6. Terminal tab state lives in a custom React hook (renderer only)

**Choice**: Terminal tab metadata (id, title, active tab) lives in a `useTerminalTabs` custom hook using `useState`, not a Zustand store. The hook is called in `App.tsx` and its return values are passed to the `TerminalTabBar` and `TerminalContent` components.

**Why**: Tabs are ephemeral — they exist only while the app runs. The hook approach was chosen over Zustand because the tab bar and content area render in separate layout positions (tab bar in the top row, content in the bottom row), requiring the state to be lifted to a common parent. A hook is simpler than a store for state that doesn't need cross-component subscription.

## Risks / Trade-offs

- **`node-pty` is a native module** → Requires `electron-rebuild` for each platform. Mitigation: well-supported module, widely used in Electron ecosystem. CI already handles native rebuilds.
- **High-frequency IPC for terminal data** → Large output (e.g., `cat` on a big file) could strain IPC. Mitigation: xterm.js handles buffering internally; IPC overhead is minimal for typical terminal usage.
- **Panel competes for horizontal space** → On narrow screens, a right-side panel reduces editor width. Mitigation: width is user-resizable with sensible min/max bounds (250–600px), and panel is easily toggled off.
- **No session restore** → Users lose terminal history on restart. Mitigation: this matches VS Code's behavior and keeps scope small. Can be revisited later.
