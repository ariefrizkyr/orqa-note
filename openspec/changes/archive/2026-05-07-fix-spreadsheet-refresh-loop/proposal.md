## Why

CSV and XLSX files enter an infinite save→remount loop the moment they are opened. The `SpreadsheetFileEditor` skipped the two safety mechanisms that protect every other editor type from the disk-wins reload introduced in commit `89be454`: it never marks its own writes as self-written for the FS watcher to ignore, and its `onChange` fires on non-mutating Univer commands (selection, viewport, scroll), so the tab is dirty before the user touches anything. Auto-save then writes, the watcher treats the write as external, the editor remounts, and the cycle repeats.

## What Changes

- Spreadsheet save path SHALL call `markSelfWritten(filePath)` before writing to disk so the FS watcher does not misclassify our own writes as external file changes.
- Spreadsheet `onChange` SHALL only fire for Univer commands whose `type === CommandType.MUTATION`. Selection, viewport, focus, and scroll commands SHALL NOT mark the tab dirty.
- Out of scope (deferred): refactoring `SpreadsheetFileEditor` to use the shared `useFileEditor` hook and adopt the full content-baseline mechanism. The two changes above stop the loop without that larger structural shift.

## Capabilities

### New Capabilities
<!-- None — this change modifies existing capabilities. -->

### Modified Capabilities
- `spreadsheet-file-io`: Save path SHALL register the file as self-written before invoking the IPC write so the FS watcher's external-change handler skips its own writes.
- `spreadsheet-editor`: The dirty-state tracking requirement SHALL filter Univer command notifications to mutating commands only.

## Impact

- Code: `apps/desktop/src/renderer/components/content/ContentArea.tsx` (`SpreadsheetFileEditor.handleSave`), `packages/spreadsheet/src/useSpreadsheet.ts` (the `onCommandExecuted` listener).
- Behavior: Opening a CSV/XLSX file no longer marks the tab dirty on initialization, no longer triggers a spurious auto-save, and no longer remounts the editor on legitimate saves. Existing protections for markdown/code/excalidraw are unchanged.
- Dependencies: No new packages. Uses the existing `markSelfWritten` export from `apps/desktop/src/renderer/hooks/use-fs-events.ts` and `CommandType` from `@univerjs/core`.
- No IPC, no schema, no migration.
