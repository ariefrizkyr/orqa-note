import { useCallback, useEffect, useRef, useState } from 'react'
import { useTabStore } from '../../stores/tab-store'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { OrqaEditor, useAutoSave } from '@orqa-note/editor'
import type { OrqaEditorHandle } from '@orqa-note/editor'
import { CodeEditor, isBinaryExtension } from '@orqa-note/code-editor'
import type { CodeEditorHandle } from '@orqa-note/code-editor'
import { PdfViewer } from '@orqa-note/pdf-viewer'
import { markSelfWritten } from '../../hooks/use-fs-events'
import { NewTabScreen } from '../tabs/NewTabScreen'
import { WebviewToolbar } from '../webview/WebviewToolbar'

function MarkdownEditor({ filePath, tabId }: { filePath: string; tabId: string }) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const editorRef = useRef<OrqaEditorHandle>(null)
  const { markDirty, clearDirty } = useTabStore()
  const isDirty = useTabStore((s) => s.tabs.find((t) => t.id === tabId)?.isDirty ?? false)

  useEffect(() => {
    setContent(null)
    setError(false)
    window.electronAPI.fs.readFile(filePath)
      .then(setContent)
      .catch(() => setError(true))
  }, [filePath])

  const handleSave = useCallback(async (markdown: string) => {
    try {
      markSelfWritten(filePath)
      await window.electronAPI.fs.writeFile(filePath, markdown)
      clearDirty(tabId)
    } catch {
      // Save failed silently — user will notice dirty indicator persists
    }
  }, [filePath, tabId, clearDirty])

  const handleChange = useCallback(() => {
    markDirty(tabId)
  }, [tabId, markDirty])

  const handleLinkClick = useCallback((href: string) => {
    window.electronAPI?.webview?.openExternal(href)
  }, [])

  useAutoSave({
    isDirty,
    onSave: () => editorRef.current?.save(),
    debounceMs: 2000,
  })

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        <p className="text-sm">Failed to load file</p>
      </div>
    )
  }

  if (content === null) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
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
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const editorRef = useRef<CodeEditorHandle>(null)
  const { markDirty, clearDirty } = useTabStore()
  const isDirty = useTabStore((s) => s.tabs.find((t) => t.id === tabId)?.isDirty ?? false)

  useEffect(() => {
    setContent(null)
    setError(false)
    window.electronAPI.fs.readFile(filePath)
      .then(setContent)
      .catch(() => setError(true))
  }, [filePath])

  const handleSave = useCallback(async (text: string) => {
    try {
      markSelfWritten(filePath)
      await window.electronAPI.fs.writeFile(filePath, text)
      clearDirty(tabId)
    } catch {
      // Save failed silently — user will notice dirty indicator persists
    }
  }, [filePath, tabId, clearDirty])

  const handleChange = useCallback(() => {
    markDirty(tabId)
  }, [tabId, markDirty])

  useAutoSave({
    isDirty,
    onSave: () => editorRef.current?.save(),
    debounceMs: 2000,
  })

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        <p className="text-sm">Failed to load file</p>
      </div>
    )
  }

  if (content === null) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
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

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        <p className="text-sm">Failed to load PDF</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  return <PdfViewer data={data} filePath={filePath} />
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

  const ext = activeTab.filePath?.split('.').pop()?.toLowerCase()

  // Markdown → Milkdown WYSIWYG editor
  if (ext === 'md') {
    return <MarkdownEditor filePath={activeTab.filePath!} tabId={activeTab.id} />
  }

  // PDF → In-app PDF viewer
  if (ext === 'pdf') {
    return <PdfFileViewer filePath={activeTab.filePath!} />
  }

  // Binary files → "Open in Default App"
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

  // Everything else → Monaco code editor
  return <CodeFileEditor filePath={activeTab.filePath!} tabId={activeTab.id} />
}
