## Context

Commit `89be454` ("fix: always reload editor from disk on external file changes") introduced a `contentVersion` field on tabs. When the FS watcher reports a `change` event for an open file, `contentVersion` is incremented. `ContentArea.tsx` includes `contentVersion` in the React `key` of each editor (`reloadKey = "${tab.id}:${contentVersion ?? 0}"`), so an external change forcibly remounts the editor and re-reads the file from disk.

To prevent that mechanism from reacting to the editor's own writes, the FS event handler in `apps/desktop/src/renderer/hooks/use-fs-events.ts` exposes `markSelfWritten(filePath)` and the watcher's change handler calls `consumeSelfWritten(event.path)` first, returning early if a recent self-write cookie is present.

Three of the four file-editor types (`MarkdownEditor`, `CodeFileEditor`, `ExcalidrawFileEditor`) reach the file system through the shared `useFileEditor` hook (`apps/desktop/src/renderer/hooks/use-file-editor.ts`). That hook calls `markSelfWritten(filePath)` immediately before `window.electronAPI.fs.writeFile(...)`. The fourth type, `SpreadsheetFileEditor`, is inlined in `ContentArea.tsx` and writes directly via `window.electronAPI.fs.writeFile` / `writeBinaryFile` without that registration.

Separately, the spreadsheet's dirty-state signal comes from Univer via `univerAPI.onCommandExecuted`. That callback fires for every command — including non-mutating ones such as selection, viewport, focus, and scroll — so the tab is marked dirty before any real edit. Combined with the missing `markSelfWritten`, this produces an observable refresh loop on file open: load → spurious dirty → auto-save → external-change misclassification → remount → repeat.

## Goals / Non-Goals

**Goals:**
- Stop the refresh loop on opening a CSV or XLSX file.
- Eliminate spurious "dirty" state caused by non-mutating Univer commands.
- Match the self-write convention already used by markdown, code, and excalidraw editors.
- Keep the fix narrow: only `ContentArea.tsx` and `useSpreadsheet.ts` change.

**Non-Goals:**
- Refactoring `SpreadsheetFileEditor` to use the shared `useFileEditor` hook (deferred).
- Adopting a content-baseline mechanism for spreadsheets (deferred — `Uint8Array` and `IWorkbookData` equality have different semantics than string comparison and merit their own change).
- Changing the disk-wins reload policy itself.
- Touching markdown, code, or excalidraw paths.

## Decisions

### Decision 1: Call `markSelfWritten(filePath)` inside `SpreadsheetFileEditor.handleSave`

`handleSave` already lives in `ContentArea.tsx` and has access to `filePath`. The call happens before the IPC write, mirroring `useFileEditor.handleSave`:

```
markSelfWritten(filePath)
await window.electronAPI.fs.writeFile(filePath, saveData)  // or writeBinaryFile
```

The 2-second cookie window in `use-fs-events.ts` is wider than the time between IPC write and the resulting watcher event for any plausible disk, so a single `markSelfWritten` per save is sufficient.

**Alternatives considered:**
- *Move the spreadsheet save through `useFileEditor`.* That would require `useFileEditor` to handle binary data. Strictly larger surface; deferred.
- *Have the IPC layer auto-register every renderer-initiated write as self-written.* Cleaner long-term but a wider behavior change — would also suppress watcher events for renderer writes that are not editor saves (e.g., file-tree rename). Out of scope.

### Decision 2: Filter `onCommandExecuted` to mutation commands only

In `useSpreadsheet.ts`, the listener becomes:

```
const disposable = univerAPI.onCommandExecuted((commandInfo) => {
  if (commandInfo.type !== CommandType.MUTATION) return
  onChangeRef.current?.()
})
```

`CommandType` is imported from `@univerjs/core` (already a transitive dep — Univer presets re-export it). Mutations are the only command class that change persistent workbook state; selection/operation/command-only events do not. The intent of `onChange` is "the workbook content changed," so this filter aligns the implementation with the intent.

**Alternatives considered:**
- *Compare serialized workbook before/after each command and fire `onChange` only on diff.* Correct but expensive — serializing on every keystroke and selection move would be wasteful, and Univer already classifies commands for us.
- *Listen to a more specific Univer event such as a sheet-data-mutation observable.* Univer's public API surface for this is the command system; using `CommandType.MUTATION` is the documented filter.
- *Debounce `onChange` to suppress the init burst.* Hides the symptom but doesn't fix the underlying classification. The tab would still flicker dirty.

## Risks / Trade-offs

- **Risk: `CommandType.MUTATION` import path differs across Univer versions** → Mitigation: import from `@univerjs/core` (the canonical location); verify with TypeScript at build time.
- **Risk: A real cell mutation that for some reason is dispatched as a non-`MUTATION` command would be missed** → Mitigation: smoke-test cell edit, formula edit, formatting, sheet add/remove during verification. Univer's own architecture treats persistent state changes as mutations, so this is unlikely.
- **Risk: The 2-second `selfWrittenPaths` window expires before the watcher event arrives on a slow filesystem** → Mitigation: existing window is shared with all other editors and has been stable in production. Not changing it here.
- **Trade-off: The spreadsheet path remains divergent from `useFileEditor`** → Accepted. The divergence class is acknowledged in proposal Out-of-Scope and tracked for a future structural change.
