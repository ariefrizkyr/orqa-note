## Why

Users need a way to create and edit visual diagrams, sketches, and whiteboard-style canvases directly within the app. Currently, visual content is limited to Mermaid diagrams (code-based). An Excalidraw-based canvas editor enables freeform drawing — architecture diagrams, wireframes, flowcharts, and quick sketches — without leaving the workspace.

## What Changes

- Add a new `@orqa-note/excalidraw` package wrapping the official `@excalidraw/excalidraw` React component
- Route `.excalidraw` files to the new editor in `ContentArea.tsx`
- Add "New Canvas" option to the sidebar context menu and New Tab screen
- Apply dark theme styling to match the app's neutral-900 aesthetic
- `.excalidraw` files stored as JSON (text-based read/write, same as markdown)
- Export to PNG/SVG via Excalidraw's built-in menu, saving to disk via Electron save dialog

## Capabilities

### New Capabilities
- `excalidraw-editor`: Wrapping the Excalidraw React component with save/load, dark theming, ref-based handle for auto-save integration, and PNG/SVG export via built-in menu
- `excalidraw-file-io`: Creating, reading, and writing `.excalidraw` files as JSON text, routing the extension to the editor, and adding creation entry points (context menu, new tab screen)

### Modified Capabilities

## Impact

- **New package**: `packages/excalidraw` with `@excalidraw/excalidraw` dependency
- **Modified files**: `ContentArea.tsx`, `ContextMenu.tsx`, `Sidebar.tsx`, `NewTabScreen.tsx`
- **Bundle size**: ~1.5MB+ addition from `@excalidraw/excalidraw` (acceptable for desktop app)
- **No backend changes**: Pure frontend, text-based file I/O using existing `readFile`/`writeFile` APIs
