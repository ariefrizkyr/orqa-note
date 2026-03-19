## 1. Shared Types & Data Model

- [x] 1.1 Add `WorkspaceGroup` type to `shared/types.ts` (id, name, workspaces[], activeWorkspace)
- [x] 1.2 Add `WorkspaceGroupsFile` type (groups[], lastOpenedGroupIds[])
- [x] 1.3 Update `WorkspaceState` type: add `expandedPaths: string[]`, remove `sidebarWidth`
- [x] 1.4 Add `GlobalUIState` type (sidebarWidth)
- [x] 1.5 Add new IPC channel types for workspace group operations to `ElectronAPI`

## 2. Main Process — Group Persistence

- [x] 2.1 Create `workspace-group-persistence.ts` with read/write for `workspace-groups.json`
- [x] 2.2 Implement group CRUD functions: createGroup, getGroup, getAllGroups, updateGroup, removeGroup
- [x] 2.3 Implement `lastOpenedGroupIds` management (add, remove, get)
- [x] 2.4 Create `global-ui-persistence.ts` with read/write for `global-ui.json` (sidebarWidth)

## 3. Main Process — State Persistence Updates

- [x] 3.1 Update `state-persistence.ts`: rename internal file from `tabs.json` to `workspace-state.json` with backward-compatible fallback read
- [x] 3.2 Update `saveTabState` / `getTabState` to handle `expandedPaths` array in the state file

## 4. Main Process — Window Manager Updates

- [x] 4.1 Replace `windowWorkspacePaths` map with `windowGroupMap` (windowId → groupId) in `window-manager.ts`
- [x] 4.2 Update `createWindow` to accept groupId, set window title to "GroupName — WorkspaceName"
- [x] 4.3 Add function to update window title when active workspace changes within a group
- [x] 4.4 Update window `closed` handler to save group state and remove from `lastOpenedGroupIds`

## 5. Main Process — IPC Handlers

- [x] 5.1 Create `workspace-group-handlers.ts` with IPC handlers: getForWindow, addWorkspace, removeWorkspace, setActiveWorkspace, getAll, create, open
- [x] 5.2 Update `workspace-handlers.ts`: `workspace:openFolder` now adds to current group instead of standalone open
- [x] 5.3 Add IPC handler for global UI state (get/save sidebarWidth)
- [x] 5.4 Register new handlers in `main/index.ts`

## 6. Main Process — Menu Integration

- [x] 6.1 Add "File > Open Workspace Group" submenu listing all groups + "New Group..."
- [x] 6.2 Implement menu item handlers: open group (create/focus window), new group (prompt + folder picker)
- [x] 6.3 Add menu rebuild trigger when groups change (create, remove)

## 7. Main Process — App Launch

- [x] 7.1 Update app launch flow to read `lastOpenedGroupIds` and open a window per group
- [x] 7.2 Handle first launch (no groups) — show welcome screen in single window
- [x] 7.3 Handle stale group references (group ID in lastOpened but not in groups array)

## 8. Preload Bridge

- [x] 8.1 Expose workspace group IPC channels in preload script
- [x] 8.2 Expose global UI state IPC channels in preload script

## 9. Renderer — Store Updates

- [x] 9.1 Update `workspace-store.ts`: add action to set expandedPaths from persisted array (convert to Set)
- [x] 9.2 Update `ui-store.ts`: initialize sidebarWidth from global UI state via IPC on mount, persist changes back
- [x] 9.3 Create `group-store.ts` (Zustand): holds current group data (id, name, workspaces[], activeWorkspace)

## 10. Renderer — Workspace State Persistence Updates

- [x] 10.1 Update `lib/ipc.ts`: include `expandedPaths` (serialized as array) in `debouncedSaveTabState` and `flushSaveTabState`
- [x] 10.2 Update `App.tsx` save effect to include expandedPaths from workspace-store
- [x] 10.3 Update `App.tsx` restore flow to restore expandedPaths from saved state and read children for expanded directories

## 11. Renderer — Workspace Switcher Component

- [x] 11.1 Create `WorkspaceSwitcher.tsx` replacing `WorkspaceHeader.tsx` — dropdown showing active workspace name with chevron
- [x] 11.2 Implement dropdown popover listing all workspaces in current group with active checkmark
- [x] 11.3 Add "+ Add workspace..." option that triggers folder picker and adds to group
- [x] 11.4 Add right-click context menu on workspace items with "Remove from group" option
- [x] 11.5 Wire up workspace selection to `switchWorkspace` function

## 12. Renderer — Workspace Switching Logic

- [x] 12.1 Refactor `openWorkspace` in `App.tsx` into `switchWorkspace` that saves current state (tabs + expandedPaths), checks cache, restores target state
- [x] 12.2 Implement in-memory workspace cache (Map with LRU eviction, max 3 entries)
- [x] 12.3 Implement lazy preload: after 2s idle, preload up to 2 inactive workspaces (readDir + read state file)
- [x] 12.4 Handle missing workspace folder on switch (show error, offer remove from group)
- [x] 12.5 Update chokidar watcher restart on workspace switch

## 13. Renderer — App.tsx Integration

- [x] 13.1 Load group data on mount via IPC (getForWindow), populate group-store
- [x] 13.2 Replace `WorkspaceHeader` with `WorkspaceSwitcher` in Sidebar
- [x] 13.3 Update first-launch flow: opening first folder creates default group transparently
- [x] 13.4 Update window title via IPC when active workspace changes

## 14. Backward Compatibility & Migration

- [x] 14.1 Ensure `getTabState` falls back to `tabs.json` when `workspace-state.json` doesn't exist
- [x] 14.2 Ensure app works normally when `workspace-groups.json` doesn't exist (single-window, welcome screen)
- [x] 14.3 Test: existing users opening app after update see welcome screen or their last workspace as before
