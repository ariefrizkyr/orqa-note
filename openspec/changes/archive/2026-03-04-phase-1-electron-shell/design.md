# Phase 1: Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Main Process                    │
│                                                              │
│  ┌──────────────┐                    ┌──────────────────┐  │
│  │  WindowMgr   │                    │   IPC Router     │  │
│  │              │                    │                   │  │
│  │ - createWin  │                    │ - fs:readDir     │  │
│  │ - restore    │                    │ - fs:watch       │  │
│  │   state      │                    │ - fs:create      │  │
│  │ - webviewTag │                    │ - fs:rename      │  │
│  └──────────────┘                    │ - fs:delete      │  │
│                                       │ - tabs:persist   │  │
│  ┌──────────────┐  ┌──────────────┐  │ - wv:openExt     │  │
│  │  FSWatcher   │  │  StatePersist│  │ - wv:getPartition│  │
│  │  (chokidar)  │  │  (userData)  │  │ - workspace:open │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │ IPC (contextBridge)
┌─────────────────────────────────────────────────────────────┐
│                   Electron Renderer Process                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    React App                          │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │              Tab Bar Component                   │ │   │
│  │  │  [PRD.md] [Metrics.orqa] [Flow.md] [+]         │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  ┌───────────┐  ┌──────────────────────────────────┐ │   │
│  │  │  Sidebar  │  │         Main Content Area        │ │   │
│  │  │           │  │                                   │ │   │
│  │  │  workspace│  │  - Welcome screen                │ │   │
│  │  │  header   │  │  - MD preview (read-only)        │ │   │
│  │  │           │  │  - New Tab screen                │ │   │
│  │  │  file     │  │  - Bookmark webview (<webview>    │ │   │
│  │  │  tree     │  │    tag rendered inline as DOM    │ │   │
│  │  │           │  │    element in React tree)        │ │   │
│  │  │  search   │  │                                   │ │   │
│  │  └───────────┘  └──────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │              Status Bar                          │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
orqa-note/
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── main/
│       │   │   ├── index.ts                 ← App entry, window creation
│       │   │   ├── ipc/
│       │   │   │   ├── fs-handlers.ts       ← File system IPC handlers
│       │   │   │   ├── workspace-handlers.ts← Open/switch workspace
│       │   │   │   ├── tab-handlers.ts      ← Tab state persistence
│       │   │   │   └── webview-handlers.ts  ← openExternal + getPartition
│       │   │   ├── services/
│       │   │   │   ├── fs-watcher.ts        ← chokidar integration
│       │   │   │   ├── state-persistence.ts ← JSON read/write in userData
│       │   │   │   └── recent-workspaces.ts ← Track opened folders
│       │   │   └── lib/
│       │   │       └── file-icons.ts        ← Extension → icon mapping
│       │   ├── renderer/
│       │   │   ├── index.html
│       │   │   ├── main.tsx                 ← React entry
│       │   │   ├── App.tsx                  ← Root layout
│       │   │   ├── components/
│       │   │   │   ├── sidebar/
│       │   │   │   │   ├── Sidebar.tsx
│       │   │   │   │   ├── FileTree.tsx
│       │   │   │   │   ├── FileTreeNode.tsx
│       │   │   │   │   ├── WorkspaceHeader.tsx
│       │   │   │   │   └── ContextMenu.tsx
│       │   │   │   ├── tabs/
│       │   │   │   │   ├── TabBar.tsx
│       │   │   │   │   ├── Tab.tsx
│       │   │   │   │   └── NewTabScreen.tsx
│       │   │   │   ├── content/
│       │   │   │   │   ├── ContentArea.tsx  ← Routes to correct viewer
│       │   │   │   │   └── MarkdownPreview.tsx ← Read-only MD render
│       │   │   │   ├── welcome/
│       │   │   │   │   └── WelcomeScreen.tsx
│       │   │   │   ├── search/
│       │   │   │   │   └── FuzzySearch.tsx  ← Cmd+K modal
│       │   │   │   ├── statusbar/
│       │   │   │   │   └── StatusBar.tsx
│       │   │   │   └── webview/
│       │   │   │       └── WebviewToolbar.tsx
│       │   │   ├── stores/
│       │   │   │   ├── workspace-store.ts   ← Current folder, file tree
│       │   │   │   ├── tab-store.ts         ← Open tabs, active tab
│       │   │   │   └── ui-store.ts          ← Sidebar width, search open
│       │   │   ├── hooks/
│       │   │   │   ├── use-fs-events.ts     ← Subscribe to FS changes
│       │   │   │   └── use-keyboard.ts      ← Global keyboard shortcuts
│       │   │   ├── lib/
│       │   │   │   ├── ipc.ts              ← Typed IPC invoke wrappers
│       │   │   │   └── file-utils.ts       ← Path helpers, extension checks
│       │   │   └── styles/
│       │   │       └── globals.css          ← Tailwind imports
│       │   ├── preload/
│       │   │   └── index.ts                ← contextBridge exposing IPC
│       │   └── shared/
│       │       └── types.ts                ← FileNode, Tab, Bookmark, etc.
│       ├── electron.vite.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       └── package.json
├── packages/
│   └── fs-watcher/                          ← Extracted for reuse
│       ├── src/
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── .gitignore
```

## Key Design Decisions

### 1. Webview Tag for Bookmark Tabs

Bookmark tabs use Electron's `<webview>` tag, rendered as a regular DOM element in the React tree. This avoids the overlay/bounds-sync issues of `WebContentsView` — the webview participates in CSS flexbox layout like any other element.

```
Renderer (React)                     Main Process
   │                                      │
   │  <webview src={url}                  │
   │    partition={partition} />           │
   │  (DOM element, CSS-positioned)       │
   │                                      │
   │  ipc:webview-getPartition            │
   │  { workspacePath }                   │
   │ ────────────────────────────────────▶│ Returns "persist:orqa-<hash>"
   │                                      │
   │  ipc:webview-openExternal            │
   │  { url }                             │
   │ ────────────────────────────────────▶│ shell.openExternal(url)
