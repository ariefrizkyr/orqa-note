import { useCallback, useEffect } from 'react'
import { WelcomeScreen } from './components/welcome/WelcomeScreen'
import { Sidebar } from './components/sidebar/Sidebar'
import { TabBar } from './components/tabs/TabBar'
import { ContentArea } from './components/content/ContentArea'
import { FuzzySearch } from './components/search/FuzzySearch'
import { StatusBar } from './components/statusbar/StatusBar'
import { useWorkspaceStore } from './stores/workspace-store'
import { useTabStore } from './stores/tab-store'
import { useUIStore } from './stores/ui-store'
import { useFsEvents } from './hooks/use-fs-events'
import { useKeyboard } from './hooks/use-keyboard'
import { debouncedSaveTabState, flushSaveTabState } from './lib/ipc'

export default function App() {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const setWorkspacePath = useWorkspaceStore((s) => s.setWorkspacePath)
  const setRootNodes = useWorkspaceStore((s) => s.setRootNodes)
  const sidebarWidth = useUIStore((s) => s.sidebarWidth)
  const sidebarVisible = useUIStore((s) => s.sidebarVisible)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const { tabs, activeTabId, setTabs } = useTabStore()

  useFsEvents()
  useKeyboard()

  // Auto-open workspace if this window was created with an initial path
  useEffect(() => {
    window.electronAPI.workspace.getInitialPath().then((path) => {
      if (path) openWorkspace(path)
    })
  }, [])

  // Save tab state on changes (debounced)
  useEffect(() => {
    if (!workspacePath) return
    debouncedSaveTabState(workspacePath, {
      tabs,
      activeTabId,
      sidebarWidth,
      sidebarVisible
    })
  }, [tabs, activeTabId, workspacePath, sidebarWidth, sidebarVisible])

  // Listen for workspace:open events from keyboard handler
  useEffect(() => {
    const handler = (e: Event) => {
      const path = (e as CustomEvent).detail as string
      openWorkspace(path)
    }
    window.addEventListener('workspace:open', handler)
    return () => window.removeEventListener('workspace:open', handler)
  }, [])

  const openWorkspace = useCallback(
    async (folderPath: string) => {
      // Flush current tab state before switching
      const currentPath = useWorkspaceStore.getState().workspacePath
      if (currentPath) {
        const currentTabs = useTabStore.getState().tabs
        const currentActiveId = useTabStore.getState().activeTabId
        await flushSaveTabState(currentPath, {
          tabs: currentTabs,
          activeTabId: currentActiveId,
          sidebarWidth: useUIStore.getState().sidebarWidth,
          sidebarVisible: useUIStore.getState().sidebarVisible
        })
      }

      useTabStore.getState().reset()

      setWorkspacePath(folderPath)
      const nodes = await window.electronAPI.fs.readDir(folderPath)
      setRootNodes(nodes)

      // Restore saved tab state
      const savedState = await window.electronAPI.tabs.getState(folderPath)
      if (savedState && savedState.tabs.length > 0) {
        setTabs(savedState.tabs, savedState.activeTabId)
        if (savedState.sidebarWidth) {
          useUIStore.getState().setSidebarWidth(savedState.sidebarWidth)
        }
        if (savedState.sidebarVisible !== undefined) {
          useUIStore.getState().setSidebarVisible(savedState.sidebarVisible)
        }
      }
    },
    [setWorkspacePath, setRootNodes, setTabs]
  )

  const handleOpenFolder = useCallback(async () => {
    const path = await window.electronAPI.workspace.openFolder()
    if (path) {
      openWorkspace(path)
    }
  }, [openWorkspace])

  if (!workspacePath) {
    return (
      <div className="flex h-screen flex-col bg-neutral-900">
        <WelcomeScreen
          onOpenFolder={handleOpenFolder}
          onOpenRecent={(path) => openWorkspace(path)}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-900">
      {/* Titlebar — full width drag area with toggle on the right */}
      <div data-drag className="flex h-11 shrink-0 items-center justify-end border-b border-neutral-700 px-2">
        <button
          onClick={toggleSidebar}
          className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
          title={sidebarVisible ? 'Hide Sidebar (⌘B)' : 'Show Sidebar (⌘B)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            {sidebarVisible && (
              <rect x="3" y="3" width="6" height="18" rx="2" fill="currentColor" opacity="0.3" stroke="none" />
            )}
          </svg>
        </button>
      </div>
      {/* Main area — sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && <Sidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          <TabBar />
          <div className="flex-1 overflow-hidden">
            <ContentArea />
          </div>
        </div>
      </div>
      <StatusBar />
      <FuzzySearch />
    </div>
  )
}
