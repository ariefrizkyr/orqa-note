import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

export interface PdfViewerProps {
  data: Uint8Array
  filePath?: string
}

const MIN_ZOOM = 25
const MAX_ZOOM = 300
const ZOOM_STEP = 25
const PAGE_BUFFER = 3 // render this many pages above/below viewport

export function PdfViewer({ data }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [fitWidth, setFitWidth] = useState(false)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageInputValue, setPageInputValue] = useState('')
  const [isEditingPage, setIsEditingPage] = useState(false)
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number }>({ start: 1, end: 1 })

  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const pageInputRef = useRef<HTMLInputElement>(null)
  // Estimated page height for placeholder sizing (updated as pages render)
  const pageHeightRef = useRef<number>(800)

  const fileData = useMemo(() => ({ data }), [data])

  // Measure container width for fit-to-width
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Track current page and visible range via intersection observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0
        let mostVisiblePage = currentPage
        const visiblePages: number[] = []

        for (const entry of entries) {
          const page = Number(entry.target.getAttribute('data-page'))
          if (entry.isIntersecting) visiblePages.push(page)
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            mostVisiblePage = page
          }
        }

        if (maxRatio > 0) setCurrentPage(mostVisiblePage)

        if (visiblePages.length > 0) {
          const minVisible = Math.min(...visiblePages)
          const maxVisible = Math.max(...visiblePages)
          setVisibleRange({ start: minVisible, end: maxVisible })
        }
      },
      {
        root: containerRef.current,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    )
    observerRef.current = observer

    for (const el of pageRefs.current.values()) {
      observer.observe(el)
    }

    return () => observer.disconnect()
  }, [numPages, currentPage])

  // Register page ref for intersection observer
  const setPageRef = useCallback(
    (pageNum: number, el: HTMLDivElement | null) => {
      if (el) {
        pageRefs.current.set(pageNum, el)
        observerRef.current?.observe(el)
        // Update estimated page height from actual rendered page
        if (el.offsetHeight > 0) {
          pageHeightRef.current = el.offsetHeight
        }
      } else {
        const existing = pageRefs.current.get(pageNum)
        if (existing) observerRef.current?.unobserve(existing)
        pageRefs.current.delete(pageNum)
      }
    },
    [],
  )

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    setLoading(false)
    setError(null)
    setVisibleRange({ start: 1, end: Math.min(1 + PAGE_BUFFER, n) })
  }, [])

  const onDocumentLoadError = useCallback(() => {
    setError('Failed to load PDF. The file may be corrupt or not a valid PDF.')
    setLoading(false)
  }, [])

  const zoomIn = useCallback(() => {
    setFitWidth(false)
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))
  }, [])

  const zoomOut = useCallback(() => {
    setFitWidth(false)
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))
  }, [])

  const toggleFitWidth = useCallback(() => {
    setFitWidth((f) => !f)
  }, [])

  const scrollToPage = useCallback((page: number) => {
    const el = pageRefs.current.get(page)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      // Page not rendered yet — expand visible range and scroll after render
      setVisibleRange((prev) => ({
        start: Math.min(prev.start, page - PAGE_BUFFER),
        end: Math.max(prev.end, page + PAGE_BUFFER),
      }))
      // Use requestAnimationFrame to wait for render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const delayed = pageRefs.current.get(page)
          delayed?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      })
    }
  }, [])

  const goToPrevPage = useCallback(() => {
    if (currentPage <= 1) return
    scrollToPage(currentPage - 1)
  }, [currentPage, scrollToPage])

  const goToNextPage = useCallback(() => {
    if (currentPage >= numPages) return
    scrollToPage(currentPage + 1)
  }, [currentPage, numPages, scrollToPage])

  const handlePageInputSubmit = useCallback(() => {
    const page = parseInt(pageInputValue, 10)
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      scrollToPage(page)
    }
    setIsEditingPage(false)
  }, [pageInputValue, numPages, scrollToPage])

  const handlePageInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit()
    } else if (e.key === 'Escape') {
      setIsEditingPage(false)
    }
  }, [handlePageInputSubmit])

  const startEditingPage = useCallback(() => {
    setPageInputValue(String(currentPage))
    setIsEditingPage(true)
    requestAnimationFrame(() => pageInputRef.current?.select())
  }, [currentPage])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        zoomIn()
      } else if (mod && e.key === '-') {
        e.preventDefault()
        zoomOut()
      } else if (mod && e.key === '0') {
        e.preventDefault()
        toggleFitWidth()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [zoomIn, zoomOut, toggleFitWidth])

  // Compute page width
  const pageWidth = fitWidth && containerWidth
    ? containerWidth - 48 // 24px padding on each side
    : undefined

  const scale = fitWidth ? undefined : zoom / 100

  // Determine which pages to render (virtualized)
  const renderStart = Math.max(1, visibleRange.start - PAGE_BUFFER)
  const renderEnd = Math.min(numPages, visibleRange.end + PAGE_BUFFER)

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300">
        {/* Page navigation */}
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="rounded p-1 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Previous page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="rounded p-1 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Next page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <span className="mx-2 tabular-nums">
          Page{' '}
          {isEditingPage ? (
            <input
              ref={pageInputRef}
              type="number"
              min={1}
              max={numPages}
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onBlur={handlePageInputSubmit}
              onKeyDown={handlePageInputKeyDown}
              className="w-10 rounded border border-neutral-600 bg-neutral-800 px-1 text-center text-xs text-neutral-200 outline-none focus:border-neutral-400"
            />
          ) : (
            <button
              onClick={startEditingPage}
              className="rounded px-1 hover:bg-neutral-700"
              title="Click to jump to page"
            >
              {currentPage}
            </button>
          )}
          {' / '}{numPages || '\u2014'}
        </span>

        <div className="mx-2 h-4 w-px bg-neutral-700" />

        {/* Zoom controls */}
        <button
          onClick={zoomOut}
          disabled={!fitWidth && zoom <= MIN_ZOOM}
          className="rounded p-1 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Zoom out (Cmd+-)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <span className="mx-1 w-10 text-center tabular-nums">
          {fitWidth ? 'Fit' : `${zoom}%`}
        </span>

        <button
          onClick={zoomIn}
          disabled={!fitWidth && zoom >= MAX_ZOOM}
          className="rounded p-1 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Zoom in (Cmd+=)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <div className="mx-2 h-4 w-px bg-neutral-700" />

        <button
          onClick={toggleFitWidth}
          className={`rounded px-2 py-1 hover:bg-neutral-700 ${fitWidth ? 'bg-neutral-700 text-white' : ''}`}
          title="Fit to width (Cmd+0)"
        >
          Fit Width
        </button>
      </div>

      {/* PDF pages */}
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto bg-neutral-800"
      >
        {loading && (
          <div className="flex h-full items-center justify-center text-neutral-500">
            <p className="text-sm">Loading PDF...</p>
          </div>
        )}
        <Document
          file={fileData}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
        >
          <div className="flex flex-col items-center gap-4 py-6">
            {Array.from({ length: numPages }, (_, i) => {
              const pageNum = i + 1
              const shouldRender = pageNum >= renderStart && pageNum <= renderEnd
              return (
                <div
                  key={pageNum}
                  ref={(el) => setPageRef(pageNum, el)}
                  data-page={pageNum}
                  className="shadow-lg"
                  style={!shouldRender ? { height: pageHeightRef.current, width: '100%' } : undefined}
                >
                  {shouldRender && (
                    <Page
                      pageNumber={pageNum}
                      scale={scale}
                      width={pageWidth}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </Document>
      </div>
    </div>
  )
}
