## 1. Generic Toast System

- [x] 1.1 Create `toast-store.ts` Zustand store with `showToast({ message, placement, duration? })` action, auto-dismiss via setTimeout, and single-toast-at-a-time behavior
- [x] 1.2 Create `Toast.tsx` component that reads from toast store, renders at configured placement (top-right/top-left/bottom-right/bottom-left), uses dark neutral styling (`bg-neutral-900`, `text-neutral-100`, rounded, shadow)
- [x] 1.3 Mount `Toast` component in `App.tsx`

## 2. Copy Path Shortcut

- [x] 2.1 Add `Cmd/Ctrl+Shift+C` handler in `use-keyboard.ts` — get active tab, copy `filePath` for file tabs or `bookmarkUrl` for bookmark tabs via `navigator.clipboard.writeText()`, silent no-op for new-tab or no active tab
- [x] 2.2 Trigger toast from the shortcut handler — "Path copied" for file tabs, "URL copied" for bookmark tabs, placement top-right, duration 2s

## 3. Context Menu Fix

- [x] 3.1 Modify "Copy Path" action in `ContextMenu.tsx` — detect `.orqlnk` extension on the node, change label to "Copy URL", make action async to read bookmark via `readBookmark` IPC and copy the URL to clipboard, fall back to file path on read failure
