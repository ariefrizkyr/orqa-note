# Orqa Note

A desktop workspace for Product Managers — browse local files with markdown preview, manage documents in tabs, and embed external services (Google Docs, Sheets, Figma, etc.) all in one place.

Built with Electron, React, and TypeScript.

## Features

- **Local file browser** with directory watching and fuzzy search
- **Markdown preview** with GitHub Flavored Markdown and syntax highlighting
- **Tabbed interface** for managing multiple documents
- **Embedded web views** for external services via `.bookmark` files
- **Workspace persistence** — tabs and state restored per workspace
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
├── packages/                   # Shared packages (workspace)
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

**Bookmark files** (`.bookmark` JSON) open external URLs as embedded web views with isolated session storage per workspace.

## License

MIT
