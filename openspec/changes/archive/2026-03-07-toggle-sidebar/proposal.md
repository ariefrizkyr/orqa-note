## Why

Users need to maximize their content editing area when working with documents. Currently the sidebar is always visible when a workspace is open, consuming horizontal space. A toggle mechanism lets users hide the sidebar to focus on content and restore it when navigating files.

## What Changes

- Add a `sidebarVisible` state to the UI store with a `toggleSidebar` action
- Restructure layout to VS Code-style: full-width titlebar above sidebar + content area
- Add a toggle button in the titlebar (right side) with visual state indicator
- Add a keyboard shortcut (Cmd/Ctrl+B) to toggle the sidebar, with editor conflict guard
- Persist sidebar visibility in the saved tab/workspace state
- Add native macOS app menu with File > Open Folder... (replaces folder icon in sidebar header)
- Remove the new tab (+) button from the TabBar

## Capabilities

### New Capabilities
- `toggle-sidebar`: Ability to show/hide the file tree sidebar via UI toggle button, keyboard shortcut, or programmatic toggle

### Modified Capabilities
- `file-tree-sidebar`: The sidebar now supports a collapsed/hidden state controlled by the UI store. Folder icon removed from header (moved to native File menu).

## Impact

- `apps/desktop/src/renderer/stores/ui-store.ts` - New `sidebarVisible` state and actions
- `apps/desktop/src/renderer/App.tsx` - VS Code-style layout with titlebar, conditional sidebar rendering
- `apps/desktop/src/renderer/hooks/use-keyboard.ts` - Cmd/Ctrl+B shortcut with editor guard
- `apps/desktop/src/renderer/components/sidebar/Sidebar.tsx` - Removed `onOpenFolder` prop
- `apps/desktop/src/renderer/components/sidebar/WorkspaceHeader.tsx` - Removed folder icon button and `onOpenFolder` prop, removed `pt-11` traffic light padding
- `apps/desktop/src/renderer/components/tabs/TabBar.tsx` - Removed new tab (+) button
- `apps/desktop/src/shared/types.ts` - Added `sidebarVisible` to `WorkspaceState`
- `apps/desktop/src/main/services/app-menu.ts` - New native macOS app menu
- `apps/desktop/src/main/index.ts` - Registers app menu on startup
- `apps/desktop/src/preload/index.ts` - Forwards `menu:open-folder` IPC to renderer
