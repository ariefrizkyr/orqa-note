# Phase 1: Tasks

## Week 1: Monorepo Scaffolding + Electron Shell

### Task 1.1: Initialize monorepo
- [x] Initialize git repo
- [x] Create `pnpm-workspace.yaml` with `apps/*` and `packages/*`
- [x] Root `package.json` with workspace scripts (dev, build, lint)
- [x] Root `tsconfig.base.json` with shared compiler options
- [x] `.gitignore` (node_modules, dist, out, .DS_Store, userData)
- [x] `.npmrc` with `shamefully-hoist=true` (needed for Electron)

### Task 1.2: Scaffold Electron app with electron-vite
- [x] `apps/desktop/package.json` with Electron 33+, React 18, TypeScript
- [x] `apps/desktop/electron.vite.config.ts` — main/renderer/preload entries
- [x] Main process entry (`src/main/index.ts`) — creates BrowserWindow
- [x] Preload script (`src/preload/index.ts`) — contextBridge skeleton
- [x] Renderer entry (`src/renderer/index.html`, `main.tsx`, `App.tsx`)
- [x] Tailwind CSS v4 setup in renderer
- [x] Verify `pnpm dev` launches Electron with React + HMR

### Task 1.3: Welcome screen
- [x] `WelcomeScreen.tsx` — centered layout with app name, tagline, "Open Folder" button
- [x] Wire "Open Folder" to IPC → main process `dialog.showOpenDialog` (directory)
- [x] Recent workspaces list — read from `userData/recent-workspaces.json`
- [x] Click recent workspace → open that folder
- [x] Store opened folder paths in recent list (max 10, deduped)
- [x] Show welcome screen when no workspace is open

### Task 1.4: App layout shell
- [x] Three-panel layout: sidebar (left), tab bar (top), content area (center), status bar (bottom)
- [x] Sidebar resizable with drag handle (min 200px, max 400px)
- [x] Status bar component with workspace name
- [x] Zustand stores: `workspace-store`, `tab-store`, `ui-store`

## Week 2: File System + Sidebar

### Task 2.1: fs-watcher package
- [x] `packages/fs-watcher/` — wraps chokidar
- [x] API: `watch(rootPath)` → EventEmitter with `add`, `change`, `unlink`, `addDir`, `unlinkDir`
- [x] Debounce rapid events (100ms)
- [x] Ignore patterns: `node_modules`, `.git`, `.DS_Store`
- [x] Lazy watching: only watch expanded directories
- [x] Cleanup: `unwatch()` and `close()` methods

### Task 2.2: File tree in sidebar
- [x] IPC handler: `fs:readDir(path)` → returns `FileNode[]` for one directory level
- [x] `FileTree.tsx` — recursive tree component with expand/collapse
- [x] `FileTreeNode.tsx` — single node: icon + name + expand chevron (dirs) or click-to-open (files)
- [x] File type icons by extension (`.md`, `.orqa`, `.csv`, `.xlsx`, `.pdf`, `.docx`, `.mmd`, `.excalidraw`, `.drawio`)
- [x] Unsupported files shown greyed out — double-click opens in system default app
- [x] Real-time sync: subscribe to fs-watcher events, update tree incrementally
- [x] `WorkspaceHeader.tsx` — folder name, "Open Folder" button for switching

### Task 2.3: Sidebar context menu
- [x] Right-click on file/folder → native context menu via Electron `Menu`
- [x] Actions: New File, New Folder, Rename, Delete, Reveal in Finder, Copy Path
- [x] New File/Folder: prompt for name → create on disk via IPC
- [x] Rename: inline edit in tree → rename on disk via IPC
- [x] Delete: confirmation dialog → move to trash via `shell.trashItem`
- [x] Reveal in Finder: `shell.showItemInFolder`
- [x] Copy Path: `clipboard.writeText`

### Task 2.4: Drag and drop reorder
- [x] Drag files/folders within sidebar to reorder/move
- [x] Visual feedback: drop indicator line between items, highlight target folder
- [x] On drop: `fs.rename` to move file/folder on disk
- [x] Update tree state after move

