## Why

The app currently treats PDF files as binary — showing only an "Open in Default App" button. For a PM workspace, PDFs are core artifacts (PRDs, contracts, reports, design specs). Opening them externally breaks the tab-based workflow and forces context switching. An in-app PDF viewer keeps everything in one place.

## What Changes

- Add a new `@orqa-note/pdf-viewer` package with a React PDF viewing component
- Route `.pdf` files to the new viewer instead of the binary fallback screen
- Provide zoom controls (in/out/fit-to-width), continuous scroll, page navigation, and text selection
- Add a toolbar matching the app's existing dark theme

## Capabilities

### New Capabilities
- `pdf-viewer`: Read-only PDF viewing with zoom, scroll, page navigation, and text selection/copy

### Modified Capabilities
- `tab-system`: PDF files open in tabs as a new content type instead of showing the binary fallback

## Impact

- **New package**: `packages/pdf-viewer` — depends on `react-pdf` (wraps PDF.js, ~2MB worker)
- **Modified file**: `apps/desktop/src/renderer/components/content/ContentArea.tsx` — add `.pdf` routing branch
- **Modified file**: `packages/code-editor/src/editor/binary-extensions.ts` — remove `pdf` from binary list
- **Dependencies**: `react-pdf`, `pdfjs-dist` added to `packages/pdf-viewer`
