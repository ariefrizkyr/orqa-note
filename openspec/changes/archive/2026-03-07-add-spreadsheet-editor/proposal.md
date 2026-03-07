## Why

Product Managers need offline spreadsheet capabilities for impact estimation, RICE/ICE scoring, capacity planning, and quick data analysis. Currently, CSV and XLSX files either open in Monaco as raw text or fall through to "Preview not available." The app already supports Google Sheets via webview bookmarks, but that requires internet access and a Google account. A native spreadsheet editor fills this gap.

## What Changes

- Add a new `@orqa-note/spreadsheet` package wrapping Univer Sheets with full spreadsheet capabilities (formulas, cell formatting, multiple sheets)
- Support opening and editing `.xlsx` files with formula and formatting persistence
- Support opening and editing `.csv` files in a spreadsheet UI (saving back as CSV)
- Add `fs:writeBinaryFile` IPC channel to support saving binary formats (XLSX)
- Route `.xlsx` and `.csv` extensions to the new spreadsheet editor in ContentArea
- Enable creating new blank `.xlsx` files from the sidebar

## Capabilities

### New Capabilities
- `spreadsheet-editor`: Core spreadsheet component with Univer Sheets integration, cell editing, formulas, formatting, and multi-sheet support
- `spreadsheet-file-io`: XLSX and CSV file reading, writing, and format conversion through IPC and serialization layer

### Modified Capabilities
- `file-tree-sidebar`: Add "New Spreadsheet" option to file creation context menu
- `tab-system`: Route `.xlsx` and `.csv` file tabs to the spreadsheet editor

## Impact

- **New package**: `packages/spreadsheet/` — depends on `@univerjs/presets`, `@univerjs/preset-sheets-core`, `@zwight/luckyexcel`, `papaparse`
- **IPC layer**: New `fs:writeBinaryFile` handler in main process, preload bridge, and type definition
- **ContentArea routing**: New extension-based route for `.xlsx` and `.csv` before the binary file check
- **Bundle size**: Univer adds ~1-2MB to the renderer bundle (acceptable for Electron)
- **Dependencies**: PapaParse for CSV parsing/serialization, `@zwight/luckyexcel` for XLSX↔Univer conversion