```

The `<webview>` tag is enabled via `webviewTag: true` in the main process `webPreferences`. Reload and URL tracking are done directly on the DOM element (`webviewEl.reload()`, `did-navigate` event). No main-process view manager is needed.

Each bookmark gets a unique session partition: `persist:orqa-<hash>`. This keeps Google/Figma logins isolated per workspace and persisted across restarts.

### 2. File Tree Data Model

```typescript
interface FileNode {
  name: string
  path: string          // Absolute path on disk
  type: 'file' | 'directory'
  extension?: string    // e.g. 'md', 'orqa', 'csv'
  children?: FileNode[] // Only for directories
  isExpanded?: boolean  // UI state only
}

interface BookmarkFile {
  type: 'bookmark'
  url: string
  label: string
  service: 'docs' | 'sheets' | 'slides' | 'figma' | 'other'
}
```

The file tree is built by reading the filesystem in the main process and sent to the renderer via IPC. chokidar watches for changes and pushes incremental updates.

### 3. Tab Data Model

```typescript
interface Tab {
  id: string            // UUID
  type: 'file' | 'bookmark' | 'new-tab'
  filePath?: string     // For file tabs — absolute path
  bookmarkUrl?: string  // For bookmark tabs — URL
  label: string         // Display name
  icon: string          // File type icon identifier
  isActive: boolean
  scrollPosition?: number
}
```

Tab state serialized to `userData/workspaces/<folder-hash>/tabs.json` on every tab change, debounced 1s.

### 4. Sidebar File Tree — Lazy Loading

For large folders, load children on-expand rather than reading the full tree upfront:

1. Initial load: read root folder children (depth 1)
2. User expands a folder: IPC call reads that folder's children
3. chokidar watches expanded paths only (add watchers on expand, remove on collapse)

### 5. Markdown Preview (Read-Only)

Phase 1 shows a basic rendered preview for `.md` files. Use `react-markdown` + `remark-gfm` for GFM support. No editing — that's Phase 2 with BlockNote.

### 6. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+O` | Open folder |
| `Cmd+K` | Fuzzy file search |
| `Cmd+W` | Close active tab |
| `Cmd+Shift+T` | Reopen last closed tab |
| `Cmd+1-9` | Switch to tab N |
| `Cmd+Tab` | Next tab |
| `Cmd+Shift+Tab` | Previous tab |

### 7. Status Bar

Always-visible bottom bar showing:
- File type badge (e.g. "Markdown", "Bookmark — Google Sheets")
- Workspace name and path
- Connection status for webview tabs
