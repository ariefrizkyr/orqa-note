## Why

Users working across multiple projects need to quickly switch between workspaces without losing their place. Currently, switching workspace (Cmd+O) replaces the current workspace entirely — closing all tabs and resetting the sidebar. There's no way to organize related workspaces together or maintain state across switches. Users who work on a frontend, backend, and shared library simultaneously must repeatedly reopen folders and re-expand their file trees.

Workspace groups solve this by letting users bundle related workspaces together in a single window, with a sidebar dropdown to switch between them instantly while preserving each workspace's tabs and expanded tree state.

## What Changes

- Introduce **workspace groups** as a new top-level concept: a named collection of workspace folder paths, bound to a single Electron window
- Replace the static folder name in the sidebar header (`WorkspaceHeader.tsx`) with a **workspace switcher dropdown** that lists all workspaces in the current group
- Add **"File > Open Workspace Group"** menu with submenu to open existing groups (each in its own window) or create new groups
- **Persist expanded paths** (`expandedPaths`) per workspace alongside existing tab state — tree collapse state survives workspace switches and app restarts
- **Move `sidebarWidth` to global UI state** — sidebar width is a user preference, not per-workspace
- Add a **managed workspace list** per group (user explicitly adds/removes workspaces via the dropdown) — separate from the existing auto-tracked recent workspaces
- Each workspace within a group retains independent persistence (tabs, active tab, expanded paths, sidebar visibility) using the existing per-workspace hash storage
- On app launch, **restore all previously open workspace groups**, each in its own window, with the last active workspace per group
- **Lazy preload** inactive workspaces in a group: load active workspace immediately, preload 2-3 most recent after idle, show brief skeleton for uncached workspaces on switch
- Existing `Cmd+O` behavior changes from "replace current workspace" to "add workspace to current group" (opens folder picker, appends to group)

## Capabilities

### New Capabilities
- `workspace-group`: Workspace group data model, persistence (`workspace-groups.json`), group lifecycle (create, open, close), menu integration ("File > Open Workspace Group"), multi-window mapping, and app launch restore behavior
- `workspace-switcher`: Sidebar dropdown UI replacing `WorkspaceHeader`, workspace switching within a group, add/remove workspace from group, lazy preload of inactive workspace state
- `expanded-paths-persistence`: Persist `expandedPaths` set per workspace to disk alongside tab state, restore on workspace activation

### Modified Capabilities
- `workspace-management`: Cmd+O changes from "replace workspace in window" to "add workspace to current group". Welcome screen flow changes to create a workspace group on first launch. Recent workspaces list remains but is separate from group membership.
- `tab-system`: Tab persistence scope unchanged (per-workspace hash), but tab reset/restore now triggered by workspace switching within a group rather than folder-open. `sidebarWidth` moves out of per-workspace `WorkspaceState` to global UI state.
- `file-tree-sidebar`: Expanded paths (`expandedPaths`) gain disk persistence. Tree state restore happens on workspace switch within a group, not just on app launch.

## Impact

- **Main process**: New `workspace-groups.json` persistence, updated window-manager to track group-to-window mapping, new IPC handlers for group CRUD, updated app menu with "Open Workspace Group" submenu
- **Renderer process**: New `WorkspaceSwitcher` component replacing `WorkspaceHeader`, updated workspace-store to persist/restore `expandedPaths`, new group-aware preloading logic, updated ui-store for global sidebar width
- **State persistence**: New file (`workspace-groups.json`), extended `workspace-state.json` (add `expandedPaths`), new `global-ui.json` (sidebar width)
- **Shared types**: New `WorkspaceGroup` type, updated `WorkspaceState` type (add `expandedPaths`, remove `sidebarWidth`)
- **Existing behavior**: `Cmd+O` semantics change (additive instead of replacement), window title format changes to "Group — Workspace"
