## Context

The markdown editor uses Milkdown (ProseMirror-based WYSIWYG) in `@orqa-note/editor`. Unlike the Monaco code editor which has built-in Cmd+F find/replace, the markdown editor has no in-document search. The editor is structured as a reusable React package with ProseMirror plugins for custom behavior (table hardbreaks, link clicks, slash menu).

## Goals / Non-Goals

**Goals:**
- Full find-in-page: search, highlight, navigate, replace, replace-all
- Case sensitivity and regex toggles
- Keyboard-driven (Cmd+F, Cmd+H, Enter/Shift+Enter, Escape)
- Consistent with existing editor architecture (ProseMirror plugin + React UI)

**Non-Goals:**
- Cross-file search (that's fuzzy search / Cmd+K territory)
- Find-in-page for the code editor (Monaco already has it)
- Structural search (find by heading level, node type, etc.)

## Decisions

### 1. Use `prosemirror-search` as the search engine

**Choice**: Official `prosemirror-search` package by Marijn Haverbeke.

**Rationale**: Handles the hard parts — text position mapping across ProseMirror's node tree, decoration management for highlights, and search cursor logic. Well-maintained by the ProseMirror author. Supports plain text, case-insensitive, and regex search modes.

**Alternatives considered**:
- `prosemirror-find-replace` (community) — less maintained, fewer features
- Custom plugin from scratch — significant effort to handle node tree traversal correctly, no benefit over the official solution

### 2. State lives in ProseMirror plugin, React is UI-only

**Choice**: The search query, match results, active match index, and decorations are managed inside a ProseMirror plugin's state. The React `<FindBar>` reads this state and dispatches ProseMirror transactions to update it.

**Rationale**: Avoids state sync issues between React and ProseMirror. The plugin can react to document changes (re-running search when text changes) without React involvement. This is how `prosemirror-search` is designed to work.

**Alternatives considered**:
- React state driving ProseMirror commands — creates sync lag, harder to keep decorations in step with doc changes

### 3. FindBar as floating overlay inside editor

**Choice**: A React component rendered above the editor content, positioned top-right, similar to VS Code / Monaco's find widget.

**Rationale**: Familiar UX pattern. Doesn't consume document layout space. Can overlay without affecting editor scroll position.

### 4. Keyboard shortcuts at ProseMirror level

**Choice**: Cmd+F and Cmd+H are handled by a ProseMirror keymap plugin, not the global `use-keyboard.ts`.

**Rationale**: The shortcuts should only activate when the markdown editor is focused. Monaco handles its own Cmd+F. The global keyboard handler doesn't need to know about editor-specific features.

### 5. Expose `openFind()` on OrqaEditorHandle

**Choice**: Extend the existing imperative handle to include `openFind()` so the host app can programmatically trigger the find bar.

**Rationale**: Keeps the editor package's API consistent (handle already exposes `save()`). Enables future integration with app-level menus or commands.

## Risks / Trade-offs

- **`prosemirror-search` API stability** — It's an official package but may have breaking changes. Mitigation: pin version, wrap integration in our own plugin module.
- **Cmd+F browser/Electron interception** — Electron may intercept Cmd+F for native find. Mitigation: ProseMirror's keymap runs before browser defaults when the editor is focused; if needed, disable the Electron menu accelerator for Cmd+F on the markdown editor view.
- **Performance on large documents** — Regex search on very large docs could be slow. Mitigation: `prosemirror-search` handles this efficiently via ProseMirror's document model; debounce search input updates.
- **Replace in rich text** — Replacing text in a WYSIWYG editor must preserve surrounding marks (bold, links, etc.). Mitigation: `prosemirror-search` uses ProseMirror transactions which preserve marks by default.
