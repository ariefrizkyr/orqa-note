## Context

Orqa Note is an Electron + React desktop app with Zustand state management. Currently, one window maps to one workspace (a filesystem folder). Workspace switching via Cmd+O is destructive — it replaces the current workspace entirely, closing all tabs and resetting the sidebar tree.

The state persistence layer already isolates per-workspace data via MD5-hashed directories under `~/.config/Orqa/workspaces/{hash}/tabs.json`. The `expandedPaths` Set in `workspace-store.ts` is not persisted — it resets every session. Sidebar width lives in `WorkspaceState` but behaves as a global preference.

The window manager (`window-manager.ts`) tracks a `windowWorkspacePaths` map (windowId → workspacePath). The renderer's `App.tsx` orchestrates workspace lifecycle: open, save state, switch, restore.

## Goals / Non-Goals

**Goals:**
- Let users organize workspaces into named groups, with each group bound to one Electron window
- Enable fast switching between workspaces within a group via sidebar dropdown
- Persist expanded paths per workspace so tree state survives switches and restarts
- Restore all previously open workspace groups on app launch
- Keep sidebar width as a global preference, not per-workspace

**Non-Goals:**
- Multi-root file tree (showing multiple workspace trees simultaneously)
- Workspace search/filter in the dropdown
- Workspace renaming, reordering, or drag-and-drop within groups
- Cross-workspace tabs (tabs always belong to one workspace)
- Syncing workspace groups across machines

## Decisions

### Decision 1: Workspace group persistence format

Store groups in `~/.config/Orqa/workspace-groups.json`:

```json
{
  "groups": [
    {
      "id": "abc123",
      "name": "Work",
      "workspaces": ["/Users/.../frontend", "/Users/.../backend"],
      "activeWorkspace": "/Users/.../frontend"
    }
  ],
  "lastOpenedGroupIds": ["abc123"]
}
```

**Rationale:** Single flat file is simple to read/write. Group IDs are short UUIDs (8 chars). `lastOpenedGroupIds` is an ordered array — on launch, each gets its own window. The `activeWorkspace` per group means switching groups always lands where you left off.

**Alternative considered:** Storing group info per-window in `window-state.json` — rejected because groups are a user-level concept that outlives windows.

### Decision 2: Per-workspace state file expansion

Rename `tabs.json` → `workspace-state.json` and add `expandedPaths`:

```json
{
  "tabs": [...],
  "activeTabId": "...",
  "sidebarVisible": true,
  "expandedPaths": ["/Users/.../src", "/Users/.../src/components"]
}
```

`sidebarWidth` is removed from per-workspace state (moved to global).

