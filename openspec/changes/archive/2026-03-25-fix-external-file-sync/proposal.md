## Why

When a user has a file open in Orqa Note and edits that same file externally, the external changes get overwritten by auto-save. This happens because Milkdown's markdown serializer produces slightly different output than the input on load, spuriously marking the tab as "dirty." The dirty-state guard then blocks external change reloads, and auto-save writes stale content back to disk — silently destroying the external edits.

## What Changes

- Introduce a **content baseline** mechanism: after loading or reloading a file, capture the editor's serialized output as the baseline. Auto-save compares against this baseline and skips the write if content hasn't actually changed.
- Change external file change handling to **always reload from disk** (disk is source of truth), removing the dirty-state guard that currently blocks reloads.
- Remove the conflict dialog requirement from the auto-save spec — disk always wins, and auto-save fires frequently enough (2s debounce + blur/hide) that the window for data loss is negligible.

## Capabilities

### New Capabilities
- `content-baseline`: Track a content baseline (editor's own serialized output after load) to distinguish real user edits from serialization noise. Used by auto-save to skip no-op writes and by the sync system to determine reload safety.

### Modified Capabilities
- `auto-save`: Remove the conflict dialog requirement. Auto-save should skip writes when editor content matches the baseline (no real user changes). External changes always trigger a reload regardless of dirty state.

## Impact

- `apps/desktop/src/renderer/hooks/use-file-editor.ts` — add baseline tracking, expose baseline comparison for auto-save
- `apps/desktop/src/renderer/hooks/use-fs-events.ts` — remove `!tab.isDirty` guard on external change reload
- `packages/shared/src/hooks/use-auto-save.ts` — accept a "has real changes" check instead of relying solely on `isDirty`
- `apps/desktop/src/renderer/components/content/ContentArea.tsx` — wire baseline into auto-save and editor components
- `packages/editor/src/editor/OrqaEditor.tsx` — expose a method to get serialized content for baseline capture
- `packages/code-editor/src/editor/CodeEditor.tsx` — same for code editor
- `packages/excalidraw/src/ExcalidrawEditor.tsx` — same for excalidraw editor
