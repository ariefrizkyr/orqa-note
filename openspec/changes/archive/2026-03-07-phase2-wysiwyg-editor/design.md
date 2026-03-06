## Context

Orqa Note Phase 1 is complete: Electron shell, file tree sidebar, tab system, bookmarks with WebContentsView, and fuzzy search. The content area currently renders `.md` files as read-only HTML via `react-markdown` + `remark-gfm` + `rehype-highlight` in `MarkdownPreview.tsx`.

Phase 2 replaces this with a full WYSIWYG editor using Milkdown (ProseMirror + remark-based), adds Mermaid diagram rendering, slash commands, and auto-save. The editor lives in a new `packages/editor` package per the monorepo structure defined in the PRD.

**Editor choice:** Initially BlockNote was used, but it had a critical bug — `parseHTML` crashes with `toLowerCase` on `undefined` when fenced code blocks have no language identifier. Complex markdown files (PRDs with tables, code fences, HTML tags) failed to render. Milkdown was chosen as the replacement because it treats markdown as the source of truth, uses remark for parsing, and handles all standard markdown natively without custom workarounds.

### Current Architecture

```
apps/desktop/src/renderer/
├── components/content/
│   ├── ContentArea.tsx      ← routes file types to viewers, integrates OrqaEditor
├── stores/
│   └── tab-store.ts         ← Tab state with dirty tracking
├── hooks/
│   └── use-fs-events.ts     ← File watcher with self-write guard
└── ...

IPC: fs:readFile, fs:writeFile already exist in fs-handlers.ts
```

## Goals / Non-Goals

**Goals:**
- Full WYSIWYG markdown editing for `.md` files via Milkdown
- Markdown as source of truth — Milkdown reads/writes markdown directly via remark
- Frontmatter preservation (parse out before editor, re-prepend on save)
- Mermaid diagram rendering via `@milkdown/plugin-diagram` with split-pane edit mode
- Slash command menu with type-ahead filtering
- Auto-save with 2s debounce, on tab switch, and on blur/visibility hide
- Dirty state indicator in tab (dot marker)
- Google Docs-style keyboard shortcuts
- Clickable hyperlinks (Cmd+Click opens in external browser)
- `packages/editor` as a standalone package consumable by the desktop app

**Non-Goals:**
- Excalidraw block (deferred)
- Draw.io block (deferred)
- Callout/admonition blocks (deferred)
- Image block insertion UI (deferred — images in existing markdown render fine)
- Collaborative/multiplayer editing
- PDF or DOCX editing
- Cloud sync
- Plugin/extension API

## Decisions

### 1. Package Structure

**Decision:** Create `packages/editor` with Milkdown editor, custom node views, and serialization utilities. The desktop app imports from `@orqa-note/editor`.

**Why:** Keeps the editor decoupled from Electron — could be reused in a web version later. Milkdown plugins and node views stay together.

```
packages/editor/
├── src/
│   ├── index.ts                    ← public API exports
│   ├── editor/
│   │   ├── OrqaEditor.tsx          ← main editor component (Milkdown setup)
│   │   ├── SlashMenu.tsx           ← React slash command menu UI
│   │   ├── use-auto-save.ts        ← debounced auto-save hook
│   │   └── milkdown-overrides.css  ← theme overrides for nord
│   └── serialization/
│       └── frontmatter.ts          ← extract/re-prepend frontmatter
├── package.json
└── tsconfig.json
```

### 2. Markdown Round-Tripping Strategy

**Decision:** Milkdown uses remark under the hood, which treats markdown as the canonical format. No intermediate JSON conversion needed. Frontmatter is extracted before loading and re-prepended on save.

**Why:** Unlike BlockNote (which converts markdown → JSON blocks → markdown lossily), Milkdown's ProseMirror document is derived directly from the remark AST. Round-tripping is handled natively by the remark serializer.

**Flow:**
```
                     OPEN                              SAVE
.md file on disk ──────────────────▶ Milkdown   ──────────────────▶ .md file on disk
         │                            editor                              ▲
         │  1. Read raw text                     3. serializerCtx        │
         │  2. Extract frontmatter                  serializes doc       │
         │  3. Set body as defaultValue          4. Re-prepend           │
         │     (remark parses natively)             frontmatter           │
         ▼                                                                │
   frontmatter stored ──────────────────────────────────────────────────▶─┘
   separately in ref
```

