import { useCallback, useEffect, useState } from 'react'
import { useTabStore } from '../../stores/tab-store'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { MarkdownPreview } from './MarkdownPreview'
import { NewTabScreen } from '../tabs/NewTabScreen'
import { WebviewToolbar } from '../webview/WebviewToolbar'

export function ContentArea() {
  const { tabs, activeTabId, updateTab, closeTab } = useTabStore()
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
    window.electronAPI.fs.readFile(activeTab.filePath)
      .then(() => setFileExists(true))
      .catch(() => setFileExists(false))
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

  if (ext === 'md' || ext === 'folio') {
    return (
      <MarkdownPreview
        filePath={activeTab.filePath!}
        scrollPosition={activeTab.scrollPosition}
        onScroll={(pos) => updateTab(activeTab.id, { scrollPosition: pos })}
      />
    )
  }

  // Unsupported file type
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
