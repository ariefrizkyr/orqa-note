## Context

The tab system uses a Zustand store (`tab-store.ts`) managing a flat `Tab[]` array with an `activeTabId`. Tabs are rendered by `TabBar.tsx` → `Tab.tsx`, with drag-and-drop reordering via native HTML drag events. Keyboard shortcuts live in `use-keyboard.ts` as a global `keydown` listener. Tab state persists to `workspace-state.json` via debounced IPC. Terminal tabs are managed separately in `use-terminal-tabs.ts` and are excluded from this change.

There is currently no right-click context menu on tabs, no concept of tab protection, and no zone-based ordering.

## Goals / Non-Goals

**Goals:**
- Let users pin editor tabs to protect them from accidental closure
- Pin-aware close behavior across all close vectors (Cmd+W, close button, middle-click, bulk close)
- Auto-sort pinned tabs to the left with zone-restricted drag-and-drop
- Right-click context menu on editor tabs for pin and close operations
- Persist pin state with existing workspace persistence mechanism

**Non-Goals:**
- Terminal tab pinning
- Tab groups or tab categories beyond pinned/unpinned
- Keyboard shortcut for pin/unpin toggle
- Cross-zone drag-to-pin/unpin behavior
- Visual separator line between pinned and unpinned zones (keep it minimal)

## Decisions

### 1. Pin state as a field on `Tab` interface

Add `isPinned?: boolean` to the existing `Tab` type in `shared/types.ts`.

**Why over a separate pinned set:** Co-locating pin state with the tab keeps serialization trivial — the existing `workspace-state.json` persistence works unchanged. A separate `Set<string>` would require syncing two data structures and a new persistence path.

### 2. Auto-sort enforcement in the store

When a tab is pinned, the store moves it to the end of the pinned zone (rightmost pinned position). When unpinned, it moves to the start of the unpinned zone (leftmost unpinned position). This keeps ordering deterministic.

**Why store-level enforcement over render-time sorting:** Sorting at render time would cause the `tabs[]` array order to diverge from visual order, breaking `Cmd+1-9` tab switching and drag-and-drop index tracking.

### 3. Zone-restricted drag-and-drop

Drag operations compute a boundary index (`pinnedCount`) and clamp drop targets to the appropriate zone. Pinned tabs can only drop at indices `0..pinnedCount-1`, unpinned at `pinnedCount..length-1`.

**Why over cross-zone drag:** Cross-zone drag introduces implicit pin/unpin on drop, which is surprising behavior and adds complexity to the drag handler. Explicit pin/unpin via context menu is clearer.

### 4. Close guard in the store, not the keyboard handler

`closeTab()` in the store checks `isPinned` and returns early if true. This protects all close vectors (keyboard, click, middle-click, bulk close) in one place rather than scattering guards.

**Why:** Single point of enforcement. The keyboard handler, Tab component close button, and middle-click handler all funnel through `closeTab()`.

### 5. Context menu as a simple component in Tab.tsx

Render a positioned `<div>` on right-click with menu items, managed by local React state (`contextMenuPosition`). Close on click-outside or Escape.

**Why over a shared context menu system:** This is the only context menu in the app currently. Building a generic context menu abstraction for a single use case would be premature. If more context menus are needed later, this can be extracted.

## Risks / Trade-offs

**[Risk] Pinned tabs accumulate and crowd the tab bar** → Users can unpin via context menu. No hard limit needed — this matches VS Code behavior.

**[Risk] `isPinned` field on existing persisted state** → `undefined` is falsy, so old workspace state files work without migration. Backward compatible by default.

**[Risk] Drag-and-drop zone boundary off-by-one** → Unit test the `reorderTabs` clamping logic with edge cases: drag to boundary, drag within single-item zone, all tabs pinned, no tabs pinned.

**[Trade-off] No visual separator between zones** → Keeping it minimal avoids visual clutter. The pin icon on pinned tabs and the close button on unpinned tabs provide enough visual differentiation. Can be added later if users find it confusing.
