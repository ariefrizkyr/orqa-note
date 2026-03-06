## 1. Package Setup

- [x] 1.1 Create `packages/editor/package.json` (`@orqa-note/editor`), `tsconfig.json`, and `src/index.ts` entry point. Add Milkdown dependencies: `@milkdown/kit`, `@milkdown/react`, `@milkdown/plugin-slash`, `@milkdown/theme-nord`, `@milkdown/plugin-diagram`, `@milkdown/utils`, `mermaid`. Configure pnpm workspace to include `packages/*`.
- [x] 1.2 Configure `apps/desktop` to depend on `@orqa-note/editor`. Update electron-vite config to resolve the workspace package. Verify the package imports correctly in the renderer process.
- [x] 1.3 Remove `react-markdown`, `remark-gfm`, and `rehype-highlight` from `apps/desktop/package.json`. Delete `MarkdownPreview.tsx`.

## 2. Core Editor Component (Milkdown)

- [x] 2.1 Create `packages/editor/src/editor/OrqaEditor.tsx` — a React component that initializes Milkdown with `commonmark`, `gfm`, `history`, `listener` plugins and nord theme. Props: `initialContent: string`, `onSave: (markdown: string) => void`, `onChange?: () => void`. Expose `OrqaEditorHandle` with `save()` method via `forwardRef`.
- [x] 2.2 Create `packages/editor/src/serialization/frontmatter.ts` — utility to extract YAML frontmatter from raw markdown (returns `{ frontmatter: string | null, body: string }`) and re-prepend it on save.
- [x] 2.3 Export `OrqaEditor` component, types, and `useAutoSave` from `packages/editor/src/index.ts`.

## 3. Desktop App Integration

- [x] 3.1 Update `ContentArea.tsx` — replace `MarkdownPreview` import with `OrqaEditor` from `@orqa-note/editor`. Pass file content as `initialContent`, wire `onSave` to `window.electronAPI.fs.writeFile` with self-write guard.
- [x] 3.2 Add `isDirty` field to `Tab` type in `src/shared/types.ts`. Update `tab-store.ts` to add `markDirty(id: string)` and `clearDirty(id: string)` actions. Wire `onChange` callback from editor to `markDirty`.
- [x] 3.3 Add dirty indicator to `Tab.tsx` — show a dot on the tab label when `tab.isDirty` is true.

## 4. Auto-Save

- [x] 4.1 Create `packages/editor/src/editor/use-auto-save.ts` — `useAutoSave({ isDirty, onSave, debounceMs: 2000 })`. Uses debounced `setTimeout` that resets on each dirty change. Also saves on `visibilitychange` (hidden) and `blur` events.
- [x] 4.2 Integrate auto-save in `ContentArea.tsx` — trigger save on tab switch by checking `isDirty` for the previously active tab before switching.
- [x] 4.3 Handle external file change conflict — add `markSelfWritten`/`consumeSelfWritten` guard in `use-fs-events.ts`. When chokidar detects a change, check self-write guard first. If self-write, ignore. If dirty, show dialog. If clean, reload silently.

## 5. Mermaid Diagram Block

- [x] 5.1 Add `mermaid` and `@milkdown/plugin-diagram` dependencies.
- [x] 5.2 Create diagram NodeView using `$view(diagramSchema.node, ...)` — renders mermaid SVG via `mermaid.render()`, click to enter textarea edit mode, Escape/blur to exit.
- [x] 5.3 Upgrade diagram edit mode to split-pane view — side-by-side code editor (left) and live SVG preview (right) with 300ms debounce rendering.
- [x] 5.4 Add "Edit" button on diagram hover — visible on hover over rendered diagram, click opens edit mode.

## 6. Slash Command Menu

- [x] 6.1 Create `packages/editor/src/editor/SlashMenu.tsx` — React component for slash menu UI with type-ahead filtering and keyboard navigation (Arrow keys, Enter, Escape).
- [x] 6.2 Wire slash menu into OrqaEditor using `slashFactory` and `SlashProvider` from `@milkdown/plugin-slash`.
- [x] 6.3 Slash menu items: Heading 1-3, Bullet List, Ordered List, Code Block, Table, Blockquote, Horizontal Rule, Mermaid Diagram.

## 7. Keyboard Shortcuts & UX

- [x] 7.1 Add Google Docs-style keyboard shortcuts via keymap context overrides: Mod-Shift-1 through 6 for headings, Mod-Shift-7 for ordered list, Mod-Shift-8 for bullet list, Mod-Shift-9 for blockquote, Mod-Shift-C for code block.
- [x] 7.2 Enable Shift+Enter hard breaks in table cells by overriding `hardbreakFilterNodes` to exclude `table`.
- [x] 7.3 Create `linkClickPlugin` using `$prose` — Cmd/Ctrl+Click on links opens URL in external browser via `window.electronAPI.webview.openExternal`.
- [x] 7.4 Decouple link handling — add `onLinkClick` callback prop to `OrqaEditorProps`, remove direct `window.electronAPI` dependency from editor package.

## 8. Theming & CSS

- [x] 8.1 Create `milkdown-overrides.css` — editor padding (48px 64px), paragraph line-height (1.8), heading margins, link styling.
- [x] 8.2 Table styling — row-based alternating colors, bold header with prominent background, white outer border. Override nord column-striping with triple-class selectors for specificity.
- [x] 8.3 Neutral color scheme — override nord's blue accents on code blocks, list markers, and blockquote borders with neutral rgba tones.
- [x] 8.4 Slash menu dropdown styling — dark background, rounded corners, hover/active states.
- [x] 8.5 Diagram block styling — border, padding, click-to-edit cursor, error state, editor textarea.

## 9. Final Verification

- [x] 9.1 Run `pnpm build` and verify no TypeScript or build errors.
- [x] 9.2 Verify mermaid split-pane edit mode works with live preview.
- [x] 9.3 Verify link click callback prop works correctly.
