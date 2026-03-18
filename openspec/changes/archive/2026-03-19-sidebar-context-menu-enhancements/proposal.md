# Sidebar Context Menu Enhancements

## Problem

The sidebar file tree is missing several standard file-management interactions:

1. **No context menu on empty space** — Right-clicking the empty area below all nodes does nothing. Users expect to be able to create new files/folders at the workspace root from any empty sidebar space.

2. **No drag-to-root** — Files can be dragged *into* folders, but there's no way to drag a file *out* to the root level. The empty sidebar space doesn't act as a drop target.

3. **No copy/cut/paste** — The context menu lacks clipboard operations. Users expect to be able to copy, cut, and paste files/folders via right-click, which is a standard directory management interaction.

## Proposed Solution

### Feature 1: Empty-space context menu

- Add `onContextMenu` handler to the `FileTree` container `<div>`
- When right-clicking empty space (not on a node), show a reduced context menu targeting `workspacePath`:
  - New File, New Spreadsheet, New Canvas, New Bookmark, New Folder
  - Separator
  - Paste (if clipboard has content)
  - Separator
  - Refresh, Collapse All, Reveal in Finder
- Inline file input renders at the **bottom of root nodes** when creating at root level

### Feature 2: Drag-to-root (Approach B)

- The `FileTree` container `<div>` acts as a **fallback drop zone**
- Individual `FileTreeNode` drop handlers call `e.stopPropagation()` to prevent bubbling
- If a drop lands on empty space, the file is moved to `workspacePath` (root)
- Visual feedback: subtle background highlight (`bg-neutral-800/50`) on the container when dragging over empty space
- No-op if the file is already at root level (same parent directory)

### Feature 3: Copy/Cut/Paste in context menu

- Add **Copy**, **Cut**, **Paste** actions to the existing node context menu
- **Copy**: stores the source path + operation type ("copy") in renderer-side state (not OS clipboard — this is file-level copy)
- **Cut**: stores the source path + operation type ("cut") in renderer-side state
- **Paste**:
  - If "copy" → calls a new `fs:copy` IPC handler (copies file/folder to target directory)
  - If "cut" → calls existing `fs:move` IPC handler (moves file/folder to target directory)
  - Clears clipboard state after paste
- Paste appears in both node context menu (targets that folder/parent) and empty-space context menu (targets root)
- Paste is **disabled/hidden** when clipboard is empty

### IPC additions

- New `fs:copy` handler in `fs-handlers.ts` — copies a file or recursively copies a directory to a destination folder
  - Uses `cp` from `fs/promises` (Node 16.7+) with `{ recursive: true }`
  - Validates both paths are within workspace

## Scope

### In scope
- Empty-space right-click context menu with creation actions
- Drag files/folders to empty sidebar space to move to root
- Copy/Cut/Paste context menu actions on files and folders
- New `fs:copy` IPC handler
- Subtle drag-over visual feedback on the tree container

### Out of scope
- OS-level clipboard integration (copying files to/from Finder)
- Multi-select operations
- Keyboard shortcuts for copy/cut/paste (future enhancement)
- Duplicate file detection / conflict resolution (overwrite prompt)

## Files to modify

| File | Change |
|------|--------|
| `ContextMenu.tsx` | Add copy/cut/paste actions; support null node for empty-space menu |
| `FileTree.tsx` | Add container-level `onContextMenu`, `onDragOver`, `onDrop`; render root-level inline input |
| `FileTreeNode.tsx` | Add `e.stopPropagation()` in `handleDrop` |
| `Sidebar.tsx` | Handle empty-space context menu; manage clipboard state; pass new callbacks |
| `fs-handlers.ts` | Add `fs:copy` IPC handler |
| `preload.ts` | Expose `fs.copy` to renderer |

## Risks

- **File name conflicts on paste/move**: If a file with the same name exists at the destination. Mitigation: let the OS/fs error propagate and show an error, or append a suffix. Start simple — let it fail with an error log.
- **Large directory copy**: Recursive copy of large folders could be slow. Acceptable for v1 since it's user-initiated.
