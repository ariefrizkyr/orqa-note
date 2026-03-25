## 1. Data Model

- [x] 1.1 Add `isPinned?: boolean` field to the `Tab` interface in `shared/types.ts`

## 2. Store Logic

- [x] 2.1 Add `pinTab(id)` and `unpinTab(id)` actions to `tab-store.ts` that toggle `isPinned` and auto-sort the tab to the correct zone position
- [x] 2.2 Guard `closeTab(id)` to return early if the tab is pinned
- [x] 2.3 Add `closeAllTabs()` action that closes all unpinned tabs, skipping pinned ones
- [x] 2.4 Add `closeOtherTabs(id)` action that closes all unpinned tabs except the given tab, skipping pinned ones
- [x] 2.5 Add `closeTabsToTheRight(id)` action that closes unpinned tabs to the right of the given tab, skipping pinned ones
- [x] 2.6 Update `reorderTabs(fromIndex, toIndex)` to clamp moves within zone boundaries (pinned zone: `0..pinnedCount-1`, unpinned zone: `pinnedCount..length-1`)

## 3. Tab Component

- [x] 3.1 Update `Tab.tsx` to render a pin icon in place of the close button when `isPinned` is true
- [x] 3.2 Suppress close-on-hover and middle-click close behavior for pinned tabs
- [x] 3.3 Add right-click context menu to `Tab.tsx` with: Pin/Unpin Tab, Close Tab (disabled if pinned), Close Others, Close All, Close to the Right
- [x] 3.4 Implement context menu dismiss on outside click and Escape key

## 4. Tab Bar

- [x] 4.1 Update `TabBar.tsx` drag-and-drop to enforce zone-restricted reordering — block cross-zone drops by clamping the drop index

## 5. Keyboard Shortcuts

- [x] 5.1 Update `use-keyboard.ts` Cmd+W handler to check `isPinned` on the active tab before calling `closeTab()` (or rely on the store guard from task 2.2)