**Mermaid handling:** The `@milkdown/plugin-diagram` provides a remark plugin that converts ` ```mermaid ` fenced blocks to `diagram` ProseMirror nodes. A custom `$view` node view renders them as SVG via `mermaid.render()`. No manual pre/post-processing needed.

### 3. Milkdown Plugin Stack

**Decision:** Compose the editor from these Milkdown plugins:
- `commonmark` — headings, lists, code blocks, blockquotes, links, etc.
- `gfm` — tables, strikethrough, task lists
- `history` — undo/redo
- `listener` — `markdownUpdated` callback for dirty tracking
- `@milkdown/plugin-slash` — slash command trigger + floating UI
- `@milkdown/plugin-diagram` — mermaid fenced block parsing/serialization
- `@milkdown/theme-nord` — dark theme base (with custom CSS overrides)
- Custom `$view` for diagram node — renders mermaid SVG with split-pane editor
- Custom `$prose` plugin — Cmd+Click link opening via callback

**Why:** Milkdown's plugin architecture keeps concerns separated. Each plugin is independently testable and replaceable.

### 4. Mermaid Block Interaction

**Decision:** Two states — view mode (rendered SVG with "Edit" button on hover) and edit mode (split pane: code left, live SVG preview right). Toggle via "Edit" button or click on diagram.

**Implementation:** Use `mermaid.render()` to generate SVG from DSL string. Debounce rendering (300ms) during typing. Escape or blur exits edit mode.

### 5. Auto-Save Architecture

**Decision:** Auto-save runs in the renderer process using a debounced `setTimeout` (2s) that resets on each dirty state change + save-on-blur + save-on-visibility-hide. The save operation uses Milkdown's `serializerCtx` to extract markdown, re-prepends frontmatter, and calls `fs:writeFile` via IPC.

**Dirty tracking:** `isDirty` boolean on Tab type. Set `true` on any `markdownUpdated` event, `false` after save. Displayed as a dot on the tab label.

**Self-write guard:** When saving, `markSelfWritten(filePath)` is called before `writeFile`. The fs-event handler's `consumeSelfWritten()` check ignores the resulting chokidar event within a 2s window, preventing the "file changed externally" prompt from triggering on our own saves.

```
Editor markdownUpdated ──▶ markDirty() ──▶ tab dot indicator
                                              │
2s debounce  ──▶ if dirty → save() ──▶ markSelfWritten() → writeFile → clearDirty()
blur/hide    ──▶ if dirty → save() ──▶ markSelfWritten() → writeFile → clearDirty()
```

### 6. Integration with Desktop App

**Decision:** `ContentArea.tsx` uses `OrqaEditor` from `@orqa-note/editor`. The editor receives content as props and saves via callbacks. Link clicks are handled via `onLinkClick` callback.

**Why:** Keeps the editor package UI-focused. File I/O and Electron APIs are injected via props/callbacks so the editor package doesn't depend on Electron directly.

```typescript
// ContentArea.tsx
<OrqaEditor
  initialContent={markdownString}
  onSave={(markdown) => window.electronAPI.fs.writeFile(filePath, markdown)}
  onChange={() => markDirty(activeTab.id)}
  onLinkClick={(href) => window.electronAPI.webview.openExternal(href)}
/>
```

### 7. External Change Conflict Handling

**Decision:** When chokidar detects a `change` event for a file open in a tab, first check if it's a self-write (via `consumeSelfWritten`). If self-write, ignore. Otherwise, if dirty, show confirm dialog. If clean, silently reload.

**Why:** Prevents silent data loss and eliminates false prompts from our own auto-saves.

### 8. Keyboard Shortcuts

**Decision:** Override Milkdown's default keymaps to add Google Docs-style shortcuts alongside the defaults:

| Shortcut | Action |
|---|---|
| `Cmd+Shift+1` through `6` | Heading 1–6 |
| `Cmd+Shift+7` | Ordered List |
| `Cmd+Shift+8` | Bullet List |
| `Cmd+Shift+9` | Blockquote |
| `Cmd+Shift+C` | Code Block |
| `Cmd+Click` on link | Open in external browser |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Milkdown remark serialization may reformat markdown whitespace | Accept — remark produces clean, standard markdown |
| Mermaid rendering can be slow for large diagrams | Debounce render at 300ms in edit mode |
| `@milkdown/plugin-diagram` is at v7.7.0 (older than kit v7.19.0) | Peer deps are `^7.2.0`, compatible. Monitor for updates. |
| Auto-save writes to disk frequently, may trigger chokidar events | Self-write guard (`markSelfWritten`) suppresses false external-change prompts |
| Milkdown bundle size with mermaid is large (~3MB) | Acceptable — mermaid chunks are lazy-loaded, editor is per-tab |
