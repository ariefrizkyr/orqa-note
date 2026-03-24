## Why

The app lacks a built-in terminal, forcing users to switch between Orqa Note and an external terminal app when running commands in their workspace. Adding an integrated terminal panel (right-side, like VS Code's agent terminal) keeps users in context and reduces window switching.

## What Changes

- Add a right-side terminal panel with toggle button in the titlebar (beside the sidebar toggle)
- Support multi-tab terminals, each running an independent PTY session via `node-pty`
- Terminal renders using `xterm.js` in the renderer process
- New terminals open in the currently active workspace directory
- Existing terminal tabs persist across workspace switches (tabs are independent of workspace lifecycle)
- Panel visibility and width are persisted globally (same pattern as sidebar width via `global-ui.json`)
- Add keyboard shortcut (Cmd+T) to toggle the terminal panel

## Capabilities

### New Capabilities
- `terminal-panel`: Right-side panel UI with resize handle, visibility toggle, and width persistence
- `terminal-tabs`: Multi-tab management within the terminal panel (create, switch, close tabs)
- `terminal-pty`: PTY session lifecycle in the main process using `node-pty`, with IPC bridge to renderer
- `terminal-renderer`: xterm.js integration per tab, handling input/output streams and resize events

### Modified Capabilities

_(none — this is a new, self-contained feature)_

## Impact

- **Dependencies**: Adds `node-pty` (native module, requires electron-rebuild), `xterm` and `@xterm/addon-fit` packages
- **Main process**: New `terminal-manager.ts` service and `terminal-handlers.ts` IPC handlers
- **Preload**: Expose `terminal` API namespace on `window.electronAPI`
- **Renderer**: New `terminal/` component directory, modifications to `ui-store.ts`, `App.tsx` layout, and `use-keyboard.ts`
- **Global UI persistence**: `global-ui.json` gains `terminalVisible` and `terminalWidth` fields
