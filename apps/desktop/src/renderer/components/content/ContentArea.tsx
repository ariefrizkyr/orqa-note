import { useCallback, useEffect, useRef, useState } from 'react'
import { useTabStore } from '../../stores/tab-store'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { OrqaEditor, useAutoSave } from '@orqa-note/editor'
import type { OrqaEditorHandle } from '@orqa-note/editor'
import { CodeEditor, isBinaryExtension } from '@orqa-note/code-editor'
import type { CodeEditorHandle } from '@orqa-note/code-editor'
import { PdfViewer } from '@orqa-note/pdf-viewer'
import { useFileEditor } from '../../hooks/use-file-editor'
import { extname } from '../../lib/file-utils'
import { NewTabScreen } from '../tabs/NewTabScreen'
import { WebviewToolbar } from '../webview/WebviewToolbar'

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
  const { content, error, saveError, isDirty, handleSave, handleChange, clearSaveError } = useFileEditor({ filePath, tabId })

  const handleLinkClick = useCallback((href: string) => {
    window.electronAPI?.webview?.openExternal(href)
  }, [])

  useAutoSave({
    isDirty,
    onSave: () => editorRef.current?.save(),
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
          onLinkClick={handleLinkClick}
        />
      </div>
    </div>
  )
}

function CodeFileEditor({ filePath, tabId }: { filePath: string; tabId: string }) {
  const editorRef = useRef<CodeEditorHandle>(null)
  const { content, error, saveError, isDirty, handleSave, handleChange, clearSaveError } = useFileEditor({ filePath, tabId })

  useAutoSave({
    isDirty,
    onSave: () => editorRef.current?.save(),
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

export function ContentArea() {
  const { tabs, activeTabId, closeTab } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const [fileExists, setFileExists] = useState<boolean | null>(null)
  const [partition, setPartition] = useState<string | null>(null)
  const [webviewEl, setWebviewEl] = useState<HTMLElement | null>(null)
  const webviewCallbackRef = useCallback((node: HTMLElement | null) => {
    setWebviewEl(node)
  }, [])
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

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        <p className="text-sm">Open a file from the sidebar or press + for a new tab</p>
      </div>
    )
  }

  if (activeTab.type === 'new-tab') {
    return <NewTabScreen />
  }

  if (activeTab.type === 'bookmark') {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <WebviewToolbar tab={activeTab} webviewEl={webviewEl} />
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          {partition && activeTab.bookmarkUrl && (
            <webview
              ref={webviewCallbackRef as React.Ref<HTMLElement>}
              src={activeTab.bookmarkUrl}
              partition={partition}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
          )}
        </div>
      </div>
    )
  }

  // File tab — check existence
  if (activeTab.type === 'file' && fileExists === false) {
    return (
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
  }

  const ext = activeTab.filePath ? extname(activeTab.filePath) : ''

  // Markdown
  if (ext === 'md') {
    return <MarkdownEditor filePath={activeTab.filePath!} tabId={activeTab.id} />
  }

  // PDF
  if (ext === 'pdf') {
    return <PdfFileViewer filePath={activeTab.filePath!} />
  }

  // Binary files
  if (isBinaryExtension(ext)) {
    return (
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
  }

  // Everything else — Monaco code editor
  return <CodeFileEditor filePath={activeTab.filePath!} tabId={activeTab.id} />
}
