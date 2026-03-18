## 1. Add New Window menu item

- [x] 1.1 Add "New Window" menu item with `Cmd+N` accelerator to the File submenu in `app-menu.ts`, positioned before "Open Folder". Click handler calls `createWindow()` with no arguments.

## 2. Simplify Open Folder behavior

- [x] 2.1 Update the "Open Folder" click handler in `app-menu.ts` to always send `menu:open-folder` to the focused window — remove the `if (currentWorkspace)` branching that calls `createWindow(folderPath)`
- [x] 2.2 Update `workspace:openFolder` IPC handler in `workspace-handlers.ts` to always return the selected folder path — remove the `if (currentWorkspace) { createWindow() }` branching

## 3. Verify

- [x] 3.1 Test: Cmd+N creates a blank window showing WelcomeScreen with recent workspaces
- [x] 3.2 Test: Cmd+O from WelcomeScreen opens folder in the same window
- [x] 3.3 Test: Cmd+O from an active workspace swaps to the new folder in the same window (no new window created)
- [x] 3.4 Test: Opening a recent workspace from the WelcomeScreen in a new window works correctly