**Rationale:** `expandedPaths` is serialized as an array (Sets aren't JSON-serializable). On restore, convert back to Set. The existing hash-based directory scheme (`workspaces/{hash}/`) is preserved — only the file content changes.

**Migration:** On first read, if `workspace-state.json` doesn't exist, fall back to reading `tabs.json` for backward compatibility. The old file is left in place (no cleanup needed).

### Decision 3: Global UI state file

Create `~/.config/Orqa/global-ui.json`:

```json
{
  "sidebarWidth": 260
}
```

**Rationale:** Sidebar width is a user preference, not a workspace property. Moving it to a global file prevents jarring width changes when switching workspaces. The `ui-store.ts` initializes from this file on launch and persists changes back.

### Decision 4: Workspace switching within a group (renderer flow)

```
User clicks workspace in dropdown
  │
  ├─ 1. Flush current workspace state to disk
  │     (tabs, activeTabId, expandedPaths, sidebarVisible)
  │
  ├─ 2. Cancel pending debounced saves
  │
  ├─ 3. Check in-memory workspace cache
  │     ├─ HIT:  swap cached state into stores
  │     └─ MISS: read workspace-state.json + readDir from disk
  │
  ├─ 4. Update stores:
  │     workspace-store: workspacePath, rootNodes, expandedPaths
  │     tab-store: tabs, activeTabId
  │
  ├─ 5. Restart chokidar watcher on new workspace path
  │
  └─ 6. Update activeWorkspace in group → persist to workspace-groups.json
```

The existing `openWorkspace` function in `App.tsx` is refactored into a `switchWorkspace` function that handles the cache check and expanded paths restore.

**Alternative considered:** Moving workspace switching to the main process — rejected because the renderer already owns the Zustand stores and the switching logic is tightly coupled to store updates.

### Decision 5: Lazy preload strategy

After the active workspace loads, idle-preload the next 2 inactive workspaces in the group:

```
App idle (2s after active workspace loaded)
  │
  └─ For each inactive workspace (up to 2, most recently used first):
       ├─ readDir(workspacePath) → cache rootNodes
       └─ read workspace-state.json → cache tabs + expandedPaths
```

Cache is a simple `Map<string, CachedWorkspaceState>` in the renderer, capped at 3 entries (LRU eviction). Cache entries are frozen snapshots — on switch, the snapshot is loaded into stores, then chokidar picks up any external changes.

**Rationale:** 2-3 cached workspaces keeps memory bounded (~20-30MB worst case). LRU eviction means the most-used workspaces stay warm. Stale cache is acceptable because chokidar reconciles within ~500ms of activation.

### Decision 6: Window ↔ Group mapping (main process)

Replace `windowWorkspacePaths: Map<number, string>` with `windowGroupMap: Map<number, string>` (windowId → groupId). The main process owns group CRUD and the menu. The renderer receives its groupId via IPC on init and uses it to load/save group state.

```
Main process:
  windowGroupMap: Map<windowId, groupId>

  IPC handlers:
    workspace-group:getForWindow → returns group data for current window
    workspace-group:addWorkspace → adds workspace path to group
    workspace-group:removeWorkspace → removes workspace path from group
    workspace-group:setActiveWorkspace → updates activeWorkspace in group
    workspace-group:getAll → returns all groups (for menu)
    workspace-group:create → creates new group + opens window
    workspace-group:open → opens existing group in new window (or focus if already open)
```

### Decision 7: Menu integration

Add to app menu under "File":

```
File
├── Open Workspace Group ▶
│   ├── Work                    ← opens/focuses window for this group
│   ├── Personal
│   ├── ─────────────
│   ├── New Group...            ← dialog: name + first folder
│   └── Manage Groups...        ← future: rename/delete (deferred)
├── ─────────────
├── Open Folder (⌘O)           ← now means "add workspace to current group"
└── ...
```

The menu is rebuilt whenever groups change (add/remove/rename).

### Decision 8: Window title format

Set window title to `"{GroupName} — {WorkspaceName}"` (e.g., "Work — frontend-app"). This differentiates windows in Cmd+` switching and the Dock.

### Decision 9: First launch experience

On first launch (no `workspace-groups.json`):
1. Show welcome screen as today
2. When user opens a folder, create a default group named after the folder (e.g., "my-project") containing that single workspace
3. This is transparent — user doesn't need to know about groups until they add a second workspace

Existing `recent-workspaces.json` continues to work independently for the system "Recent" menu.

## Risks / Trade-offs

- **[Stale preloaded cache]** → Mitigated by chokidar reconciliation on workspace activation. Tree may briefly show stale state then update. Acceptable UX tradeoff for instant switching.
- **[Deleted workspace in group]** → On switch, if `readDir` fails (folder doesn't exist), show error inline and offer to remove from group. Don't crash.
- **[Migration from single-workspace model]** → Backward compatible: if no `workspace-groups.json` exists, the app behaves as today. First folder open creates a group transparently. Old `tabs.json` files are read as fallback.
- **[Group file corruption]** → Wrap reads in try/catch with fallback to empty state. Groups file is small JSON — corruption risk is low.
- **[Many workspaces in one group]** → No hard limit, but dropdown gets unwieldy past ~10. Acceptable for v1 — search/filter can be added later.
- **[Window closed without saving]** → Electron's `closed` event in window-manager already fires cleanup. Add group state save to this path.
