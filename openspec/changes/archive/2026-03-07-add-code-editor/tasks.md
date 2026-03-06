## 1. Shared Utils Package

- [x] 1.1 Create `packages/shared/` with `package.json` (`@orqa-note/shared`), `src/index.ts`, and `src/hooks/use-auto-save.ts`
- [x] 1.2 Move `useAutoSave` hook from `packages/editor/src/editor/use-auto-save.ts` to `packages/shared/src/hooks/use-auto-save.ts`
- [x] 1.3 Update `@orqa-note/editor` to depend on `@orqa-note/shared` and re-export `useAutoSave` from shared
- [x] 1.4 Verify existing markdown editor auto-save still works after the migration

## 2. Code Editor Package Setup

- [x] 2.1 Create `packages/code-editor/` with `package.json` (`@orqa-note/code-editor`) depending on `monaco-editor`, `@monaco-editor/react`, `react`, and `@orqa-note/shared`
- [x] 2.2 Create `src/editor/orqa-theme.ts` — define custom Monaco theme (`orqa-dark`) with colors matching the app palette
- [x] 2.3 Create `src/editor/binary-extensions.ts` — set of known binary extensions and `isBinaryExtension()` function
- [x] 2.4 Create `src/editor/CodeEditor.tsx` — main component with `forwardRef`, exposing `save()` and `format()` via imperative handle
- [x] 2.5 Create `src/index.ts` — export `CodeEditor`, `CodeEditorProps`, `CodeEditorHandle`, `isBinaryExtension`

## 3. Desktop App Integration

- [x] 3.1 Add `@orqa-note/code-editor` as a workspace dependency in `apps/desktop/package.json`
- [x] 3.2 Configure Monaco workers in `electron.vite.config.ts` for local worker loading
- [x] 3.3 Create `CodeFileEditor` component in `ContentArea.tsx` (mirrors `MarkdownEditor` pattern — loads file, handles save/dirty/auto-save)
- [x] 3.4 Update `ContentArea` routing: `.md` → MarkdownEditor, binary → "Open in Default App", else → CodeFileEditor
- [x] 3.5 Remove `isSupported()`, `SUPPORTED_EXTENSIONS` from `file-utils.ts` and remove dimming logic from `FileTreeNode.tsx`

## 4. Verification

- [x] 4.1 Test opening various code files (`.json`, `.ts`, `.css`, `.yaml`, `.py`, `.toml`) — verify syntax highlighting and line numbers
- [x] 4.2 Test formatting a JSON file with Shift+Alt+F
- [x] 4.3 Test auto-save on code files (edit, wait 2s, verify file written)
- [x] 4.4 Test binary files (`.pdf`, `.png`, `.docx`) still show "Open in Default App"
- [x] 4.5 Test unknown extensions (`.xyz`, `.conf`) open in Monaco as plain text
- [x] 4.6 Verify markdown files still open in Milkdown editor
- [x] 4.7 Verify no file dimming in sidebar
