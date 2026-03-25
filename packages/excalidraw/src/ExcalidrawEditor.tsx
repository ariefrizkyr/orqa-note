import { useCallback, useImperativeHandle, forwardRef, useRef, useMemo } from 'react'
import { Excalidraw, exportToBlob, exportToSvg, THEME } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawImperativeAPI, ExcalidrawElement, AppState, BinaryFiles } from '@excalidraw/excalidraw/types'

export interface ExportImageData {
  blob: Blob
  suggestedName: string
  mimeType: string
}

export interface ExcalidrawEditorProps {
  initialContent: string
  name?: string
  onSave?: (content: string) => Promise<void>
  onChange?: () => void
  onReady?: (content: string) => void
  onExportImage?: (data: ExportImageData) => Promise<void>
}

export interface ExcalidrawEditorHandle {
  save: () => Promise<void>
  getContent: () => string | null
}

const PERSISTENT_APP_STATE_KEYS = new Set([
  'viewBackgroundColor',
  'theme',
  'gridSize',
  'gridStep',
  'gridColor',
])

function stripTransientAppState(appState: Partial<AppState>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  for (const key of PERSISTENT_APP_STATE_KEYS) {
    if (key in appState) {
      cleaned[key] = appState[key as keyof AppState]
    }
  }
  return cleaned
}

function serializeScene(
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
): string {
  return JSON.stringify(
    {
      type: 'excalidraw',
      version: 2,
      source: 'orqa-note',
      elements,
      appState: stripTransientAppState(appState),
      files,
    },
    null,
    2,
  )
}

function parseInitialData(content: string) {
  if (!content || content.trim() === '' || content.trim() === '{}') {
    return { elements: [], appState: { theme: THEME.DARK }, files: {} }
  }
  try {
    const parsed = JSON.parse(content)
    return {
      elements: parsed.elements || [],
      appState: { ...parsed.appState, theme: THEME.DARK },
      files: parsed.files || {},
    }
  } catch {
    return { elements: [], appState: { theme: THEME.DARK }, files: {} }
  }
}

export const ExcalidrawEditor = forwardRef<ExcalidrawEditorHandle, ExcalidrawEditorProps>(
  function ExcalidrawEditor({ initialContent, name, onSave, onChange, onReady, onExportImage }, ref) {
    const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
    const onReadyRef = useRef(onReady)
    onReadyRef.current = onReady

    const initialData = useMemo(() => parseInitialData(initialContent), [initialContent])

    const getContent = useCallback((): string | null => {
      const api = apiRef.current
      if (!api) return null
      const elements = api.getSceneElements()
      const appState = api.getAppState()
      const files = api.getFiles()
      return serializeScene(elements, appState, files)
    }, [])

    const save = useCallback(async () => {
      const json = getContent()
      if (json != null && onSave) {
        await onSave(json)
      }
    }, [getContent, onSave])

    useImperativeHandle(ref, () => ({ save, getContent }), [save, getContent])

    const handleChange = useCallback(
      (_elements: readonly ExcalidrawElement[], _appState: AppState, _files: BinaryFiles) => {
        onChange?.()
      },
      [onChange],
    )

    const handleExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
      apiRef.current = api
      // Fire onReady with serialized content for baseline capture
      const elements = api.getSceneElements()
      const appState = api.getAppState()
      const files = api.getFiles()
      const json = serializeScene(elements, appState, files)
      onReadyRef.current?.(json)
    }, [])

    const baseName = name ? name.replace(/\.excalidraw$/, '') : 'export'

    const uiOptions = useMemo(() => ({
      canvasActions: {
        export: onExportImage
          ? {
              saveFileToDisk: false,
              renderCustomUI: (
                exportedElements: readonly ExcalidrawElement[],
                appState: Partial<AppState>,
                files: BinaryFiles,
                canvas: HTMLCanvasElement,
              ) => {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      onClick={async () => {
                        const blob = await exportToBlob({
                          elements: exportedElements,
                          appState,
                          files,
                          mimeType: 'image/png',
                        })
                        await onExportImage({
                          blob,
                          suggestedName: `${baseName}.png`,
                          mimeType: 'image/png',
                        })
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#5b57d1',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      Save as PNG
                    </button>
                    <button
                      onClick={async () => {
                        const svg = await exportToSvg({
                          elements: exportedElements,
                          appState,
                          files,
                        })
                        const svgString = new XMLSerializer().serializeToString(svg)
                        const blob = new Blob([svgString], { type: 'image/svg+xml' })
                        await onExportImage({
                          blob,
                          suggestedName: `${baseName}.svg`,
                          mimeType: 'image/svg+xml',
                        })
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#5b57d1',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      Save as SVG
                    </button>
                  </div>
                )
              },
            }
          : false as const,
        loadScene: false,
        saveToActiveFile: false,
        toggleTheme: false as const,
      },
    }), [onExportImage, baseName])

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <Excalidraw
          excalidrawAPI={handleExcalidrawAPI}
          initialData={initialData}
          onChange={handleChange}
          theme={THEME.DARK}
          UIOptions={uiOptions}
        />
      </div>
    )
  },
)
