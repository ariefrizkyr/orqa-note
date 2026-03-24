## 1. Dependencies & Types

- [x] 1.1 Add `node-pty`, `@xterm/xterm`, and `@xterm/addon-fit` packages to the desktop app
- [x] 1.2 Add terminal-related types to `shared/types.ts` (session ID, IPC message types)
- [x] 1.3 Ensure `node-pty` rebuilds correctly with electron-rebuild

## 2. Main Process — PTY Manager

- [x] 2.1 Create `main/services/terminal-manager.ts` with session lifecycle (create, write, resize, kill)
- [x] 2.2 Implement PTY creation using user's default shell and provided `cwd`
- [x] 2.3 Implement data streaming from PTY to renderer via `webContents.send`
- [x] 2.4 Implement cleanup of all sessions on window close

## 3. IPC Bridge

- [x] 3.1 Create `main/ipc/terminal-handlers.ts` with handlers for create, write, resize, kill
- [x] 3.2 Register terminal IPC handlers in main process entry point
- [x] 3.3 Expose terminal API in `preload/index.ts` (invoke methods + event listeners)

## 4. Renderer — State Management

- [x] 4.1 Add `terminalVisible`, `terminalWidth`, `toggleTerminal`, `setTerminalWidth` to `ui-store.ts`
- [x] 4.2 Wire terminal state persistence to `global-ui.json` (save/restore via existing debounced save)
- [x] 4.3 Add Ctrl+` keyboard shortcut to `use-keyboard.ts`

## 5. Renderer — Terminal Components

- [x] 5.1 Create `TerminalPanel.tsx` — outer container with resize handle and tab bar
- [x] 5.2 Create `TerminalTabBar.tsx` — tab strip with active tab highlight, close buttons, and "+" button
- [x] 5.3 Create `TerminalInstance.tsx` — xterm.js wrapper that manages a single terminal session (mount, input/output, fit, cleanup)
- [x] 5.4 Apply dark theme to xterm.js matching app's neutral-900 color scheme

## 6. Layout Integration

- [x] 6.1 Modify `App.tsx` layout to include terminal panel (right side of content area)
- [x] 6.2 Add terminal toggle button in titlebar (left of sidebar toggle)
- [x] 6.3 Auto-create first terminal tab when panel opens with no existing tabs

## 7. Terminal Tab Lifecycle

- [x] 7.1 Implement creating new tabs (spawns PTY in current workspace dir)
- [x] 7.2 Implement switching tabs (show/hide xterm instances, preserve history)
- [x] 7.3 Implement closing tabs (kill PTY, remove from state)
- [x] 7.4 Handle shell natural exit (`terminal:exit` event) — mark tab or auto-remove

## 8. Resize & Fit

- [x] 8.1 Implement resize handle drag (same pattern as sidebar, clamped 250–600px)
- [x] 8.2 Wire xterm.js fit addon to recalculate cols/rows on panel resize
- [x] 8.3 Wire xterm.js fit addon to recalculate cols/rows on window resize
- [x] 8.4 Forward new dimensions to PTY via `terminal:resize` IPC
