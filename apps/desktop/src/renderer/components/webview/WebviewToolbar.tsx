import { useEffect, useState } from 'react'
import type { Tab } from '../../../shared/types'

interface WebviewToolbarProps {
  tab: Tab
  webviewEl: HTMLElement | null
}

export function WebviewToolbar({ tab, webviewEl }: WebviewToolbarProps) {
  const [currentUrl, setCurrentUrl] = useState(tab.bookmarkUrl || '')

  useEffect(() => {
    const wv = webviewEl as any
    if (!wv) return

    const handleNavigate = (e: any) => {
      setCurrentUrl(e.url)
    }

    wv.addEventListener('did-navigate', handleNavigate)
    wv.addEventListener('did-navigate-in-page', handleNavigate)

    return () => {
      wv.removeEventListener('did-navigate', handleNavigate)
      wv.removeEventListener('did-navigate-in-page', handleNavigate)
    }
  }, [webviewEl])

  return (
    <div
      data-no-drag
      className="flex h-[36px] shrink-0 items-center gap-3 border-b border-neutral-700 bg-neutral-850 px-3"
    >
      <span className="text-sm font-medium text-white">{tab.label}</span>
      <span className="flex-1 truncate text-xs text-neutral-500">{currentUrl}</span>
      <button
        onClick={() => {
          const wv = webviewEl as any
          if (wv?.reload) wv.reload()
        }}
        className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
        title="Reload"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>
      <button
        onClick={() => {
          if (tab.bookmarkUrl) {
            window.electronAPI.webview.openExternal(tab.bookmarkUrl)
          }
        }}
        className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
        title="Open in Browser"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </button>
    </div>
  )
}
