## Context

Orqa Note uses a file-watching + auto-save architecture where Chokidar monitors the filesystem and auto-save writes editor content to disk on a 2s debounce, blur, and visibility-hide. When an external change is detected, the system checks `tab.isDirty` to decide whether to reload — if dirty, external changes are silently ignored.

The problem: Milkdown's markdown serializer normalizes content on load, causing `markdownUpdated` to fire even without user edits. This marks the tab as spuriously dirty, which blocks external change reloads and causes auto-save to write stale content back to disk.

Key files:
- `apps/desktop/src/renderer/hooks/use-file-editor.ts` — file loading, saving, dirty state
- `apps/desktop/src/renderer/hooks/use-fs-events.ts` — external change detection with dirty guard
- `packages/shared/src/hooks/use-auto-save.ts` — debounced auto-save with blur/hide triggers
- `apps/desktop/src/renderer/components/content/ContentArea.tsx` — editor wiring

## Goals / Non-Goals

**Goals:**
- External file changes always reload into the editor (disk is source of truth)
- Auto-save never writes content that hasn't actually changed from the user's perspective
- Eliminate spurious dirty state caused by serialization normalization

**Non-Goals:**
- Conflict resolution UI (dialogs, merge) — disk wins, auto-save is frequent enough
- Undo/redo preservation across reloads — editor re-initializes on reload
- Handling the spreadsheet editor — it has a separate binary content pipeline and does not use `useFileEditor`

## Decisions

### 1. Content baseline stored in `useFileEditor` hook

**Decision**: After the editor loads and initializes, capture a `baseline` string — the editor's own serialized output. Store this alongside `content` in the `useFileEditor` hook.

**Why**: The baseline must be the editor's serialized output (not the raw file bytes) to neutralize serialization mismatch. Storing it in `useFileEditor` co-locates it with the content lifecycle (load, save, reload).

**Alternative considered**: Store baseline in the tab store. Rejected — it would bloat the store with potentially large strings and the baseline is only meaningful to the active editor instance.

### 2. Auto-save skips write when content matches baseline

**Decision**: Extend `useAutoSave` (or the save path in `useFileEditor`) to compare serialized editor content against the baseline before writing. If identical, skip the write and clear dirty.

**Why**: This prevents the serialization-mismatch feedback loop where loading a file → marks dirty → auto-save writes normalized content → triggers watcher → reload cycle.

**Alternative considered**: Suppress the initial `markdownUpdated` event. Rejected — fragile (timing-dependent, varies by editor framework) and doesn't prevent the same issue on reloads.

### 3. Always reload on external change (remove dirty guard)

**Decision**: In `use-fs-events.ts`, remove the `!tab.isDirty` check. Always bump `contentVersion` when an external change is detected (after filtering self-writes).

**Why**: With auto-save firing every 2s + on blur/hide, the editor's real changes reach disk almost immediately. The risk window for losing unsaved edits is negligible. This simplifies the mental model: disk is always truth.

**Alternative considered**: Keep dirty guard but add baseline comparison to distinguish real edits. Considered viable but adds complexity for marginal benefit given the aggressive auto-save schedule.

### 4. Baseline update lifecycle

**Decision**: The baseline is updated at three points:
1. **After initial load**: Editor calls a `setBaseline(serialized)` callback after mounting
2. **After save**: `handleSave` updates baseline to the content just saved
3. **After reload**: Same as initial load — editor re-mounts, calls `setBaseline` again

**Why**: Keeping baseline in sync with "what disk has" (from the editor's perspective) ensures accurate comparison at all times.

### 5. Editor exposes `getContent()` for baseline capture

**Decision**: Add a `getContent(): string` method to editor handles (`OrqaEditorHandle`, `CodeEditorHandle`). The parent calls this after mount to capture the baseline.

**Why**: The parent component needs the serialized content to set the baseline, and the editor is the only component that can serialize its internal state. This is a thin addition to the existing imperative handle pattern.

## Risks / Trade-offs

**[Risk] Reload during active typing** → With the dirty guard removed, if a user is actively typing and an external change arrives, the editor will reload and lose their in-progress keystrokes. → Mitigation: Auto-save fires on a 2s debounce, so at most 2s of typing could be lost. This is an acceptable trade-off for a local-first note app. If this becomes a problem, we can add a brief "typing cooldown" before reloading.

**[Risk] Baseline comparison cost for large files** → Comparing full content strings on every auto-save tick. → Mitigation: String comparison is O(n) and modern JS engines optimize this heavily. For note-sized files (< 1MB typically), this is negligible. Could hash if needed later.

**[Risk] Monaco/Code editor serialization** → Monaco's getValue() is generally stable (no normalization), so the baseline comparison may be unnecessary for code files. → Mitigation: Apply the same pattern uniformly. The skip-if-unchanged check is cheap and harmless even when it never triggers.
