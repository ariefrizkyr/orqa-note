import { useCallback, useEffect, useRef, useState } from 'react'
import { useTabStore } from '../../stores/tab-store'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { OrqaEditor, useAutoSave } from '@orqa-note/editor'
import type { OrqaEditorHandle } from '@orqa-note/editor'
import { CodeEditor, isBinaryExtension } from '@orqa-note/code-editor'
import type { CodeEditorHandle } from '@orqa-note/code-editor'
import { PdfViewer } from '@orqa-note/pdf-viewer'
import { SpreadsheetEditor } from '@orqa-note/spreadsheet'
import type { SpreadsheetEditorHandle } from '@orqa-note/spreadsheet'
import { ExcalidrawEditor } from '@orqa-note/excalidraw'
import type { ExcalidrawEditorHandle, ExportImageData } from '@orqa-note/excalidraw'
import { useFileEditor } from '../../hooks/use-file-editor'
import { extname, basename } from '../../lib/file-utils'
import { NewTabScreen } from '../tabs/NewTabScreen'
import { WebviewToolbar } from '../webview/WebviewToolbar'
import type { Tab } from '../../../shared/types'

function SaveErrorBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-red-900/60 px-3 py-1.5 text-xs text-red-200">
      <span>Failed to save file. Check disk space and permissions.</span>
      <button onClick={onDismiss} className="ml-auto rounded px-2 py-0.5 hover:bg-red-800">
        Dismiss
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center text-neutral-500">
      <p className="text-sm">Loading...</p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-neutral-500">
      <p className="text-sm">{message}</p>
    </div>
  )
}

function MarkdownEditor({ filePath, tabId }: { filePath: string; tabId: string }) {
  const editorRef = useRef<OrqaEditorHandle>(null)
  const { content, error, saveError, isDirty, baseline, setBaseline, handleSave, handleChange, clearSaveError } = useFileEditor({ filePath, tabId })

  const handleLinkClick = useCallback((href: string) => {
    window.electronAPI?.webview?.openExternal(href)
  }, [])

  const handleReady = useCallback((serialized: string) => {
    setBaseline(serialized)
  }, [setBaseline])

  useAutoSave({
    isDirty,
    onSave: () => {
      const current = editorRef.current?.getContent()
      if (current != null && current === baseline) {
        // Content matches baseline — no real user changes, skip write
        const { clearDirty } = useTabStore.getState()
        clearDirty(tabId)
        return
      }
      editorRef.current?.save()
    },
    debounceMs: 2000,
  })

  if (error) return <ErrorState message="Failed to load file" />
  if (content === null) return <LoadingState />

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {saveError && <SaveErrorBanner onDismiss={clearSaveError} />}
      <div className="min-h-0 flex-1 overflow-auto">
        <OrqaEditor
          ref={editorRef}
          initialContent={content}
          onSave={handleSave}
          onChange={handleChange}
          onReady={handleReady}
          onLinkClick={handleLinkClick}
        />
      </div>
    </div>
  )
}

function CodeFileEditor({ filePath, tabId }: { filePath: string; tabId: string }) {
  const editorRef = useRef<CodeEditorHandle>(null)
  const { content, error, saveError, isDirty, baseline, setBaseline, handleSave, handleChange, clearSaveError } = useFileEditor({ filePath, tabId })

  const handleReady = useCallback((serialized: string) => {
    setBaseline(serialized)
  }, [setBaseline])

  useAutoSave({
    isDirty,
    onSave: () => {
      const current = editorRef.current?.getContent()
      if (current != null && current === baseline) {
        const { clearDirty } = useTabStore.getState()
        clearDirty(tabId)
        return
      }
      editorRef.current?.save()
    },
    debounceMs: 2000,
  })

  if (error) return <ErrorState message="Failed to load file" />
  if (content === null) return <LoadingState />

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {saveError && <SaveErrorBanner onDismiss={clearSaveError} />}
      <div className="min-h-0 flex-1">
        <CodeEditor
          ref={editorRef}
          initialContent={content}
          filePath={filePath}
          onSave={handleSave}
          onChange={handleChange}
          onReady={handleReady}
        />
      </div>
    </div>
  )
}

