# Orqa Note

A desktop workspace for Product Managers — manage local files, write markdown, edit spreadsheets, draw on canvas, preview PDFs, and embed external services, all in one place.

Built with Electron, React, and TypeScript.

## Features

- **Markdown editor** with syntax highlighting and Mermaid diagram support
- **Code editor** powered by Monaco for 100+ languages
- **Spreadsheet editor** for CSV and XLSX files
- **PDF viewer** for inline document viewing
- **Canvas editor** with Excalidraw for drawings and diagrams
- **Embedded web views** for external services (Google Docs, Sheets, Figma) via `.orqlnk` bookmark files
- **Local file browser** with directory watching and fuzzy search
- **Tabbed interface** with workspace persistence
- **Keyboard shortcuts** for fast navigation

## Tech Stack

- **Electron 33** — desktop shell
- **React 18** — UI
- **TypeScript 5.7** — strict mode
- **Tailwind CSS 4** — styling
- **Zustand 5** — state management
- **electron-vite** — build tooling

## Prerequisites

- Node.js >= 20
- pnpm >= 9

## Getting Started

```bash
# Install dependencies
pnpm install

# Start in dev mode with hot reload
pnpm dev
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start Electron dev mode with hot reload |
| `pnpm build` | Production build |
| `pnpm build:mac` | Build and package macOS DMG |
| `pnpm typecheck` | Run TypeScript type checking |

## Project Structure

```
orqa-note/
├── apps/
│   └── desktop/                # Electron app
│       └── src/
│           ├── main/           # Main process (IPC, file watching, state)
│           ├── preload/        # IPC bridge
│           ├── renderer/       # React UI (components, stores, hooks)
│           └── shared/         # Shared types
├── packages/
│   ├── editor/                 # Milkdown markdown editor
│   ├── code-editor/            # Monaco code editor
│   ├── spreadsheet/            # Univer Sheets (CSV/XLSX)
│   ├── pdf-viewer/             # PDF.js viewer
│   ├── excalidraw/             # Excalidraw canvas editor
│   └── shared/                 # Shared utilities and hooks
├── openspec/                   # Product specifications
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Architecture

**Main process** handles file system operations, window management, and state persistence. IPC follows a domain-based naming pattern (`fs:readFile`, `webview:create`).

**Renderer** uses three Zustand stores:
- `workspace-store` — current workspace, file tree
- `tab-store` — open tabs, active tab, recently closed
- `ui-store` — sidebar width, search visibility

**Bookmark files** (`.orqlnk` JSON) open external URLs as embedded web views with isolated session storage per workspace.

## License

MIT
