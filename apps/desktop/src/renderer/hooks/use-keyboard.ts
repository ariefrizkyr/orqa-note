import { useEffect } from 'react'
import { useUIStore } from '../stores/ui-store'
import { useTabStore } from '../stores/tab-store'

export function useKeyboard(): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey

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

      // Cmd+O — open folder
      if (meta && e.key === 'o') {
        e.preventDefault()
        window.electronAPI.workspace.openFolder().then((path) => {
          if (path) {
            // Workspace opening is handled by the component
            window.dispatchEvent(new CustomEvent('workspace:open', { detail: path }))
          }
        })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