function SpreadsheetFileEditor({ filePath, tabId }: { filePath: string; tabId: string }) {
  const editorRef = useRef<SpreadsheetEditorHandle>(null)
  const ext = extname(filePath)
  const fileType = ext === 'csv' ? 'csv' as const : 'xlsx' as const
  const [data, setData] = useState<Uint8Array | string | null>(null)
  const [error, setError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const { markDirty, clearDirty } = useTabStore()
  const isDirty = useTabStore((s) => s.tabs.find((t) => t.id === tabId)?.isDirty ?? false)

  useEffect(() => {
    setData(null)
    setError(false)
    setSaveError(false)
    if (fileType === 'csv') {
      window.electronAPI.fs.readFile(filePath)
        .then(setData)
        .catch(() => setError(true))
    } else {
      window.electronAPI.fs.readBinaryFile(filePath)
        .then((buf) => setData(new Uint8Array(buf)))
        .catch(() => setError(true))
    }
  }, [filePath, fileType])

  const handleChange = useCallback(() => {
    markDirty(tabId)
  }, [tabId, markDirty])

  const handleSave = useCallback(async (saveData: Uint8Array | string) => {
    try {
      if (fileType === 'csv') {
        await window.electronAPI.fs.writeFile(filePath, saveData as string)
      } else {
        await window.electronAPI.fs.writeBinaryFile(filePath, saveData as Uint8Array)
      }
      clearDirty(tabId)
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [filePath, fileType, tabId, clearDirty])

  useAutoSave({
    isDirty,
    onSave: () => editorRef.current?.save(),
    debounceMs: 2000,
  })

  if (error) return <ErrorState message="Failed to load spreadsheet" />
  if (data === null) return <LoadingState />

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {saveError && <SaveErrorBanner onDismiss={() => setSaveError(false)} />}
      <div className="min-h-0 flex-1">
        <SpreadsheetEditor
          ref={editorRef}
          data={data}
          fileType={fileType}
          onSave={handleSave}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}

function ExcalidrawFileEditor({ filePath, tabId }: { filePath: string; tabId: string }) {
  const editorRef = useRef<ExcalidrawEditorHandle>(null)
  const { content, error, saveError, isDirty, baseline, setBaseline, handleSave, handleChange, clearSaveError } = useFileEditor({ filePath, tabId })

  const handleReady = useCallback((serialized: string) => {
    setBaseline(serialized)
  }, [setBaseline])

  useAutoSave({
    isDirty,
    onSave: () => {
      const current = editorRef.current?.getContent()
      if (current != null && current === baseline) {
        const { clearDirty } = useTabStore.getState()
        clearDirty(tabId)
        return
      }
      editorRef.current?.save()
    },
    debounceMs: 2000,
  })

  const handleExportImage = useCallback(async (data: ExportImageData) => {
    const ext = data.mimeType === 'image/png' ? 'png' : 'svg'
    const savePath = await window.electronAPI.fs.showSaveDialog({
      defaultPath: data.suggestedName,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    })
    if (!savePath) return
    const arrayBuffer = await data.blob.arrayBuffer()
    await window.electronAPI.fs.writeBinaryFile(savePath, new Uint8Array(arrayBuffer))
  }, [])

  if (error) return <ErrorState message="Failed to load canvas" />
  if (content === null) return <LoadingState />

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {saveError && <SaveErrorBanner onDismiss={clearSaveError} />}
      <div className="min-h-0 flex-1">
        <ExcalidrawEditor
          ref={editorRef}
          initialContent={content}
          name={basename(filePath)}
          onSave={handleSave}
          onChange={handleChange}
          onReady={handleReady}
          onExportImage={handleExportImage}
        />
      </div>
    </div>
  )
}

function PdfFileViewer({ filePath }: { filePath: string }) {
  const [data, setData] = useState<Uint8Array | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setData(null)
    setError(false)
    window.electronAPI.fs.readBinaryFile(filePath)
      .then((buf) => setData(new Uint8Array(buf)))
      .catch(() => setError(true))
  }, [filePath])

  if (error) return <ErrorState message="Failed to load PDF" />
  if (!data) return <LoadingState />

  return <PdfViewer data={data} />
}

