## 1. IPC Layer — fs:copy handler

- [x] 1.1 Add `fs:copy` IPC handler in `fs-handlers.ts` using `cp()` from `fs/promises` with `{ recursive: true }`, validating both paths with `assertWithinWorkspace()`
- [x] 1.2 Expose `fs.copy` in `preload.ts` so the renderer can call `window.electronAPI.fs.copy(srcPath, destPath)`

## 2. Clipboard State & Context Menu Actions

- [x] 2.1 Add clipboard state (`{ sourcePath: string; operation: 'copy' | 'cut' } | null`) to `Sidebar.tsx`
- [x] 2.2 Update `ContextMenu.tsx` to accept a nullable `node` parameter — when null, return only creation actions (New File/Spreadsheet/Canvas/Bookmark/Folder), Paste (if clipboard non-empty), Refresh, Collapse All, Reveal in Finder
- [x] 2.3 Add Copy, Cut, Paste actions to the existing node context menu in `ContextMenu.tsx` — Copy and Cut set clipboard state, Paste calls `fs:copy` or `fs:move` based on operation type
- [x] 2.4 Pass clipboard state and clipboard setters (onCopy, onCut, onPaste) as callbacks through `getContextMenuActions` and wire them up in `Sidebar.tsx`

## 3. Empty-Space Context Menu

- [x] 3.1 Add `onContextMenu` handler to the `FileTree` container `<div>` that fires only when the click target is the container itself (not a child node)
- [x] 3.2 Pass a new `onEmptySpaceContextMenu` callback from `Sidebar.tsx` to `FileTree` that sets context menu state with `node: null`
- [x] 3.3 Update `Sidebar.tsx` context menu rendering to handle `node: null` — call `getContextMenuActions(null, ...)` targeting `workspacePath`
- [x] 3.4 Add Collapse All callback using `useWorkspaceStore.getState().collapseAll()` and wire it into the empty-space menu

## 4. Root-Level Inline File Input

- [x] 4.1 In `FileTree.tsx`, render `InlineFileInput` after all root nodes when `inlineCreate.path === workspacePath` (special case outside `renderNodes`)
- [x] 4.2 Pass `workspacePath` to `FileTree` as a prop so it can compare against `inlineCreate.path`

## 5. Drag-to-Root Drop Zone

- [x] 5.1 Add `onDragOver` and `onDrop` handlers to the `FileTree` container `<div>` — on drop, call `fs:move` to move the dragged node to `workspacePath`
- [x] 5.2 Add `e.stopPropagation()` in `FileTreeNode.handleDrop` when the drop is handled (node is a directory) to prevent bubbling to the container
- [x] 5.3 Add no-op guard: skip move if `dirname(draggedNode.path) === workspacePath` (already at root)
- [x] 5.4 Add visual feedback state (`isDragOverRoot`) to `FileTree` — apply subtle background highlight (`bg-neutral-800/50`) to the container div when dragging over empty space
- [x] 5.5 Pass `draggedNode` state and `setDraggedNode` up from `FileTree` or share via prop so the container drop handler can access the dragged node

## 6. Verification

- [x] 6.1 Manual test: right-click empty space → create file at root → verify file appears and opens in tab
- [x] 6.2 Manual test: copy file from subfolder → paste in empty-space menu → verify file copied to root
- [x] 6.3 Manual test: cut file from subfolder → paste on a folder → verify file moved
- [x] 6.4 Manual test: drag file from subfolder to empty space → verify moved to root with visual feedback
- [x] 6.5 Manual test: drag root-level file to empty space → verify no-op (no error, no duplicate)
