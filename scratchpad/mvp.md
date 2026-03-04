# Orqa Note — The PM Workspace
### Product Requirements Document

| Field | Value |
|---|---|
| Author | Arief |
| Status | Draft |
| Version | 1.0 |
| Date | March 2026 |
| Target Platform | macOS (v1), Windows (v2) |
| Distribution | Open Source (MIT License) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Goals & Success Metrics](#4-goals--success-metrics)
5. [Feature Scope](#5-feature-scope)
6. [UX & Interaction Design](#6-ux--interaction-design)
7. [Technical Architecture](#7-technical-architecture)
8. [Release Plan](#8-release-plan)
9. [Open Source Strategy](#9-open-source-strategy)
10. [Out of Scope — v1](#10-out-of-scope--v1)
11. [Open Questions](#11-open-questions)
12. [Appendix](#12-appendix)

---

## 1. Overview

Orqa Note is a dedicated desktop application for Product Managers — a unified workspace where every file format a PM touches lives in one place. Instead of context-switching between VS Code, Finder, a browser, and Figma, Orqa Note consolidates file management, editing, and external tool access into a single native app built on Electron.

Critically, Orqa Note is **file-system-first**: open a folder from Finder, and the sidebar reflects your real directory. No import, no sync, no walled garden.

> 💡 **Positioning:** Orqa Note is to PMs and founders what Zed is to engineers — an open-source, purpose-built tool that treats the user's workflow as a first-class design constraint.

---

## 2. Problem Statement

PMs today manage their work across 5–8 separate applications. This creates three compounding problems:

- **Context fragmentation** — switching apps to find a file, cross-reference data, or open a diagram breaks deep work and costs cognitive overhead.
- **No unified file home** — project files live across Finder, Google Drive, Figma, Notion, and email. There is no single place to see "everything for this project."
- **Format dead zones** — native tools like VS Code handle code but not XLSX or PPTX; Notion handles docs but not local files or Mermaid; nothing handles all PM formats together.

---

## 3. Target Users

### Primary: Product Managers
Individual PMs at tech companies who own a product area and regularly produce PRDs, specs, roadmaps, data analysis, flow diagrams, and design reviews. The open-source nature enables community contributions and self-hosting.

### Secondary: Founders & Indie Hackers
Small team leads who operate across product, design, and strategy — and need to move fast across formats without maintaining a complex tool stack.

> ⚠️ **Out of scope for v1:** Designers (Figma-primary) and Engineers (IDE-primary) are not the target user. Orqa Note is optimized for PM workflows.

---

## 4. Goals & Success Metrics

| Goal | Metric | v1 Target |
|---|---|---|
| Core format coverage | Formats openable in-app | 9 formats |
| External tool integration | Bookmarks openable as tabs | Google Suite + Figma |
| WYSIWYG doc quality | Embedded block types | Mermaid + Excalidraw + Draw.io |
| Session persistence | Webview login retained | Yes — across restarts |
| Platform support | OS at launch | macOS |

---

## 5. Feature Scope

### 5.1 File System — Folder-First Architecture

Orqa Note is file-system-first. When a user opens the app for the first time, they are prompted to open a folder from their Mac — exactly like VS Code or Zed. The sidebar reflects the real directory structure on disk. There is no proprietary database or hidden storage. Every file the user creates or edits in Orqa Note is a real file, readable and editable in Finder or any other app.

> 📁 **Design principle:** Your files are just files. Orqa Note is a lens over your filesystem, not a walled garden. Closing the app changes nothing — your folder stays exactly as it is in Finder.

#### First-Launch Experience

- **Welcome screen** — on first open, a centered prompt: *"Open a folder to get started"* with a primary CTA button, identical to VS Code's empty state.
- **Folder picker** — triggers macOS native `NSOpenPanel` (folder selection). The chosen folder becomes the workspace root.
- **Recent workspaces** — subsequent launches show a "Recent" list of previously opened folders, each openable in one click.
- **Multiple workspaces** — users can switch between folders via File → Open Folder (`⌘O`) or the workspace name in the sidebar header. Each folder is an independent workspace.

#### Sidebar Tree

- **Mirrors Finder exactly** — folder structure, file names, and nesting are a 1:1 reflection of the filesystem. Creating a folder in Orqa Note creates it on disk. Renaming a file renames it in Finder.
- **Supported files auto-detected** — `.md`, `.folio`, `.csv`, `.xlsx`, `.pdf`, `.docx`, `.pptx`, `.mmd`, `.excalidraw`, `.drawio` files show with type-specific icons and open in the appropriate editor.
- **Unsupported files shown** — non-supported file types appear in the tree (greyed out) but open in the system default app on double-click.
- **Bookmarks as `.orqa` files** — external bookmarks (Google Docs, Figma, etc.) are stored as lightweight `.orqa` JSON files on disk, so they live in the folder alongside real files, are visible in Finder, and are portable (shareable via Git or Dropbox).
- **Drag and drop** — reorder files and folders in the sidebar; this moves files on disk accordingly.
- **Right-click context menu** — New File, New Folder, Rename, Delete, Reveal in Finder, Copy Path.
- **Quick search** — `⌘K` fuzzy search across all file names and bookmark names within the open workspace.

#### `.orqa` Bookmark File Format

External bookmarks are plain JSON files stored on disk:

```json
{
  "type": "bookmark",
  "url": "https://docs.google.com/spreadsheets/d/...",
  "label": "Q2 Payment Metrics",
  "service": "sheets"
}
```

This means bookmarks are visible in Finder, portable via Git or Dropbox, and shareable with teammates.

---

### 5.2 Tab System

A browser-style tab bar for multitasking across multiple open files and external tools simultaneously.

- **Multi-tab** — open unlimited files as tabs, each with a color-coded type dot.
- **Tab persistence** — restore open tabs and scroll positions on app relaunch.
- **Webview tabs** — bookmarks (`.orqa` files) open as a dedicated tab hosting a full Electron `BrowserView`, not a sandboxed iframe. Google Docs, Sheets, Slides, and Figma load with full Chromium fidelity and persisted login session.
- **Webview toolbar** — each webview tab shows the resource name, a Reload button, and an "Open in Browser" escape hatch.
- **Deduplication** — if a tab is already open, clicking the sidebar item switches to the existing tab rather than opening a duplicate.
- **New Tab screen** — grid of file type cards for creating new files or adding a bookmark.

---

### 5.3 WYSIWYG Markdown Editor

The flagship editing experience. A rich block-based document editor built on BlockNote (TipTap/ProseMirror foundation) that renders formatting and embedded diagrams in-place — no split preview pane.

#### Text Formatting

- Bold, italic, underline, strikethrough, inline code
- Heading levels H1–H3
- Unordered and ordered lists
- Task lists with checkbox state
- Blockquote / callout blocks
- Inline hyperlinks

#### Embedded Diagram Blocks

Insertable via the `/` slash command menu or toolbar buttons. Each block renders inline as a visual component within the document — Confluence-style.

| Block Type | View Mode | Edit Mode | Storage |
|---|---|---|---|
| Mermaid | Rendered SVG diagram | Inline code editor + live preview | Mermaid DSL in doc JSON |
| Excalidraw | Static canvas snapshot | "Open canvas" → fullscreen editor | Element JSON in doc |
| Draw.io | Rendered diagram snapshot | "Open editor" → webview overlay | XML in doc JSON |
| Table | Editable grid inline | Click cell to edit | Doc JSON |
| Image | Rendered image | Click to replace | Local file path or base64 |
| Callout | Styled block with icon | Click to edit text | Doc JSON |

#### Document Storage

- **Format:** JSON (BlockNote native) stored as `.folio` files — real files on disk, Git-friendly, portable.
- **Export:** Markdown (`.md`), PDF, and plain text. Mermaid and Excalidraw blocks export as fenced code blocks in markdown.
- **Auto-save:** Every 30 seconds and on tab switch. Displayed as *"Auto-saved ✓"* in toolbar.

---

### 5.4 Spreadsheet Editor (CSV / XLSX)

- Open, view, and edit `.csv` and `.xlsx` files using an ag-Grid based editor.
- Formula bar with cell reference display.
- Column sorting, filtering, and basic formatting.
- Multi-sheet support for `.xlsx` files.
- Export to `.csv` or `.xlsx`.

---

### 5.5 PDF Viewer

- Render PDF files using PDF.js (Mozilla).
- Page navigation, zoom, and fit-to-width controls.
- Text search within document.
- Download button for local save.

> **Note:** PDF editing is out of scope for v1. View-only.

---

### 5.6 Supported File Formats Summary

| Format | Extensions | Editor | View | Edit |
|---|---|---|---|---|
| Markdown (WYSIWYG) | `.md`, `.folio` | BlockNote | ✅ v1 | ✅ v1 |
| Spreadsheet | `.csv`, `.xlsx` | ag-Grid | ✅ v1 | ✅ v1 |
| PDF | `.pdf` | PDF.js | ✅ v1 | v2 |
| Word Doc | `.docx` | mammoth.js render | ✅ v1 | v2 |
| Presentation | `.pptx` | Custom renderer | v2 | v2 |
| Mermaid | `.mmd` | mermaid.js | ✅ v1 | ✅ v1 |
| Excalidraw | `.excalidraw` | @excalidraw/excalidraw | ✅ v1 | ✅ v1 |
| Draw.io | `.drawio` | embed.diagrams.net | ✅ v1 | ✅ v1 |
| Google Suite / Figma | `.orqa` bookmark | Electron BrowserView | ✅ v1 | Native (in BrowserView) |

---

## 6. UX & Interaction Design

### 6.1 Layout

Three-panel layout consistent across all content types:

- **Left panel** — sidebar: workspace selector, file tree with inline bookmarks, search, user profile.
- **Top bar** — tab bar for open files and webview tabs, plus New Tab button.
- **Main area** — content panel rendering the appropriate editor or viewer for the active tab, with a context-sensitive toolbar row below the tab bar.
- **Bottom bar** — status bar showing file type, cursor position, save state, and workspace name.

---

### 6.2 First-Launch Flow

```
Open Orqa Note
      │
      ▼
 ┌────────────────────────────────────┐
 │                                    │
 │         Orqa Note                  │
 │      The PM Workspace              │
 │                                    │
 │   ┌──────────────────────────┐     │
 │   │   Open Folder...  ⌘O    │     │
 │   └──────────────────────────┘     │
 │                                    │
 │   Recent                           │
 │   › ~/Documents/tiket-work         │
 │   › ~/Desktop/2026-strategy        │
 │                                    │
 └────────────────────────────────────┘
      │
      ▼ user picks a folder
      │
 Sidebar reflects the folder
 Files open as tabs
 .orqa files open as BrowserView tabs
```

---

### 6.3 Bookmark UX

- Bookmarks (`.orqa` files) are indistinguishable in hierarchy from local files — they appear as sibling items within folders.
- Visual differentiation: colored type chip (e.g. green **Sheets**, blue **Docs**, orange **Figma**) and a `↗` action button on hover.
- Clicking a bookmark opens a new tab hosting a `BrowserView` — the user stays in Orqa Note.
- If the tab is already open, clicking the sidebar item switches to the existing tab (no duplicates).
- Webview session persists across tab switches and app restarts via Electron session partitions.

---

### 6.4 Slash Command Menu

In the WYSIWYG editor, typing `/` on a new line opens a command palette:

| Command | Block Inserted |
|---|---|
| `/mermaid` | Mermaid diagram block |
| `/excalidraw` | Excalidraw canvas block |
| `/drawio` | Draw.io diagram block |
| `/table` | Table |
| `/callout` | Callout / info block |
| `/image` | Image |
| `/code` | Code block |
| `/divider` | Horizontal rule |

---

### 6.5 Diagram Block Interaction States

| Block | View State | Edit State |
|---|---|---|
| Mermaid | Rendered SVG, click "Edit code" in header | Inline split: code left, live SVG preview right |
| Excalidraw | Static snapshot of canvas | "Open canvas" expands to fullscreen within tab |
| Draw.io | Rendered diagram snapshot | "Open editor" loads draw.io in a webview overlay |

---

## 7. Technical Architecture

### 7.1 Stack

| Layer | Technology | Purpose |
|---|---|---|
| Shell | Electron 30+ | Cross-platform desktop, BrowserView, IPC |
| Frontend | React 18 + TypeScript | App UI, editors, tab system |
| Build | electron-vite | Fast dev server + production build |
| Packaging | electron-builder | macOS `.dmg`, Windows `.exe` installer |
| State | Zustand | Tab state, sidebar tree, workspace config |
| Styling | Tailwind CSS | Utility-first UI styling |
| Doc editor | BlockNote (TipTap) | WYSIWYG block editor foundation |
| Spreadsheet | ag-Grid Community | CSV/XLSX editing and display |
| PDF | PDF.js | PDF rendering in renderer process |
| Mermaid | mermaid.js | Diagram DSL to SVG rendering |
| Excalidraw | @excalidraw/excalidraw | Embedded canvas in React |
| Draw.io | embed.diagrams.net (webview) | Self-hostable option in roadmap |
| File I/O | Node.js `fs` + `xlsx` library | Local file read/write, XLSX parsing |
| FS Watcher | chokidar | Watch open folder for external changes, sync sidebar in real time |

---

### 7.2 BrowserView Architecture

External bookmarks (Google Suite, Figma, etc.) are rendered using Electron's `BrowserView` (or `WebContentsView` in Electron 30+), not iframes. This is critical because:

- Google and Figma block iframe embedding via `X-Frame-Options` headers. `BrowserView` bypasses this — it is a real Chromium instance.
- Each bookmark tab gets its own `BrowserView` instance, created on first open and cached in memory for fast tab switching.
- Sessions are persisted via Electron session partitions, so users remain logged in across restarts.
- `BrowserViews` are positioned and shown/hidden as the user switches tabs via IPC messages from the renderer.

```
Main Process
├── BrowserView: Payment Metrics (sheets)   ← cached, hidden
├── BrowserView: Q2 PRD Doc (docs)          ← cached, hidden
└── BrowserView: Checkout Flow (figma)      ← active, visible

Renderer (React)
└── Tab bar controls which BrowserView is shown via IPC
```

---

### 7.3 Data Storage

- **Workspace root** — the open folder on disk IS the workspace. No config database — the filesystem is the source of truth.
- **Workspace state** — only transient state (last open tabs, scroll positions) is stored in app `userData` as JSON, keyed by folder path.
- **`.folio` files** — BlockNote JSON document format. Stored as real files on disk — portable, Git-friendly, shareable.
- **`.orqa` bookmark files** — lightweight JSON on disk. Example:
  ```json
  { "type": "bookmark", "url": "https://docs.google.com/...", "label": "Q2 Metrics", "service": "sheets" }
  ```
- **Session data** — Electron session partitions stored in app `userData`. One partition per workspace for session isolation.
- **No cloud sync in v1** — all data is local. Cloud sync (via Supabase or similar) is a v2 consideration.
- **Open source** — MIT License. Source hosted on GitHub. Community contributions welcome via PR. Plugin/extension API planned for v2.

---

## 8. Release Plan

| Phase | Timeline | Scope | Exit Criteria |
|---|---|---|---|
| Phase 1 | Weeks 1–3 | Electron shell, first-launch folder picker, sidebar tree (chokidar), tab system, BrowserView for `.orqa` bookmarks | Can open a local folder; Google Docs/Figma opens as in-app tab with persistent session |
| Phase 2 | Weeks 4–6 | WYSIWYG editor with Mermaid + Excalidraw blocks, slash commands, auto-save | Can create and save a PRD with embedded diagrams as a `.folio` file |
| Phase 3 | Weeks 7–9 | CSV/XLSX editor, PDF viewer, Draw.io block | Can open and edit spreadsheets; view PDFs in-app |
| Phase 4 | Weeks 10–11 | Polish, export (MD/PDF), keyboard shortcuts, right-click context menu | App usable as daily driver for 1 week by author |
| v1 Launch | Week 12 | macOS `.dmg` build, GitHub public release, README, landing page, Product Hunt | First 50 GitHub stars / downloads |

---

## 9. Open Source Strategy

Orqa Note is released under the **MIT License**. The open-source model serves both the PM community and the product's growth.

- **GitHub repository** — public monorepo hosting Electron shell, React frontend, and editor packages.
- **License** — MIT. Permissive, allows commercial use, modification, and distribution without restriction.
- **Contributions** — issues and PRs welcome. `CONTRIBUTING.md` and issue templates included in v1 repo.
- **Community** — Discord server for users and contributors. GitHub Discussions for feature requests.
- **Monetization path (optional)** — cloud sync, team workspaces, or a hosted version may be offered as a paid tier in the future. Core app remains free and open.

> 📦 **Repo structure:**
> ```
> orqa-note/
>   apps/desktop          ← Electron entry point
>   packages/editor       ← BlockNote + custom blocks
>   packages/spreadsheet  ← ag-Grid wrapper
>   packages/pdf-viewer   ← PDF.js wrapper
>   packages/fs-watcher   ← chokidar filesystem sync
> ```

---

## 10. Out of Scope — v1

- Cloud sync or multi-device access
- Collaboration / multiplayer editing
- PPTX editor (view-only in v2)
- DOCX editor (view-only via mammoth.js in v1)
- Mobile or web version
- Plugin / extension system
- AI writing assistant (v2 candidate)
- Windows build (v2, after macOS validation)
- Linux build

---

## 11. Open Questions

| # | Question | Notes |
|---|---|---|
| 1 | Should Draw.io be self-hosted (bundled) or loaded from embed.diagrams.net? | Self-hosting adds ~50MB to bundle but enables offline use. Recommend remote for v1. |
| 2 | What is the pricing model for the optional paid tier? | One-time purchase (~$25–49) typical for prosumer desktop tools. Freemium also viable. |
| 3 | Should `.folio` and `.orqa` files be registered as default file handlers in macOS? | Low effort, high value. Register via `electron-builder` `fileAssociations`. |
| 4 | AI assistant integration — Claude API for PRD generation in-editor? | Deferred to v2. High value for PM users, fits the open-source ethos well. |
| 5 | Contribution model — monorepo with plugins, or core + extension registry? | Recommend monorepo for v1, open extension API for v2. |

---

## 12. Appendix

### Design Reference

Interactive HTML mockup produced in parallel with this PRD. Key screens:

- Unified sidebar with files + `.orqa` bookmarks in same tree
- WYSIWYG markdown editor with inline Mermaid and Excalidraw blocks
- Spreadsheet tab with formula bar and multi-sheet support
- PDF viewer with page navigation
- Google Sheets / Figma opening as `BrowserView` tabs
- First-launch folder picker flow

---

### Competitive Landscape

| Tool | Markdown | Spreadsheet | Diagrams | External tabs | Open source | File-system-first |
|---|---|---|---|---|---|---|
| **Orqa Note** | ✅ WYSIWYG | ✅ ag-Grid | ✅ 3 types | ✅ BrowserView | ✅ MIT | ✅ |
| Notion | ✅ (cloud) | ✗ basic | ✗ limited | ✗ | ✗ | ✗ |
| Obsidian | ✅ (files) | ✗ | ✅ (plugin) | ✗ | ✗ | ✅ |
| VS Code | ✗ text only | ✗ | ✅ (extension) | ✗ | ✅ MIT | ✅ |
| Linear | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

> ✅ **Orqa Note's differentiator:** No existing open-source tool combines local file editing, diagram embeds, and external webview tabs in a single PM-focused desktop app. Orqa Note owns this gap as the only open-source option.

---

*Orqa Note — The PM Workspace · v1.0 PRD · March 2026 · Confidential Draft*