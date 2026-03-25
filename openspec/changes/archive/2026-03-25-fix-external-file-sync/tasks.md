## 1. Content Baseline Infrastructure

- [x] 1.1 Add `baseline` state and `setBaseline` callback to `useFileEditor` hook — stores the editor's serialized output after load
- [x] 1.2 Add `getContent(): string` method to `OrqaEditorHandle` that serializes the current document (with frontmatter) without triggering a save
- [x] 1.3 Add `getContent(): string` method to `CodeEditorHandle` that returns `model.getValue()` without triggering a save

## 2. Baseline Capture in Editor Components

- [x] 2.1 In `MarkdownEditor` (ContentArea.tsx), call `editorRef.current.getContent()` after mount to set baseline via `setBaseline`
- [x] 2.2 In `CodeFileEditor` (ContentArea.tsx), call `editorRef.current.getContent()` after mount to set baseline via `setBaseline`
- [x] 2.3 Update `handleSave` in `useFileEditor` to update baseline after successful write

## 3. Auto-Save Baseline Check

- [x] 3.1 Modify auto-save wiring in `MarkdownEditor` and `CodeFileEditor` to compare editor content against baseline before saving — skip write and clear dirty if content matches baseline
- [x] 3.2 Verify that the dirty indicator clears when auto-save skips a no-op write

## 4. External Change Always-Reload

- [x] 4.1 Remove the `!tab.isDirty` guard in `use-fs-events.ts` — always bump `contentVersion` on external change (after self-write filter)
- [x] 4.2 Verify baseline resets correctly after reload (editor re-mounts → getContent → setBaseline)

## 5. Validation

- [x] 5.1 Manual test: open file in Orqa Note, edit externally, verify editor reloads with external changes
- [x] 5.2 Manual test: type in Orqa Note, verify auto-save still writes to disk correctly
- [x] 5.3 Manual test: open file without editing, verify no spurious writes to disk (check file mtime)
