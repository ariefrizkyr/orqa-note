import { useEffect } from 'react'
import { useUIStore } from '../stores/ui-store'
import { useTabStore } from '../stores/tab-store'
import { useToastStore } from '../stores/toast-store'

export function useKeyboard(): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey

      // Cmd+T — toggle terminal
      if (meta && !e.shiftKey && e.key === 't') {
        e.preventDefault()
        useUIStore.getState().toggleTerminal()
        return
      }

      // Cmd+B — toggle sidebar (skip if inside editor content area)
      if (meta && e.key === 'b') {
        const target = e.target as HTMLElement
        const isInEditor = target.closest('[contenteditable="true"]') || target.closest('.cm-editor')
        if (!isInEditor) {
          e.preventDefault()
          useUIStore.getState().toggleSidebar()
          return
        }
      }

      // Cmd+K — toggle search
      if (meta && e.key === 'k') {
        e.preventDefault()
        useUIStore.getState().toggleSearch()
        return
      }

      // Cmd+W — close active tab
      if (meta && e.key === 'w') {
        e.preventDefault()
        const { activeTabId, closeTab } = useTabStore.getState()
        if (activeTabId) closeTab(activeTabId)
        return
      }

      // Cmd+Shift+T — reopen last closed tab
      if (meta && e.shiftKey && e.key === 't') {
        e.preventDefault()
        useTabStore.getState().reopenLastClosed()
        return
      }

      // Cmd+Shift+C — copy active tab path/URL
      if (meta && e.shiftKey && e.key === 'c') {
        e.preventDefault()
        const { tabs, activeTabId } = useTabStore.getState()
        const tab = tabs.find((t) => t.id === activeTabId)
        if (!tab) return

        if (tab.type === 'file' && tab.filePath) {
          navigator.clipboard.writeText(tab.filePath)
          useToastStore.getState().showToast({ message: 'Path copied', placement: 'top-right' })
        } else if (tab.type === 'bookmark' && tab.bookmarkUrl) {
          navigator.clipboard.writeText(tab.bookmarkUrl)
          useToastStore.getState().showToast({ message: 'URL copied', placement: 'top-right' })
        }
        return
      }

      // Cmd+1-9 — switch to tab N
      if (meta && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const { tabs, setActiveTab } = useTabStore.getState()
        const idx = parseInt(e.key) - 1
        if (idx < tabs.length) {
          setActiveTab(tabs[idx].id)
        }
        return
      }

      // Cmd+Tab — next tab
      if (meta && !e.shiftKey && e.key === 'Tab') {
        e.preventDefault()
        const { tabs, activeTabId, setActiveTab } = useTabStore.getState()
        if (tabs.length < 2) return
        const idx = tabs.findIndex((t) => t.id === activeTabId)
        const next = (idx + 1) % tabs.length
        setActiveTab(tabs[next].id)
        return
      }

      // Cmd+Shift+Tab — previous tab
      if (meta && e.shiftKey && e.key === 'Tab') {
        e.preventDefault()
        const { tabs, activeTabId, setActiveTab } = useTabStore.getState()
        if (tabs.length < 2) return
        const idx = tabs.findIndex((t) => t.id === activeTabId)
        const prev = (idx - 1 + tabs.length) % tabs.length
        setActiveTab(tabs[prev].id)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
