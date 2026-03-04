# Phase 1: Electron Shell, File Browser & WebContentsView Tabs

## Summary

Bootstrap the Orqa Note monorepo and build the foundational desktop shell — folder-first sidebar, browser-style tab system, and WebContentsView-based bookmark tabs with persistent sessions. This phase delivers the "unified file browser" experience: open a folder, browse your PM files, and open Google Docs/Figma as in-app tabs.

## Motivation

PMs context-switch between 5-8 apps to manage project files. Phase 1 establishes the single-window workspace where local files and external tools coexist. No editing yet — just the shell that everything else plugs into.

## Scope

### In Scope
- Monorepo scaffolding (pnpm workspaces + electron-vite)
- Electron 33+ with main/renderer/preload architecture
- Welcome screen: "Open Folder" + recent workspaces
- Sidebar file tree mirroring real filesystem (chokidar)
- File type icons, right-click context menu, drag-and-drop reorder
- `Cmd+K` fuzzy file search
- Browser-style tab bar (open/close/switch/dedup)
- Tab persistence across app restarts
- `.orqa` bookmark file parsing
- WebContentsView manager for bookmark tabs (Google Suite, Figma)
- Session persistence via Electron partitions
- Webview toolbar (name, reload, open in browser)
- Basic read-only markdown preview for `.md` files
- New Tab screen with file type cards
- Status bar (file type, workspace name)
- macOS-native folder picker (`NSOpenPanel`)

### Out of Scope
- WYSIWYG markdown editor (Phase 2)
- Diagram blocks — Mermaid, Excalidraw, Draw.io (Phase 2)
- Spreadsheet editor (Phase 3)
- PDF viewer (Phase 3)
- DOCX viewer (Phase 3)
- Export functionality (Phase 4)
- Cloud sync, collaboration

## Exit Criteria

- Can open a local folder and see real directory structure in sidebar
- Creating/renaming/deleting files in sidebar reflects on disk and vice versa
- `.orqa` bookmark files open Google Docs/Sheets/Figma as in-app tabs
- User stays logged in to Google/Figma across app restarts
- Open tabs restore on relaunch
- `Cmd+K` finds files by name
- `.md` files show read-only rendered preview

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Electron version | 33+ (latest stable) | WebContentsView API, current security patches |
| Node version | 22 LTS | Already installed, full ES module support |
| Package manager | pnpm | Workspace support, fast, disk-efficient |
| Build tool | electron-vite | First-class Electron + Vite, HMR in dev |
| Packaging | electron-builder | macOS `.dmg` output |
| Frontend | React 18 + TypeScript | Per PRD spec |
| State management | Zustand | Lightweight, no boilerplate |
| Styling | Tailwind CSS v4 | Utility-first, per PRD spec |
| FS watching | chokidar | Mature, handles macOS FSEvents |
| Webview API | WebContentsView | BrowserView deprecated in Electron 30+ |
| Doc format | `.md` (GFM) | Portable, Git-friendly, no lock-in |
| State persistence | JSON in Electron userData | Open tabs, scroll positions, recent workspaces |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebContentsView positioning/lifecycle | Tab switching may have visual glitches | Spike early, test show/hide/resize thoroughly |
| chokidar performance on large folders | Sidebar freeze on deep trees | Lazy-load tree nodes, debounce FS events |
| Session partition persistence | Login lost on restart | Test with Google OAuth early in week 3 |
| Electron security (nodeIntegration) | XSS in webview tabs | Strict CSP, contextIsolation: true, preload scripts only |
