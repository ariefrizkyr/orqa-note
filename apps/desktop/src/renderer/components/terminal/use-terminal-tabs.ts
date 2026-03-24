import { useState, useEffect, useCallback, useRef } from 'react'
import type { TerminalTab } from './TerminalTabBar'
import { useWorkspaceStore } from '../../stores/workspace-store'

let nextTabId = 1

export function useTerminalTabs(visible: boolean) {
  const [tabs, setTabs] = useState<TerminalTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const creatingRef = useRef(false)

  const createTab = useCallback(async () => {
    if (creatingRef.current) return
    creatingRef.current = true
    try {
      const cwd = useWorkspaceStore.getState().workspacePath || undefined
      const sessionId = await window.electronAPI.terminal.create(cwd)
      const id = `ttab-${nextTabId++}`

      let title = 'terminal'
      try {
        title = await window.electronAPI.terminal.getShellName()
      } catch {
        // Use default
      }

      const newTab: TerminalTab = { id, sessionId, title }
      setTabs((prev) => [...prev, newTab])
      setActiveTabId(id)
    } finally {
      creatingRef.current = false
    }
  }, [])

  // When panel becomes visible and no tabs exist, create one
  useEffect(() => {
    if (visible && tabs.length === 0) {
      createTab()
    }
  }, [visible, tabs.length, createTab])

  // Trigger fit when panel becomes visible
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('terminal:fit'))
      })
    }
  }, [visible])

  // Handle shell exit
  useEffect(() => {
    const removeListener = window.electronAPI.terminal.onExit((sessionId) => {
      setTabs((prev) => {
        const remaining = prev.filter((t) => t.sessionId !== sessionId)
        setActiveTabId((currentActive) => {
          const closedTab = prev.find((t) => t.sessionId === sessionId)
          if (closedTab && closedTab.id === currentActive) {
            return remaining.length > 0 ? remaining[remaining.length - 1].id : null
          }
          return currentActive
        })
        return remaining
      })
    })

    return removeListener
  }, [])

  const handleSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const handleClose = useCallback((tabId: string) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId)
      if (tab) {
        window.electronAPI.terminal.kill(tab.sessionId)
      }
      const remaining = prev.filter((t) => t.id !== tabId)
      setActiveTabId((currentActive) => {
        if (currentActive === tabId) {
          return remaining.length > 0 ? remaining[remaining.length - 1].id : null
        }
        return currentActive
      })
      return remaining
    })
  }, [])

  return { tabs, activeTabId, createTab, handleSelect, handleClose }
}
