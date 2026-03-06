## Why

The content area currently renders `.md` files as read-only HTML via `react-markdown`. Users cannot edit documents inside the app — they must use an external editor, which defeats the purpose of a unified PM workspace. A WYSIWYG editor is the core value proposition of Orqa Note: PMs should be able to create and edit PRDs, specs, and notes with rich formatting and embedded diagrams without leaving the app.

## What Changes

- **Replace read-only markdown preview with BlockNote WYSIWYG editor** — `.md` files open in a rich block editor instead of `react-markdown`. Remove `react-markdown`, `remark-gfm`, and `rehype-highlight` dependencies.
- **Add `packages/editor` package** — standalone `@orqa-note/editor` package containing the BlockNote editor, custom blocks, serialization, and slash menu. Decoupled from Electron.
- **Mermaid diagram block** — custom BlockNote block that renders Mermaid DSL as SVG inline. Split-pane edit mode with code editor + live preview.
- **Slash command menu** — typing `/` opens a command palette to insert Mermaid, table, callout, image, code block, and divider.
- **Auto-save with 2s debounce** — saves 2 seconds after user stops typing, plus on tab switch, window blur, and visibility hide. Replaces the need for manual save.
- **Dirty state tracking** — tabs show a dot indicator when a document has unsaved changes. Cleared on save.
- **Frontmatter preservation** — YAML frontmatter is stripped before parsing and re-prepended on save, so it survives the round-trip untouched.
- **External change conflict handling** — when chokidar detects an external file change while the editor has unsaved edits, a conflict dialog is shown.

## Capabilities

### New Capabilities
- `wysiwyg-editor`: BlockNote-based WYSIWYG editing for `.md` files with text formatting, lists, headings, code blocks, tables, and images
- `mermaid-block`: Custom Mermaid diagram block with inline code editor and live SVG preview
- `slash-commands`: Slash command menu for inserting block types (mermaid, table, callout, image, code, divider)
- `auto-save`: Debounced auto-save (2s), save on tab switch/blur, dirty state indicator, save status display, external change conflict handling

### Modified Capabilities
- `tab-system`: Add `isDirty` field to Tab type for dirty state tracking and visual indicator

## Impact

- **Removed dependencies:** `react-markdown`, `remark-gfm`, `rehype-highlight` from `apps/desktop`
- **Removed files:** `apps/desktop/src/renderer/components/content/MarkdownPreview.tsx`
- **New dependencies:** `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`, `@mantine/core`, `mermaid` in `packages/editor`
- **New package:** `packages/editor` (`@orqa-note/editor`) added to pnpm workspace
- **Modified files:** `ContentArea.tsx` (swap MarkdownPreview for OrqaEditor), `tab-store.ts` (dirty tracking), `Tab.tsx` (dirty indicator), `types.ts` (isDirty field), `use-fs-events.ts` (external change conflict)
