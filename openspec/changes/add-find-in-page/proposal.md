## Why

The markdown editor (Milkdown/ProseMirror) has no way to search within a document. The code editor (Monaco) already provides Cmd+F find/replace out of the box. Users expect the same capability when editing markdown files — especially in longer documents where scrolling to find specific text is impractical.

## What Changes

- Add find-in-page functionality to the markdown editor with:
  - Text search with match highlighting and navigation (next/prev)
  - Replace and replace-all
  - Case sensitivity toggle
  - Regex toggle
- Wire Cmd+F / Cmd+H keyboard shortcuts at the ProseMirror plugin level
- Expose `openFind()` on `OrqaEditorHandle` so the host app can trigger it programmatically

## Capabilities

### New Capabilities
- `find-in-page`: Find and replace functionality for the ProseMirror-based markdown editor, including search, highlight, navigation, replace, case sensitivity, and regex support.

### Modified Capabilities
- `wysiwyg-editor`: Adds find-in-page as a new feature within the existing editor, extending `OrqaEditorHandle` with `openFind()`.

## Impact

- **Packages**: `@orqa-note/editor` — new ProseMirror plugin, new React `<FindBar>` component, updated exports
- **Dependencies**: Adds `prosemirror-search` package
- **API surface**: `OrqaEditorHandle` gains `openFind()` method
- **Keyboard shortcuts**: Cmd+F and Cmd+H are intercepted at ProseMirror level when markdown editor is focused (no conflict with Monaco or global shortcuts)
