## Why

There's no keyboard shortcut to quickly copy the path of the currently active tab. Users must right-click in the sidebar and select "Copy Path" — which is slow and, for `.orqlnk` bookmark files, copies the file path instead of the bookmark URL (the value users actually want).

## What Changes

- Add `Cmd/Ctrl+Shift+C` keyboard shortcut to copy the path of the active tab
- For `.orqlnk` (bookmark) tabs, copy the bookmark URL instead of the file path
- Show a brief toast notification ("Path copied" / "URL copied") in the top-right corner
- Fix the sidebar context menu "Copy Path" for `.orqlnk` files to copy the URL instead of the file path, and relabel it to "Copy URL"
- Introduce a generic toast/snackbar component system for reuse across the app

## Capabilities

### New Capabilities
- `generic-toast`: A reusable toast notification system with configurable placement (top-right, bottom-right, etc.), auto-dismiss, and Zustand-based state management
- `shortcut`: Keyboard shortcuts for the app. Initially covers `Cmd/Ctrl+Shift+C` to copy the active tab's path (or URL for bookmarks) to the system clipboard with a confirmation toast

### Modified Capabilities
- `clipboard-operations`: The "Copy Path" context menu action for `.orqlnk` files changes to copy the bookmark URL instead of the file path, with the label changed to "Copy URL"

## Impact

- **Renderer hooks**: `use-keyboard.ts` gains a new shortcut handler
- **Renderer components**: New `Toast.tsx` component, mounted globally in `App.tsx`
- **Renderer stores**: New `toast-store.ts` Zustand store
- **Sidebar context menu**: `ContextMenu.tsx` modified for `.orqlnk` copy behavior
- **No main process changes**: Clipboard write uses `navigator.clipboard.writeText()` in renderer; context menu uses existing `readBookmark` IPC
