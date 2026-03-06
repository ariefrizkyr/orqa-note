## Context

The app routes files by extension: `.md` → Milkdown WYSIWYG, binary extensions → "Open in Default App", everything else → Monaco code editor. PDF is currently in the binary set, so it opens externally. This change adds in-app PDF rendering as a new content type.

The app already has a pattern for editor packages (`@orqa-note/editor`, `@orqa-note/code-editor`) — each is a self-contained React component package consumed by `ContentArea.tsx`.

## Goals / Non-Goals

**Goals:**
- Render PDFs inline in the tab system with continuous scroll
- Provide zoom controls and page navigation
- Support text selection and copy from PDF content
- Follow existing package conventions (`packages/pdf-viewer`)

**Non-Goals:**
- PDF annotation, highlighting, or any write operations
- PDF form filling
- PDF search (can be added later)
- Table of contents / outline navigation (can be added later)
- Printing (Electron's native print can handle this separately)

## Decisions

### 1. Library: `react-pdf` (wraps PDF.js)

**Chosen**: `react-pdf` v9+
**Alternatives considered**:
- Raw PDF.js — more control but significantly more boilerplate for React integration
- Electron webview with built-in PDF viewer — least control over UI, can't match app theme
- `@pdfslick/react` — newer, less community support

**Rationale**: `react-pdf` is the most popular React PDF library, well-maintained, provides `<Document>` and `<Page>` components that map cleanly to React patterns. Text layer support comes built-in. Aligns with the React-centric stack.

### 2. Rendering: Continuous scroll with virtualization

Render all pages in a scrollable container. For large PDFs, only render pages near the viewport to avoid memory issues. `react-pdf` supports this pattern natively.

The current page indicator updates based on scroll position (intersection observer on each page).

### 3. Package structure: `packages/pdf-viewer`

Follows existing convention. Exports:
- `PdfViewer` component — accepts `filePath: string` prop
- The component reads the file via the Electron IPC `fs.readFile` and passes the data to react-pdf

### 4. File reading: Binary buffer via IPC

PDF files must be read as binary (ArrayBuffer/Uint8Array), not as UTF-8 text. The existing `window.electronAPI.fs.readFile` may need to support a binary mode, or a new `readBinaryFile` IPC handler is added.

### 5. PDF.js worker: Bundled via CDN or local copy

`react-pdf` requires the PDF.js worker. Options:
- Copy worker to public/static assets at build time
- Use `pdfjs.GlobalWorkerOptions.workerSrc` pointing to a CDN

**Chosen**: Configure the worker from the `pdfjs-dist` package directly. Use `react-pdf`'s built-in worker configuration. This avoids CDN dependency (desktop app may be offline).

### 6. Toolbar: Minimal, matching app theme

A thin toolbar above the PDF content:
```
[ ◀ ] [ ▶ ]  Page 3 / 12  |  [ - ] 100% [ + ]  |  [ Fit Width ]
```
Styled with Tailwind, dark theme (`bg-neutral-900`, `text-neutral-300`), matching the existing app aesthetic.

### 7. Integration: ContentArea routing

Add a `.pdf` check before the binary extension check in `ContentArea.tsx`. Remove `pdf` from the binary extensions set in `code-editor` package.

## Risks / Trade-offs

- **Bundle size**: PDF.js worker adds ~2MB. → Acceptable for a desktop Electron app; not a web perf concern.
- **Memory with large PDFs**: Rendering all pages at once can use significant memory. → Mitigate by only rendering visible pages + a small buffer (virtualized scroll).
- **Binary file reading**: Current IPC may only support text reads. → May need a new `readBinaryFile` handler; low effort.
- **Worker setup in Electron**: PDF.js worker needs correct path resolution in Electron's renderer. → May need to configure worker path explicitly in the Vite config or copy the worker file.
