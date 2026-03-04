# AGENTS.md

This file provides guidance to Agent when working with code in this repository.

## Project Overview

Orqa Note is a desktop app for Product Managers — a workspace that combines a local file browser, markdown preview, and embedded web views (Google Docs, Sheets, Figma, etc.) in a tabbed interface. Built with Electron + React.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start Electron dev mode (hot-reload)
pnpm build            # Production build
pnpm typecheck        # Run TypeScript type checking (strict, no unused locals/params)
```

Lint is not yet configured (`pnpm lint` is a no-op).

## Architecture

**Monorepo** using pnpm workspaces. Currently one app at `apps/desktop`.

### Electron Process Boundaries

- **Main process** (`apps/desktop/src/main/`): Window management, IPC handlers, filesystem operations, WebContentsView management
- **Preload** (`apps/desktop/src/preload/index.ts`): Bridges main ↔ renderer via `contextBridge.exposeInMainWorld('electronAPI', api)`. All IPC channels are typed through `ElectronAPI` in `src/shared/types.ts`.
- **Renderer** (`apps/desktop/src/renderer/`): React UI with Tailwind CSS v4

### IPC Handler Pattern

Main process IPC handlers are split by domain in `src/main/ipc/`:
- `fs-handlers` — file/directory CRUD, trash, reveal in Finder
- `workspace-handlers` — folder picker, recent workspaces
- `tab-handlers` — persist/restore tab state per workspace
- `webview-handlers` — WebContentsView lifecycle (create/show/hide/destroy/resize)

All channels follow the `domain:action` naming convention (e.g., `fs:readFile`, `webview:create`).

### Renderer State Management

Three Zustand stores (no persistence middleware — state is saved via IPC to the main process):
- `workspace-store` — current workspace path, file tree nodes, expanded paths
- `tab-store` — open tabs, active tab, recently closed (supports file, bookmark, and new-tab types)
- `ui-store` — sidebar width, search visibility, resize state

### Key Concepts

- **Bookmark files**: `.bookmark` JSON files on disk that embed external URLs (Google Docs, Figma, etc.) as WebContentsView tabs
- **WebContentsView**: Bookmark tabs render via Electron's WebContentsView (not webview tags), managed through `src/main/services/webcontents-manager.ts`
- **FS Watcher**: Chokidar-based file watching in `src/main/services/fs-watcher.ts`, events forwarded to renderer via IPC
- **Tab state persistence**: Per-workspace tab state saved to `userData` via `src/main/services/state-persistence.ts`

### Build Tooling

- `electron-vite` for bundling (separate configs for main, preload, renderer)
- Build output goes to `apps/desktop/out/`
- `electron-builder` for packaging (dmg/exe/AppImage)
- Tailwind CSS v4 via `@tailwindcss/vite` plugin
