## Context

orqa-note is an Electron + React desktop note-taking app using a monorepo with pnpm workspaces. The editor package (`@orqa-note/editor`) wraps Milkdown for WYSIWYG markdown editing. Currently, only `.md` files render in-app — all other file types show "Preview not available" with an "Open in Default App" button. The `useAutoSave` hook lives inside `@orqa-note/editor` and needs to be shared with the new code editor.

The app uses a dark theme built on Tailwind's `neutral` palette (`bg-neutral-900`, borders at `rgba(255,255,255,0.1-0.15)`, text `#d4d4d4`). The Milkdown editor uses custom CSS overrides on top of the Nord theme.

## Goals / Non-Goals

**Goals:**
- Provide a Monaco-based code editor for viewing and editing code/text files directly in the app
- Match the existing dark visual aesthetic (custom Monaco theme derived from current CSS colors)
- Make the code editor the default fallback for all non-markdown, non-binary files
- Extract `useAutoSave` to a shared package for reuse across editors
- Remove file dimming in the sidebar — all files become first-class openable items

**Non-Goals:**
- Full IDE features (terminal, debugging, extensions, IntelliSense beyond built-in)
- Custom language support or LSP integration
- Editing binary files (pdf, docx, images) — these keep "Open in Default App"
- Replacing Milkdown for markdown files

## Decisions

### 1. Monaco Editor via `@monaco-editor/react`

**Choice:** Use `monaco-editor` + `@monaco-editor/react` wrapper.

**Alternatives considered:**
- **CodeMirror 6** — lighter (~500KB vs ~3MB), but the user explicitly wants "the VS Code editor" experience. Monaco IS the VS Code editor core.
- **Shiki** — render-only, no editing capability.

**Rationale:** In Electron, bundle size is less critical (no network transfer). Monaco provides line numbers, syntax highlighting for 70+ languages, built-in formatting, minimap, find/replace, and keyboard shortcuts out of the box. The `@monaco-editor/react` wrapper handles worker loading and provides a clean React API.

### 2. Custom dark theme matching orqa-editor

**Choice:** Define a custom Monaco theme using `monaco.editor.defineTheme()` with colors derived from the existing app palette.

Key color mappings from the current CSS:
- Editor background: `#171717` (neutral-900)
- Text foreground: `#d4d4d4`
- Line numbers: `rgba(255,255,255,0.35)`
- Selection: `rgba(255,255,255,0.08)`
- Borders: `rgba(255,255,255,0.1)`
- Links: `#93c5fd`

The theme will be defined once and registered in the `CodeEditor` component on mount.

### 3. New `@orqa-note/shared` package for `useAutoSave`

**Choice:** Create `packages/shared/` exporting the `useAutoSave` hook. Both `@orqa-note/editor` and `@orqa-note/code-editor` depend on it.

**Alternatives considered:**
- **Copy the hook** — simpler but violates DRY, divergence risk over time.
- **Import from `@orqa-note/editor`** — creates a weird dependency (code-editor → editor).

**Rationale:** The hook is stable, well-defined, and needed by both packages. A shared utils package is the clean solution and sets up a pattern for future shared code.

### 4. New `@orqa-note/code-editor` package

**Choice:** Create `packages/code-editor/` as a separate workspace package, mirroring the structure of `@orqa-note/editor`.

```
packages/code-editor/
  package.json
  src/
    index.ts                 # exports CodeEditor, CodeEditorHandle
    editor/
      CodeEditor.tsx         # main component (forwardRef)
      orqa-theme.ts          # custom Monaco theme definition
      binary-extensions.ts   # set of known binary extensions
```

**API surface:**
```typescript
export interface CodeEditorHandle {
  save(): void
  format(): void
}

export interface CodeEditorProps {
  initialContent: string
  filePath: string           // Monaco infers language from file extension
  onSave: (content: string) => void
  onChange: () => void
}
```

The `filePath` is passed to Monaco's model URI so it auto-detects the language. No manual language mapping needed for most files — Monaco handles `.json`, `.ts`, `.js`, `.css`, `.html`, `.yaml`, `.py`, `.go`, etc. natively.

### 5. ContentArea routing logic

**Choice:** Three-tier routing in `ContentArea.tsx`:

```
1. ext === 'md'                    → <MarkdownEditor />
2. isBinaryExtension(ext)          → "Open in Default App" UI (current behavior)
3. everything else                 → <CodeFileEditor /> (new)
```

Binary detection uses a static set of known binary extensions (images, office docs, media, archives). The set is defined in `@orqa-note/code-editor` and exported for use in the app.

### 6. Formatting via Monaco built-in

**Choice:** Use Monaco's built-in `editor.getAction('editor.action.formatDocument').run()`.

Monaco ships with formatters for JSON, TypeScript, JavaScript, HTML, and CSS. For languages without built-in formatters, the format action is a no-op (graceful degradation). No Prettier dependency needed for now.

The format action will be triggered via:
- `Shift+Alt+F` (VS Code default, comes free with Monaco)
- Exposed via `CodeEditorHandle.format()` for programmatic use

### 7. Monaco workers in Electron + Vite

Monaco needs web workers for language services. With `@monaco-editor/react`, the default CDN loader works but requires internet. For an Electron app, we should configure the local worker path.

**Choice:** Use `@monaco-editor/react`'s `loader.config()` to point to local `monaco-editor` ESM workers bundled by Vite. This ensures offline support.

### 8. Remove `isSupported` dimming

**Choice:** Remove the `isSupported()` check from `FileTreeNode` and the `SUPPORTED_EXTENSIONS` set. All files render at full opacity. The `isSupported` function and constant can be deleted from `file-utils.ts`.

## Risks / Trade-offs

- **[Bundle size increase ~3MB]** → Acceptable for Electron. Monaco is loaded lazily by `@monaco-editor/react` (dynamic import), so it doesn't block initial app load.
- **[Monaco worker setup in Vite]** → May need electron-vite specific configuration for worker paths. Mitigation: test early, fall back to CDN loader if local workers prove problematic.
- **[Binary file detection is heuristic]** → Some exotic binary formats may slip through and show garbled text. Mitigation: use a comprehensive set of ~50 common binary extensions. Users can always close and use "Open in Default App" via context menu.
- **[Breaking re-export of `useAutoSave`]** → Moving the hook from `@orqa-note/editor` to `@orqa-note/shared` changes the import path. Mitigation: keep a re-export in `@orqa-note/editor/src/index.ts` for backward compatibility during migration, then remove it.
