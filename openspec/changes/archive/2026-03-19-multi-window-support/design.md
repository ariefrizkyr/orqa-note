## Context

The Electron desktop app currently has a single "Open Folder" menu item (`Cmd+O`) that conditionally either opens a folder in the current window (if no workspace is loaded) or spawns a new window (if a workspace exists). The multi-window infrastructure is fully built — `createWindow()` supports blank windows, each window gets its own file watcher, session partition, and workspace binding via the `windowWorkspacePaths` Map. The UX entry point is the only gap.

## Goals / Non-Goals

**Goals:**
- Provide an explicit "New Window" action (`Cmd+N`) that always creates a blank window with the WelcomeScreen
- Make "Open Folder" (`Cmd+O`) always swap workspace in the current window — predictable, no branching
- Keep changes minimal — leverage existing infrastructure without refactoring

**Non-Goals:**
- Deduplicating windows by workspace path (e.g., focusing an existing window if the same folder is already open) — nice to have but adds complexity, not needed now
- Adding a "New Window" button to the WelcomeScreen UI — menu and shortcut are sufficient
- Window restore on app relaunch (remembering all open windows) — separate concern

## Decisions

### 1. New Window creates a blank window (no folder picker)

The new window opens to the WelcomeScreen which already shows recent workspaces and an "Open Folder" button. This is preferable to immediately showing a folder picker because:
- It reuses existing UI without changes
- Users can pick from recent workspaces without going through the OS file dialog
- Consistent with VS Code behavior where `Cmd+N` opens a blank editor

### 2. Open Folder always swaps in current window

Remove the `if (currentWorkspace) { createWindow() }` branching from both `app-menu.ts` and `workspace-handlers.ts`. The menu handler always sends `menu:open-folder` to the focused window. The IPC handler always returns the selected path. This makes the behavior predictable — if you want a new window, use New Window.

### 3. Shortcut assignment: Cmd+N for New Window

Standard macOS convention. No conflict — the app doesn't currently use `Cmd+N` for anything.

## Risks / Trade-offs

- **[Behavior change]** Users who relied on "Open Folder spawns a new window when workspace exists" will need to learn Cmd+N → Mitigation: This is a small user base (pre-release), and the new behavior is more intuitive
- **[No window deduplication]** Users could open the same folder in multiple windows → Mitigation: Acceptable for now; each window operates independently with its own file watcher and state
