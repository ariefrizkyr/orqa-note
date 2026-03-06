## 1. Package Setup

- [x] 1.1 Create `packages/pdf-viewer` with `package.json`, `tsconfig.json`, and entry point structure matching existing packages
- [x] 1.2 Add `react-pdf` and `pdfjs-dist` as dependencies
- [x] 1.3 Configure PDF.js worker for Electron (local worker file, not CDN)

## 2. Core PdfViewer Component

- [x] 2.1 Create `PdfViewer` component that accepts `data` (Uint8Array) prop and renders PDF pages with continuous scroll using `react-pdf`
- [x] 2.2 Add text layer rendering for text selection and copy support
- [x] 2.3 Add loading state while PDF is being parsed
- [x] 2.4 Add error state for invalid/corrupt PDF files

## 3. Toolbar and Controls

- [x] 3.1 Create PDF toolbar with zoom in/out buttons, zoom percentage display, and fit-to-width button
- [x] 3.2 Add page indicator ("Page X / Y") that updates on scroll via intersection observer
- [x] 3.3 Add previous/next page navigation buttons that scroll to the target page
- [x] 3.4 Add keyboard shortcuts for zoom (Cmd+/-, Cmd+0 for fit-width)

## 4. Integration with Desktop App

- [x] 4.1 Add binary file reading support to IPC (`readBinaryFile` handler or binary mode for existing `readFile`)
- [x] 4.2 Remove `pdf` from binary extensions set in `@orqa-note/code-editor`
- [x] 4.3 Add `.pdf` routing branch in `ContentArea.tsx` that reads the file as binary and passes data to `PdfViewer`
- [x] 4.4 Add `@orqa-note/pdf-viewer` as a dependency of `@orqa-note/desktop`
