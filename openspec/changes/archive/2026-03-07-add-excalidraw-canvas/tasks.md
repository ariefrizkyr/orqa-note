## 1. Package Setup

- [x] 1.1 Create `packages/excalidraw/` with `package.json`, `tsconfig.json`, and `src/index.ts`
- [x] 1.2 Add `@excalidraw/excalidraw` dependency and configure package exports

## 2. Excalidraw Editor Component

- [x] 2.1 Create `ExcalidrawEditor.tsx` with `initialContent`, `onSave`, `onChange` props and `ExcalidrawEditorHandle` ref
- [x] 2.2 Implement `save()` on the ref handle — serialize elements/appState to JSON, strip transient fields, call `onSave`
- [x] 2.3 Apply dark theme via Excalidraw's `theme` prop and CSS overrides for neutral-900 background

## 3. Export Support

- [x] 3.1 Accept `onExportImage` callback prop in `ExcalidrawEditor` and hook it into Excalidraw's built-in export menu
- [x] 3.2 Use `exportToBlob()` for PNG and `exportToSvg()` for SVG from `@excalidraw/excalidraw`

## 4. File Routing and Editor Integration

- [x] 4.1 Add `ExcalidrawFileEditor` component in `ContentArea.tsx` using text-based `readFile`/`writeFile` and `useAutoSave`
- [x] 4.2 Wire `onExportImage` to Electron save dialog + file write in `ExcalidrawFileEditor`
- [x] 4.3 Route `.excalidraw` extension to `ExcalidrawFileEditor` in ContentArea's render logic

## 5. Creation Entry Points

- [x] 5.1 Add "New Canvas" action to `ContextMenu.tsx` with `onCreateCanvas` callback
- [x] 5.2 Add `handleStartCreateCanvas` in `Sidebar.tsx` with inline input defaulting to `Untitled.excalidraw`
- [x] 5.3 Add Canvas card to `FILE_CARDS` in `NewTabScreen.tsx`
