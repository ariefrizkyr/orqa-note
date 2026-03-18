## Context

The app currently handles keyboard shortcuts via a React `useEffect` keydown listener in `use-keyboard.ts`. The tab store (Zustand) holds the active tab with `filePath` for file tabs and `bookmarkUrl` for bookmark tabs. The sidebar context menu has a "Copy Path" action that always copies the file system path, even for `.orqlnk` bookmark files.

There is no generic toast/snackbar system — only a purpose-built `UpdateToast` component for auto-update notifications.

## Goals / Non-Goals

**Goals:**
- Add `Cmd/Ctrl+Shift+C` shortcut to copy active tab path/URL
- Build a reusable toast notification system
- Fix context menu "Copy Path" for `.orqlnk` files to copy URL

**Non-Goals:**
- Replacing the existing `UpdateToast` with the generic toast (can be done later)
- Adding toast animations or stacking (keep it simple for now)
- Adding the shortcut to the Electron app menu / menu bar accelerators

## Decisions

### Clipboard access: `navigator.clipboard.writeText()` in renderer
The shortcut handler already has `tab.bookmarkUrl` and `tab.filePath` in memory via the tab store. Using the Web Clipboard API directly avoids an IPC round-trip to main process. The existing `fs.copyPath` IPC remains untouched for other uses.

**Alternative considered**: Adding a generic `copyToClipboard` IPC handler. Rejected — unnecessary complexity for a value already available in the renderer.

### Context menu `.orqlnk` handling: async `readBookmark` then clipboard write
The context menu only has a `FileNode` (no `bookmarkUrl`). For `.orqlnk` files, the action reads the bookmark file via the existing `readBookmark` IPC to extract the URL, then writes it to clipboard. The action is already allowed to be async (the Delete action uses async).

**Alternative considered**: Passing `bookmarkUrl` through to the context menu. Rejected — would require changing `FileNode` type and sidebar data flow for a single use case.

### Toast architecture: Zustand store + single render point
A `toast-store.ts` holds the current toast state (`message`, `placement`, `duration`). A `Toast` component reads from the store and renders. Mounted once in `App.tsx`. Only one toast visible at a time (new toast replaces previous). Auto-dismiss via `setTimeout` in the store action.

**Alternative considered**: React context + portal. Rejected — Zustand is the established pattern in this codebase, and a store-based approach is simpler.

### No editor guard on shortcut
`Cmd+Shift+C` works everywhere, including inside Monaco and contenteditable areas. Unlike `Cmd+B` (toggle sidebar), there's no native behavior for `Cmd+Shift+C` that would conflict in these contexts.

## Risks / Trade-offs

- **[Toast replaces, doesn't stack]** → Acceptable for v1. Copy confirmations are fleeting — stacking adds complexity with no real UX gain.
- **[Context menu readBookmark is async I/O]** → The file is local and tiny (JSON). Latency is negligible. If the read fails (corrupted `.orqlnk`), fall back to copying the file path silently.
