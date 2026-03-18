## Context

The sidebar file tree currently supports right-click context menus and drag-and-drop, but only on individual `FileTreeNode` elements. The empty space in the sidebar is inert — no context menu, no drop target. Additionally, the context menu lacks standard clipboard operations (copy/cut/paste) that users expect from a file manager.

Key files involved:
- `Sidebar.tsx` — orchestrates context menu state, inline creation, and rename
- `FileTree.tsx` — renders the tree, handles drag state, inline file creation
- `FileTreeNode.tsx` — individual node with drag/drop, click, and context menu handlers
- `ContextMenu.tsx` — defines context menu actions given a `FileNode`
- `fs-handlers.ts` — IPC handlers for filesystem operations (no copy handler exists yet)

Current architecture: context menu state (`{ x, y, node }`) lives in `Sidebar.tsx`. The `node` field is always a `FileNode`, making empty-space menus impossible without making it nullable.

## Goals / Non-Goals

**Goals:**
- Right-click on any empty sidebar space shows a context menu targeting workspace root
- Drag files/folders to empty sidebar space to move them to the root directory
- Add Copy, Cut, Paste actions to all context menus (node and empty-space)
- Maintain consistency with existing UX patterns (subtle visual feedback, inline inputs)

**Non-Goals:**
- OS-level clipboard integration (dragging files to/from Finder)
- Multi-select file operations
- Keyboard shortcuts (Cmd+C/X/V) for sidebar clipboard
- File conflict resolution on paste (will fail with error in v1)
- Undo/redo for file operations

## Decisions

### 1. Context menu state: nullable node

Make the context menu state `{ x, y, node: FileNode | null }`. When `node` is null, the menu targets `workspacePath`. This is simpler than creating a separate menu system — `getContextMenuActions` just branches on whether `node` is provided.

**Alternative considered**: Synthetic root `FileNode`. Rejected because it adds a fake node to represent the workspace, complicating type safety and tree logic.

### 2. Clipboard state: renderer-side, in Sidebar.tsx

Store clipboard state as `{ sourcePath: string; operation: 'copy' | 'cut' } | null` in `Sidebar.tsx` via `useState`. This is scoped to the app session — closing the app clears it.

**Alternative considered**: OS clipboard via `electron.clipboard`. Rejected because OS clipboard deals with text/files at the OS level, which would require complex integration with Finder and is out of scope.

**Alternative considered**: Zustand store. Unnecessary — clipboard is only consumed by context menu callbacks, all of which are defined in `Sidebar.tsx`.

### 3. Drop zone: container-level fallback with stopPropagation

The `FileTree` container `<div>` gets `onDragOver` and `onDrop` handlers. `FileTreeNode.handleDrop` calls `e.stopPropagation()` so folder drops don't bubble to the container. If a drop reaches the container, the file moves to `workspacePath`.

This avoids adding a separate "drop zone" element and reuses the existing drag-and-drop infrastructure.

### 4. fs:copy IPC handler using Node's cp()

New `fs:copy` handler uses `cp()` from `fs/promises` (available since Node 16.7) with `{ recursive: true }`. This handles both files and directories in one call.

**Path validation**: Both source and destination are validated with `assertWithinWorkspace()`, same as all other fs handlers.

### 5. Root-level inline input placement

When `inlineCreate.path === workspacePath`, the `InlineFileInput` renders **after** all root nodes in the `FileTree` component. This is a special case check outside the `renderNodes` loop.

### 6. No-op guard for same-location drops

When dragging a root-level file to empty space, check if `dirname(draggedNode.path) === workspacePath`. If true, skip the move. This prevents unnecessary fs operations and potential errors.

## Risks / Trade-offs

**File name conflicts on paste** → v1 lets the fs error propagate. The `fs:copy`/`fs:move` call will throw if a file with the same name exists. Future enhancement: detect conflicts and prompt user or auto-suffix. Mitigation: catch errors in the paste handler and log to console.

**Large recursive directory copy could be slow** → Acceptable for user-initiated action. No progress indicator in v1. Mitigation: could add async progress in a future iteration.

**stopPropagation in FileTreeNode.handleDrop** → Changes event bubbling behavior. Low risk since no other ancestor handlers depend on drop events from file nodes. Mitigation: only call `stopPropagation` when the drop is actually handled (node is a directory).

**Cut without paste loses the visual state** → If a user cuts a file, the clipboard state exists but there's no visual indicator that a file is "cut" (e.g., dimmed opacity). v1 accepts this. Future enhancement: pass clipboard state down to `FileTreeNode` and dim cut files.
