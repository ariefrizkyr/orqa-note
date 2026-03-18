## Why

The current "Open Folder" menu item has hidden dual behavior — it opens in the same window when no workspace is loaded, but silently spawns a new window when one is. There's no explicit way for users to create a new blank window. This makes multi-window workflows unintuitive and discoverable only by accident.

## What Changes

- Add **File > New Window** (`Cmd+N`) menu item that always spawns a fresh blank window showing the WelcomeScreen with recent workspaces
- Simplify **File > Open Folder** (`Cmd+O`) to always open in the current window (swap workspace), removing the conditional new-window branching
- Update the `workspace:openFolder` IPC handler to match — always return the selected path to the calling window, never spawn a new window from this handler

## Capabilities

### New Capabilities
- `new-window`: Explicit menu action and shortcut to create a new blank application window independent of the current window's workspace state

### Modified Capabilities
- `workspace-management`: "Switch workspace" requirement changes — `Cmd+O` now always swaps workspace in the current window regardless of whether a workspace is loaded. The conditional "open in new window if workspace exists" behavior is removed.

## Impact

- **app-menu.ts**: Add New Window menu item, simplify Open Folder click handler
- **workspace-handlers.ts**: Simplify `workspace:openFolder` IPC handler to always return path
- **window-manager.ts**: No changes needed — `createWindow()` already supports blank windows
- **WelcomeScreen.tsx**: No changes needed — already shows recent workspaces and open folder button
- No new dependencies required
