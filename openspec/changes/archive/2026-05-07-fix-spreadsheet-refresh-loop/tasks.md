## 1. Filter Univer commands to mutations only

- [x] 1.1 In `packages/spreadsheet/src/useSpreadsheet.ts`, add `CommandType` to the imports from `@univerjs/core`.
- [x] 1.2 Update the `univerAPI.onCommandExecuted` callback to receive its `commandInfo` argument and early-return when `commandInfo.type !== CommandType.MUTATION`.
- [x] 1.3 Confirm `onChangeRef.current?.()` is only called inside the mutation branch.

## 2. Register self-write before spreadsheet save

- [x] 2.1 In `apps/desktop/src/renderer/components/content/ContentArea.tsx`, import `markSelfWritten` from `'../../hooks/use-fs-events'` (matching the import path style already used elsewhere).
- [x] 2.2 In `SpreadsheetFileEditor.handleSave`, call `markSelfWritten(filePath)` immediately before the `fs.writeFile` / `fs.writeBinaryFile` IPC call, on both the CSV and XLSX branches.
- [x] 2.3 Confirm the call ordering: `markSelfWritten` → `await write…` → `clearDirty` / `setSaveError(false)`.

## 3. Verify the loop is broken

- [x] 3.1 Run the desktop app, open a CSV file. Observe that the tab does not become dirty on open and the editor does not remount after the auto-save debounce window (2s).
- [x] 3.2 Repeat with an XLSX file.
- [x] 3.3 Edit a cell, wait for auto-save, confirm the file is written to disk exactly once and the editor does not remount.
- [x] 3.4 With the file open, modify it from outside the app (e.g., another editor or `echo` for CSV). Confirm `contentVersion` increments and the editor remounts with on-disk content (the disk-wins reload still works for genuine external changes).
- [x] 3.5 Click around cells, scroll the viewport, and switch sheets without editing. Confirm the tab does not become dirty.

## 4. Type-check and lint

- [x] 4.1 Run the project's TypeScript check across the monorepo and resolve any type errors introduced by the `CommandType` import or `commandInfo` parameter.
- [x] 4.2 Run the project's lint command and resolve any warnings introduced by the changes.
