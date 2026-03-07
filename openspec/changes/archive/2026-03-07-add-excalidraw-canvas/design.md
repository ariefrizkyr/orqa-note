## Context

The app uses a package-per-editor architecture: `@orqa-note/editor` (markdown), `@orqa-note/code-editor` (Monaco), `@orqa-note/spreadsheet` (Univer), `@orqa-note/pdf-viewer`. Each package exports a React component and a ref handle with a `save()` method. `ContentArea.tsx` routes file extensions to the appropriate editor. The sidebar context menu and New Tab screen provide file creation entry points.

`.excalidraw` files are JSON and already have an icon mapping in `file-utils.ts`.

## Goals / Non-Goals

**Goals:**
- Add an Excalidraw canvas editor following the existing package pattern
- Dark theme matching the app's neutral-900 aesthetic
- Auto-save integration via the existing `useAutoSave` hook
- Creation entry points in context menu and New Tab screen

**Non-Goals:**
- Real-time collaboration (requires custom WebSocket backend)
- Embedding Excalidraw drawings in markdown documents
- Custom Excalidraw libraries or asset management

## Decisions

### 1. New `packages/excalidraw` package

**Decision**: Create a standalone package, same as other editors.

**Rationale**: Follows the established pattern. Keeps the editor self-contained and the desktop app's dependency tree clean.

**Alternative**: Inline the component in the desktop app — rejected because it breaks the package-per-editor convention.

### 2. Text-based file I/O (not binary)

**Decision**: Use `readFile`/`writeFile` (string), not `readBinaryFile`/`writeBinaryFile`.

**Rationale**: `.excalidraw` files are JSON text. This matches the markdown editor's simpler data flow and avoids unnecessary Uint8Array handling.

### 3. Controlled vs uncontrolled Excalidraw

**Decision**: Use Excalidraw in uncontrolled mode — pass `initialData` once, then read state via the Excalidraw API ref on save.

**Rationale**: Excalidraw manages its own state internally. Fighting it with controlled state causes performance issues and re-render loops. The `excalidrawAPI` ref provides `getSceneElements()` and `getAppState()` for serialization on save.

### 4. Dark theme approach

**Decision**: Use Excalidraw's built-in `theme: "dark"` prop (`THEME.DARK`). The default dark background (`#121212`) is close enough to our neutral-900 (`#171717`) that CSS overrides are not needed.

**Rationale**: Excalidraw supports dark theme natively. The slight difference in background shade is acceptable and avoids fragile CSS overrides that could break on Excalidraw version updates.

### 5. Save format

**Decision**: Save the full Excalidraw scene JSON (`{ type, version, source, elements, appState, files }`), matching the standard `.excalidraw` format.

**Rationale**: Compatibility with excalidraw.com and other tools that read `.excalidraw` files. Users can open their files elsewhere if needed.

### 6. Export to PNG/SVG

**Decision**: Use Excalidraw's built-in export menu. Override the `UIOptions.canvasActions.export` or provide a custom `onExportImage` callback to intercept export and route it through Electron's save dialog (`window.electronAPI.fs.showSaveDialog`) to write to a user-chosen path.

**Rationale**: Excalidraw already has export UI (menu item with format options). No need to build custom UI. We just need to intercept the output and write to disk via Electron instead of browser download.

**Approach**: Use `exportToBlob()` for PNG and `exportToSvg()` for SVG from `@excalidraw/excalidraw` utilities. The `ExcalidrawEditor` accepts an `onExportImage` callback prop that the parent (`ContentArea`) wires to Electron's save dialog + file write.

## Risks / Trade-offs

- **Bundle size (~1.5MB+)** → Acceptable for desktop app; no lazy-loading needed since it's a dedicated editor view.
- **Excalidraw version churn** → Pin to a specific major version. The API surface we use (`initialData`, `excalidrawAPI`, `theme`) is stable.
- **AppState bloat in saved files** → Only persist relevant appState fields (viewBackgroundColor, theme) to keep files clean. Strip transient UI state (cursor position, selected elements, etc.).
