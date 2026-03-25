## Why

Users accidentally close important tabs with `Cmd+W` and have to reopen them manually. Pinned tabs — a pattern established by VS Code and browsers — let users protect specific tabs from accidental closure, keeping frequently-used files always accessible.

## What Changes

- Add the ability to **pin editor tabs** via right-click context menu
- Pinned tabs **cannot be closed** by `Cmd+W`, close button, Close All, Close Others, or Close to the Right
- Pinned tabs are **auto-sorted to the left** of the tab bar, visually separated from unpinned tabs
- Pinned tabs show a **pin icon in place of the close button**, with the file label still visible
- Introduce a **right-click context menu** on editor tabs with: Pin/Unpin, Close Tab, Close Others, Close All, Close to the Right
- **Drag-and-drop is zone-restricted**: pinned tabs reorder within the pinned zone, unpinned within the unpinned zone — no cross-zone dragging
- Pin state is **persisted** as part of existing workspace state

## Capabilities

### New Capabilities
- `pin-tab`: Pinning/unpinning editor tabs, pin-aware close behavior, auto-sort ordering, and pin state persistence
- `tab-context-menu`: Right-click context menu on editor tabs with pin and bulk-close actions

### Modified Capabilities
- `tab-system`: Close tab behavior changes — `Cmd+W`, close button, and bulk close operations now skip pinned tabs

## Impact

- `shared/types.ts` — `Tab` interface gains `isPinned` field
- `tab-store.ts` — new actions (pin, unpin, bulk close) and close guard logic
- `Tab.tsx` — pin icon rendering, context menu, hide close button when pinned
- `TabBar.tsx` — zone-restricted drag-and-drop, visual separator
- `use-keyboard.ts` — `Cmd+W` respects pinned state
- `workspace-state.json` — schema gains `isPinned` per tab (backward compatible, defaults to `false`)
