## Context

Orqa Note is an Electron + React desktop app for PMs. It supports markdown editing (OrqaEditor), code editing (Monaco), PDF viewing, and webview bookmarks. Files open in tabs based on extension, routed in `ContentArea.tsx`. Each editor type lives in its own package under `packages/`.

Currently, `.csv` files open in Monaco as raw text. `.xlsx` files hit the binary check and show "Preview not available." PMs need native spreadsheet capabilities for impact estimation and data analysis without relying on Google Sheets (which requires internet).

The IPC layer supports both text (`fs:readFile`) and binary (`fs:readBinaryFile`) reads, but only text writes (`fs:writeFile`). XLSX requires binary write support.

## Goals / Non-Goals

**Goals:**
- Native spreadsheet editor with formulas, cell formatting, and multiple sheets
- Open and save `.xlsx` files with full fidelity (formulas, formatting, sheet tabs)
- Open and save `.csv` files in a spreadsheet UI
- Follow existing package architecture (`packages/spreadsheet/`)
- Follow existing ContentArea routing pattern
- Auto-save integration via existing `useAutoSave` hook

**Non-Goals:**
- Replacing Google Sheets webview bookmark support
- Document editor (Univer Doc) or presentation editor (Univer Slide)
- Real-time collaboration or cloud sync
- Macro/VBA support
- Pivot tables or chart rendering
- Import/export formats beyond CSV and XLSX (e.g., ODS, TSV)

## Decisions

### 1. Univer Sheets as the spreadsheet engine

**Choice**: Univer (`@univerjs/*`) via the presets API (`@univerjs/presets`, `@univerjs/preset-sheets-core`)
**Over**: AG Grid + HyperFormula, FortuneSheet, react-data-grid, Glide Data Grid

**Rationale**:
- Univer is a purpose-built spreadsheet engine, not a data grid with formulas bolted on
- Apache 2.0 license (FortuneSheet depends on HyperFormula which is GPLv3)
- Full formula engine (1000+ functions) included natively
- Cell formatting, borders, merge, freeze panes, sheet tabs all built-in
- Actively maintained by a funded team with good documentation
- Production-ready for the sheets component specifically
- XLSX import/export handled by `@zwight/luckyexcel` (the built-in `@univerjs/sheets-import-export` is a paid pro feature)

**Trade-off**: ~1-2MB bundle size increase. Acceptable in Electron where bundle size is less constrained than web apps.

### 2. PapaParse for CSV handling

**Choice**: PapaParse for CSV parse/serialize
**Rationale**: Industry standard, handles edge cases (quoted fields, newlines in values, delimiter detection), tiny footprint. Univer's import/export plugin focuses on XLSX; CSV conversion is better handled explicitly.

### 3. New `fs:writeBinaryFile` IPC channel

**Choice**: Add a dedicated binary write channel rather than encoding XLSX as base64 through the existing text `writeFile`.
**Rationale**: Matches the existing `readBinaryFile` pattern. Avoids base64 encoding overhead and potential corruption. Clean separation of text vs binary file operations.

### 4. Package structure: `packages/spreadsheet/`

**Choice**: New package following existing conventions.
**Rationale**: Consistent with `packages/editor/`, `packages/code-editor/`, `packages/pdf-viewer/`. Keeps Univer dependencies isolated. Clean import: `import { SpreadsheetEditor } from '@orqa-note/spreadsheet'`.

### 5. Save strategy: serialize on save, not on every keystroke

**Choice**: On save, serialize the Univer workbook to XLSX bytes (or CSV string) and write to disk. Use the existing `useAutoSave` hook with dirty tracking.
**Rationale**: Serializing a full workbook on every cell edit would be expensive. The dirty flag approach (mark dirty on change, serialize on save) matches how the markdown and code editors already work.

### 6. CSV saves as CSV, XLSX saves as XLSX

**Choice**: Preserve the original format on save. No automatic format conversion.
**Rationale**: Least-surprise behavior. A PM opening a CSV expects it to save as CSV. If they need formulas to persist, they should create/use an XLSX file. The UI could offer "Save As XLSX" in the future, but that's out of scope for this change.

**Implication**: Formulas entered in a CSV file will be evaluated and saved as their computed values (since CSV can't store formulas). This is standard spreadsheet behavior.

## Risks / Trade-offs

- **Univer CSS conflicts** — Univer ships its own styles. May conflict with Tailwind dark theme. → Scope Univer styles to the spreadsheet container div. Test dark theme integration early.

- **XLSX fidelity** — Complex Excel files (conditional formatting, pivot tables, macros) may not round-trip perfectly. → Acceptable for PM use case (simple tables, formulas, basic formatting). Document known limitations.

- **Bundle size** — Univer adds ~1-2MB. → Acceptable for Electron. Could lazy-load the package if startup time is affected.

- **Univer version stability** — Univer is actively evolving; API may change between major versions. → Pin to a specific version range. Isolate behind the package boundary so upgrades only affect `packages/spreadsheet/`.

- **CSV formula loss** — Formulas in CSV files can't be persisted. → Clear trade-off: use XLSX for formula persistence. Could show a subtle indicator when editing CSV that formulas won't be saved.

- **Large file performance** — Very large XLSX files (100K+ rows) may be slow to load/parse. → Univer handles virtualized rendering. The bottleneck is initial parse time. Acceptable for PM workloads which are typically under 10K rows.