function BookmarkWebview({ tab, partition, isActive }: { tab: Tab; partition: string | null; isActive: boolean }) {
  const [webviewEl, setWebviewEl] = useState<HTMLElement | null>(null)
  const webviewCallbackRef = useCallback((node: HTMLElement | null) => {
    setWebviewEl(node)
  }, [])

  if (!partition || !tab.bookmarkUrl) return null

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={isActive ? { position: 'absolute', inset: 0 } : { position: 'absolute', inset: 0, visibility: 'hidden' }}
    >
      <WebviewToolbar tab={tab} webviewEl={webviewEl} />
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <webview
          ref={webviewCallbackRef as React.Ref<HTMLElement>}
          src={tab.bookmarkUrl}
          partition={partition}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}

export function ContentArea() {
  const { tabs, activeTabId, closeTab } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const bookmarkTabs = tabs.filter((t) => t.type === 'bookmark')
  const [fileExists, setFileExists] = useState<boolean | null>(null)
  const [partition, setPartition] = useState<string | null>(null)
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)

  // Fetch partition for webview sessions
  useEffect(() => {
    if (!workspacePath) return
    window.electronAPI.webview.getPartition(workspacePath).then(setPartition)
  }, [workspacePath])

  useEffect(() => {
    if (!activeTab?.filePath || activeTab.type === 'bookmark' || activeTab.type === 'new-tab') {
      setFileExists(null)
      return
    }
    window.electronAPI.fs.existsFile(activeTab.filePath)
      .then(setFileExists)
  }, [activeTab?.filePath, activeTab?.type])

  // Always render all bookmark webviews to preserve their state
  const bookmarkWebviews = bookmarkTabs.map((tab) => (
    <BookmarkWebview
      key={tab.id}
      tab={tab}
      partition={partition}
      isActive={tab.id === activeTabId}
    />
  ))

  // Determine non-bookmark content
  let content: React.ReactNode = null

  if (!activeTab) {
    content = (
      <div className="flex h-full items-center justify-center text-neutral-500">
        <p className="text-sm">Open a file from the sidebar</p>
      </div>
    )
  } else if (activeTab.type === 'new-tab') {
    content = <NewTabScreen />
  } else if (activeTab.type === 'bookmark') {
    // Active bookmark is shown via bookmarkWebviews; no extra content needed
  } else if (activeTab.type === 'file' && fileExists === false) {
    content = (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-neutral-400">
        <span className="text-4xl">🚫</span>
        <p className="text-sm">File not found</p>
        <p className="text-xs text-neutral-500 max-w-sm truncate">{activeTab.filePath}</p>
        <button
          onClick={() => closeTab(activeTab.id)}
          className="rounded bg-neutral-700 px-4 py-2 text-sm text-white hover:bg-neutral-600"
        >
          Close Tab
        </button>
      </div>
    )
  } else {
    const ext = activeTab.filePath ? extname(activeTab.filePath) : ''

    if (ext === 'md') {
      content = <MarkdownEditor filePath={activeTab.filePath!} tabId={activeTab.id} />
    } else if (ext === 'pdf') {
      content = <PdfFileViewer filePath={activeTab.filePath!} />
    } else if (ext === 'xlsx' || ext === 'csv') {
      content = <SpreadsheetFileEditor filePath={activeTab.filePath!} tabId={activeTab.id} />
    } else if (ext === 'excalidraw') {
      content = <ExcalidrawFileEditor filePath={activeTab.filePath!} tabId={activeTab.id} />
    } else if (isBinaryExtension(ext)) {
      content = (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-neutral-400">
          <span className="text-4xl">📄</span>
          <p className="text-sm">
            Preview not available for <strong>.{ext}</strong> files
          </p>
          <button
            onClick={() => {
              if (activeTab.filePath) {
                window.electronAPI.fs.openInDefaultApp(activeTab.filePath)
              }
            }}
            className="rounded bg-neutral-700 px-4 py-2 text-sm text-white hover:bg-neutral-600"
          >
            Open in Default App
          </button>
        </div>
      )
    } else {
      content = <CodeFileEditor filePath={activeTab.filePath!} tabId={activeTab.id} />
    }
  }

  return (
    <>
      {bookmarkWebviews}
      {content}
    </>
  )
}
