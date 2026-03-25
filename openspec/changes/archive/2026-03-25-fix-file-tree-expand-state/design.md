## Context

The file tree sidebar uses two independent pieces of state: `expandedPaths: Set<string>` (which folders are open) and `rootNodes: FileNode[]` (the tree data with lazily-loaded `children`). The arrow indicator (▼/▶) is driven by `expandedPaths`, while child rendering requires `node.children` to be truthy. When `readDir` replaces a directory's children with fresh `FileNode` objects, those objects don't carry their own nested children — creating a desync where arrows say "expanded" but nothing renders.

This affects two flows:
1. **Collapse/re-expand parent**: `toggleExpanded` only removes the clicked path, leaving descendant paths in the Set. Re-expanding calls `readDir` on the parent, returning fresh child nodes with `children: undefined`.
2. **FS watcher re-reads**: When a file is deleted or changed, the watcher re-reads the parent directory, replacing its children with fresh nodes that lack nested children data.

## Goals / Non-Goals

**Goals:**
- Arrow direction always matches whether children are rendered (no visual desync)
- Re-expanding a parent restores nested expanded state without extra user clicks
- FS watcher updates don't cause apparent collapse of expanded subdirectories
- Guard against stale async results from rapid toggle clicks

**Non-Goals:**
- Changing the `expandedPaths` data structure or persistence format
- Adding recursive/deep `readDir` to the IPC layer
- Debouncing or throttling toggle clicks (generation counter is sufficient)
- Changing collapse-all behavior (already clears all paths correctly)

## Decisions

### Decision 1: Parallel fan-out reload of expanded descendants

When `handleToggle` re-expands a folder, collect all paths in `expandedPaths` that are descendants of the toggled path (via `startsWith(path + '/')`), then fire `readDir` for all of them in parallel using `Promise.all`. Apply results top-down (sorted by path depth) so that `updateNodeChildren` can find each parent in the tree.

**Why this over cleaning up expandedPaths on collapse (Strategy A):** Preserves the user's nested expanded state. The cost is bounded — parallel IPC calls complete in the same wall-clock time as one, and the count equals the number of user-expanded descendants (typically < 10).

**Why this over recursive readDir in the main process:** Keeps the IPC API unchanged. Each `readDir` is a single-directory listing — no new capability needed on the Electron side.

### Decision 2: Generation counter for stale result protection

A module-scoped counter increments on every `handleToggle` call. After the async `readDir` batch resolves, compare the captured generation to the current one. If they differ, discard the results silently.

**Why this over AbortController:** `electronAPI.fs.readDir` doesn't support abort signals, and adding that would require IPC layer changes for negligible benefit (local FS reads complete in microseconds).

### Decision 3: One-level descendant reload in FS event handler

When the FS watcher re-reads a parent directory, check if any of the returned directory nodes have paths in `expandedPaths`. If so, fire `readDir` for those in parallel and update their children. Only one level deep — the watcher event is localized to a specific directory.

**Why only one level:** FS events target a specific directory. If deeper descendants need refreshing, their own watchers will fire separate events. One level catches the common case (parent re-read wipes direct child's loaded children).

## Risks / Trade-offs

- **[Risk] Many expanded descendants** → Mitigated by parallel execution; bounded by manual user expansion (realistically < 20 paths). Each `readDir` is ~1-5ms local IO.
- **[Risk] Rapid toggle creates wasted readDir calls** → Mitigated by generation counter discarding stale results. No memory leak — promises resolve and are GC'd.
- **[Risk] Top-down sort adds complexity** → Minimal — it's a single `.sort()` by path segment count before a synchronous loop of store updates.
- **[Trade-off] FS handler does extra readDir calls** → Typically 0-2 extra calls per event. Acceptable for correctness. These are the same calls that would happen if the user manually re-expanded.