### Task 2.5: Fuzzy search (Cmd+K)
- [x] `FuzzySearch.tsx` — modal overlay with search input
- [x] Collect all file paths in workspace (recursive, cached)
- [x] Fuzzy match against file names using `fuse.js`
- [x] Show results with file path, icon, and extension
- [x] Enter/click → open file as tab
- [x] Escape → close search
- [x] Keyboard shortcut registration: `Cmd+K` toggle

## Week 3: Tab System + WebContentsView

### Task 3.1: Tab bar component
- [x] `TabBar.tsx` — horizontal scrollable tab strip
- [x] `Tab.tsx` — label, type-colored dot, close button (×)
- [x] Click tab → switch active tab
- [x] Close tab → remove from store, cleanup WebContentsView if bookmark
- [x] Middle-click → close tab
- [x] `+` button → open New Tab screen
- [x] Tab deduplication: clicking sidebar item for already-open file switches to existing tab
- [x] Tab keyboard shortcuts: `Cmd+W`, `Cmd+1-9`, `Cmd+Tab`, `Cmd+Shift+Tab`
- [x] Drag to reorder tabs

### Task 3.2: Tab persistence
- [x] On tab change (open/close/reorder): serialize tab state to `userData/workspaces/<hash>/tabs.json`
- [x] Debounce serialization (1 second)
- [x] On app launch with known workspace: restore tabs from JSON
- [x] Restore scroll positions for content tabs
- [x] Handle missing files gracefully (file deleted while app was closed → show "file not found" state)

### Task 3.3: Content area routing
- [x] `ContentArea.tsx` — renders correct viewer based on active tab type
- [x] File tab + `.md` extension → `MarkdownPreview.tsx`
- [x] File tab + unsupported extension → "Open in default app" prompt
- [x] Bookmark tab → empty div (WebContentsView renders on top)
- [x] New Tab tab → `NewTabScreen.tsx`
- [x] No tab → welcome/empty state

### Task 3.4: Markdown preview (read-only)
- [x] `MarkdownPreview.tsx` — renders `.md` files using `react-markdown` + `remark-gfm`
- [x] Read file content via IPC: `fs:readFile(path)` → string
- [x] GFM support: tables, task lists, strikethrough, fenced code blocks
- [x] Basic syntax highlighting in code blocks (`rehype-highlight` or `shiki`)
- [x] Scroll position persistence per tab

### Task 3.5: .orqa bookmark parsing
- [x] IPC handler: `fs:readBookmark(path)` → parses `.orqa` JSON file
- [x] Validate schema: `{ type, url, label, service }`
- [x] Sidebar: show bookmark with service-colored chip (green Sheets, blue Docs, orange Figma)
- [x] Click bookmark → open as webview tab

### Task 3.6: WebContentsView manager
- [x] `webcontents-manager.ts` in main process
- [x] `create(url, partition, bounds)` → creates WebContentsView, attaches to window
- [x] `show(id)` → sets bounds and makes visible, hides all others
- [x] `hide(id)` → hides the view
- [x] `destroy(id)` → removes and cleans up
- [x] `resize(id, bounds)` → update bounds on window resize
- [x] Session partition: `persist:orqa-<workspace-hash>` — preserves cookies/login
- [x] Handle window resize → recalculate content area bounds → resize active WebContentsView
- [x] Security: disable `nodeIntegration`, enable `contextIsolation` on all views

### Task 3.7: Webview toolbar
- [x] `WebviewToolbar.tsx` — shown above WebContentsView content for bookmark tabs
- [x] Display: bookmark label + service icon
- [x] Buttons: Reload, Open in Browser (opens URL in default browser via `shell.openExternal`)
- [x] URL display (read-only, shows current URL of the webview)

### Task 3.8: New Tab screen
- [x] `NewTabScreen.tsx` — grid of file type cards
- [x] Cards: Markdown (.md), Spreadsheet (.csv), Diagram (Mermaid), Bookmark (add URL)
- [x] Click card → create new file in workspace root (prompt for name) or add bookmark
- [x] Add Bookmark flow: input URL + label + select service → create `.orqa` file on disk
