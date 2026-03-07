## Context

The app has a fixed sidebar (`Sidebar.tsx`) rendered in `App.tsx` alongside the content area. The sidebar width is managed in `ui-store.ts` (Zustand) and persisted per workspace in saved tab state. There is no mechanism to hide/show the sidebar.

## Goals / Non-Goals

**Goals:**
- Allow users to toggle sidebar visibility via keyboard shortcut (Cmd/Ctrl+B) and a UI toggle button
- Persist sidebar visibility state per workspace
- Smooth, instant toggle (no animation needed for v1)
- VS Code-style layout: full-width titlebar above sidebar + content area

**Non-Goals:**
- Animated slide-in/slide-out transitions
- Collapsing to an icon-only sidebar mode

## Decisions

### 1. State management: Add `sidebarVisible` to existing `ui-store`

Add a boolean `sidebarVisible` (default `true`) and `toggleSidebar` action to the existing `useUIStore`. This keeps all sidebar-related state co-located.

**Alternative considered:** Separate store for sidebar visibility. Rejected because it would fragment related state across stores unnecessarily.

### 2. Rendering approach: Conditional render in App.tsx

When `sidebarVisible` is `false`, skip rendering `<Sidebar>` and the resize handle entirely. The content area naturally takes full width since it uses `flex-1`.

**Alternative considered:** CSS `display: none` or width-0 approach. Rejected because conditional render is simpler and avoids hidden DOM nodes processing events.

### 3. Layout restructure: Full-width titlebar

Restructured from sidebar-spanning-full-height to a VS Code-style layout:
- Full-width titlebar (`h-11`, `data-drag`) at the top, spanning the entire window width alongside the macOS traffic lights
- Sidebar and content area rendered below the titlebar in a horizontal flex row
- Toggle button placed at the right end of the titlebar, using the existing `[data-drag] button` CSS rule for clickability

This avoids the native Electron `hiddenInset` titlebar drag zone issue — buttons placed directly in the native titlebar area cannot override the drag behavior, but buttons inside a `data-drag` container are automatically made clickable via the CSS rule `[data-drag] button { -webkit-app-region: no-drag }`.

**Alternative considered:** Placing the toggle button as an absolute-positioned overlay in the native titlebar area. Rejected because the native Electron drag zone cannot be overridden by CSS `-webkit-app-region: no-drag` on individual elements.

### 4. Keyboard shortcut: Cmd/Ctrl+B

This is the standard shortcut used by VS Code and most editors for sidebar toggle. Register in the existing `use-keyboard.ts` hook. Guarded to skip when focus is inside a `contenteditable` or CodeMirror editor so it doesn't conflict with bold formatting.

### 5. Persistence: Include in saved tab state

Add `sidebarVisible` alongside `sidebarWidth` in the workspace state that's already saved/restored via IPC (`debouncedSaveTabState` / `tabs.getState`).

### 6. Native macOS app menu

Added a native app menu with File > Open Folder... (Cmd+O) to replace the folder icon button that was removed from WorkspaceHeader. The menu sends a `menu:open-folder` IPC event to the renderer, which is forwarded as a `workspace:open` DOM custom event via the preload script.

## Risks / Trade-offs

- [Shortcut conflict] Cmd+B may conflict with bold formatting in the WYSIWYG editor → Mitigation: The keyboard hook checks `e.target` for `contenteditable` and `.cm-editor` and skips the toggle when inside an editor.
- [State sync] If sidebar is hidden when workspace is saved, reopening restores hidden sidebar → Acceptable behavior, user chose to hide it.
- [Scroll position] Conditional render unmounts the sidebar component, losing scroll position → Accepted for v1. Workspace store preserves expanded paths, so file tree structure is maintained.
