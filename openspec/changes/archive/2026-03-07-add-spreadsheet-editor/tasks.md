## 1. IPC Layer — Binary Write Support

- [x] 1.1 Add `fs:writeBinaryFile` handler in `apps/desktop/src/main/ipc/fs-handlers.ts` (accept filePath + Uint8Array, validate workspace boundary, write to disk)
- [x] 1.2 Add `writeBinaryFile` to `ElectronAPI.fs` type in `apps/desktop/src/shared/types.ts`
- [x] 1.3 Bridge `fs:writeBinaryFile` in `apps/desktop/src/preload/index.ts`

## 2. Package Setup — `packages/spreadsheet/`

- [x] 2.1 Create `packages/spreadsheet/package.json` with dependencies: `@univerjs/presets`, `@univerjs/preset-sheets-core`, `exceljs`, `papaparse`, `react`
- [x] 2.2 Create `packages/spreadsheet/tsconfig.json` extending base tsconfig
- [x] 2.3 Add `@orqa-note/spreadsheet` dependency to `apps/desktop/package.json`

## 3. Serialization Layer

- [x] 3.1 Create `packages/spreadsheet/src/serialization.ts` — CSV-to-Univer workbook conversion using PapaParse (parse CSV string → IWorkbookData with single sheet, first row as headers)
- [x] 3.2 Add Univer-to-CSV serialization (extract active sheet data → PapaParse unparse → CSV string, using computed formula values)
- [x] 3.3 Add XLSX import/export wiring using `@zwight/luckyexcel` (binary Uint8Array ↔ Univer workbook)

## 4. Core Spreadsheet Component

- [x] 4.1 Create `packages/spreadsheet/src/useSpreadsheet.ts` — hook managing Univer instance lifecycle (create, register plugins, load workbook, subscribe to command changes, dispose on unmount)
- [x] 4.2 Create `packages/spreadsheet/src/SpreadsheetEditor.tsx` — React component rendering Univer into a container div, accepting props: `data`, `fileType`, `onSave`, `onChange`
- [x] 4.3 Implement save method that serializes workbook to XLSX bytes or CSV string based on fileType and calls onSave
- [x] 4.4 Implement dirty tracking by subscribing to Univer command execution events and calling onChange
- [x] 4.5 Create `packages/spreadsheet/src/index.ts` — export SpreadsheetEditor component and types
- [x] 4.6 Style integration — import Univer CSS and apply dark theme overrides to match the app's Tailwind dark UI

## 5. ContentArea Integration

- [x] 5.1 Create `SpreadsheetFileEditor` wrapper component in `ContentArea.tsx` (handles file read/write, auto-save, error/loading states — following MarkdownEditor and PdfFileViewer patterns)
- [x] 5.2 Add extension routing in `ContentArea.tsx` — route `xlsx` and `csv` to SpreadsheetFileEditor before the binary file check
- [x] 5.3 Routing catches xlsx/csv before binary check — no exclusion list change needed

## 6. New Spreadsheet from Sidebar

- [x] 6.1 Add "New Spreadsheet" option to the file tree context menu (in `ContextMenu.tsx` and `Sidebar.tsx`)
- [x] 6.2 Implement blank XLSX file creation — generate a minimal empty workbook, serialize to XLSX bytes, write via `fs:writeBinaryFile`

## 7. Verification

- [ ] 7.1 Test opening an existing `.xlsx` file — verify formulas, formatting, and multiple sheets render correctly (manual: `pnpm dev`)
- [ ] 7.2 Test opening a `.csv` file — verify data displays in spreadsheet grid with first row as headers (manual: `pnpm dev`)
- [ ] 7.3 Test editing and auto-saving an XLSX file — verify changes persist on reopen (manual: `pnpm dev`)
- [ ] 7.4 Test editing and auto-saving a CSV file — verify formula values are saved as computed results (manual: `pnpm dev`)
- [ ] 7.5 Test creating a new spreadsheet from the sidebar — verify blank XLSX is created and opens (manual: `pnpm dev`)
- [ ] 7.6 Test dark theme — verify Univer styles integrate without visual conflicts (manual: `pnpm dev`)
