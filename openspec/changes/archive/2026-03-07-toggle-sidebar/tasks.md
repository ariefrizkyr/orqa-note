## 1. UI Store

- [x] 1.1 Add `sidebarVisible` boolean (default `true`) and `toggleSidebar` action to `useUIStore` in `ui-store.ts`

## 2. App Layout

- [x] 2.1 Update `App.tsx` to conditionally render `<Sidebar>` and the resize handle based on `sidebarVisible` state
- [x] 2.2 Ensure content area expands to full width when sidebar is hidden (verify `flex-1` handles this)

## 3. Keyboard Shortcut

- [x] 3.1 Add Cmd/Ctrl+B shortcut in `use-keyboard.ts` to call `toggleSidebar`, with guard to skip when focus is inside an editor content area

## 4. State Persistence

- [x] 4.1 Include `sidebarVisible` in the saved workspace state in `App.tsx` (`debouncedSaveTabState` and `flushSaveTabState` calls)
- [x] 4.2 Restore `sidebarVisible` from saved state when opening a workspace (in the `openWorkspace` callback)
- [x] 4.3 Add `sidebarVisible` to the shared types for saved tab state if applicable
