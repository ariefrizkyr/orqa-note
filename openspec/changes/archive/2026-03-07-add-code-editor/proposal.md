## Why

The app currently shows "Preview not available" for all non-markdown files, forcing users to open them externally. Code files like JSON configs, TypeScript, YAML, etc. are common in note-taking and project workspaces — users need to view and edit them without leaving the app. A Monaco-based code editor provides a familiar VS Code experience with syntax highlighting, line numbers, and formatting.

## What Changes

- Add a new `@orqa-note/code-editor` package wrapping Monaco Editor with a custom dark theme matching the existing orqa-editor aesthetic
- Add a new `@orqa-note/shared` package to extract `useAutoSave` hook (currently in `@orqa-note/editor`) into shared utilities
- Update `ContentArea.tsx` routing: `.md` → Milkdown, binary files → "Open in Default App", everything else → Monaco code editor
- Remove file dimming in sidebar — all files are now openable (either with a dedicated viewer or the code editor fallback)
- Update `@orqa-note/editor` to consume `useAutoSave` from `@orqa-note/shared` instead of its own copy

## Capabilities

### New Capabilities
- `code-editor`: Monaco-based code editor component with syntax highlighting, line numbers, built-in formatting, auto-save, and dirty tracking — serves as the default viewer/editor for all non-markdown text files and unsupported file types
- `shared-utils`: Shared utilities package (`@orqa-note/shared`) extracting `useAutoSave` hook for reuse across editor packages

### Modified Capabilities
- `auto-save`: Hook moves from `@orqa-note/editor` to `@orqa-note/shared` — import path changes but behavior stays the same

## Impact

- **New packages**: `packages/code-editor/`, `packages/shared/`
- **Modified packages**: `packages/editor/` (remove local `useAutoSave`, depend on `@orqa-note/shared`)
- **Modified app code**: `ContentArea.tsx` (new routing logic), `file-utils.ts` (remove `isSupported`/dimming logic), `FileTreeNode` (remove dimming)
- **New dependencies**: `monaco-editor`, `@monaco-editor/react`
- **Vite config**: May need Monaco worker configuration for Electron
