## Why

When a user expands nested folders (e.g., A → B → C), collapses the parent, and re-expands it, the subfolder arrows show ▼ (expanded) but no children render — because `expandedPaths` retains descendant paths while `readDir` returns fresh nodes without loaded children. The same desync occurs when deleting an item in a deeply nested folder, causing apparent collapse of parent directories. Both bugs stem from `expandedPaths` and `node.children` falling out of sync after directory re-reads.

## What Changes

- When re-expanding a folder, eagerly reload children for all descendant paths still in `expandedPaths` using parallel `readDir` calls, so the visual state (arrow) matches the data state (loaded children)
- When the FS watcher re-reads a directory, also reload children for any expanded subdirectories within the refreshed node set
- Add a generation counter guard to `handleToggle` to prevent stale async results from overwriting fresh data during rapid expand/collapse clicks

## Capabilities

### New Capabilities

- `eager-subtree-reload`: When a directory is re-expanded or refreshed by the FS watcher, all descendant paths still marked as expanded are eagerly reloaded in parallel, keeping arrow indicators and rendered children in sync

### Modified Capabilities

- `file-tree-sidebar`: Collapse/expand behavior changes — re-expanding a parent now restores nested expanded state with loaded children instead of showing stale arrow indicators
- `expanded-paths-persistence`: No spec-level change, but the restored expanded paths will now correctly reload nested children on re-expand

## Impact

- `apps/desktop/src/renderer/components/sidebar/FileTree.tsx` — `handleToggle` gains parallel descendant reload + generation counter
- `apps/desktop/src/renderer/hooks/use-fs-events.ts` — FS event handler gains one-level descendant reload for expanded subdirectories
- `apps/desktop/src/renderer/stores/workspace-store.ts` — no changes expected (existing API sufficient)
