import { useCallback, useEffect, useRef } from 'react'
import { WelcomeScreen } from './components/welcome/WelcomeScreen'
import { Sidebar } from './components/sidebar/Sidebar'
import { TabBar } from './components/tabs/TabBar'
import { ContentArea } from './components/content/ContentArea'
import { FuzzySearch } from './components/search/FuzzySearch'
import { StatusBar } from './components/statusbar/StatusBar'
import { UpdateToast } from './components/update/UpdateToast'
import { Toast } from './components/toast/Toast'
import { TerminalContent, TerminalTabBar, useTerminalTabs } from './components/terminal/TerminalPanel'
import { useWorkspaceStore } from './stores/workspace-store'
import { useTabStore } from './stores/tab-store'
import { useUIStore } from './stores/ui-store'
import { useGroupStore } from './stores/group-store'
import { useFsEvents } from './hooks/use-fs-events'
import { useKeyboard } from './hooks/use-keyboard'
import { debouncedSaveTabState, flushSaveTabState, cancelPendingSave } from './lib/ipc'
import type { WorkspaceState, FileNode } from '../shared/types'
import { basename } from './lib/file-utils'

// In-memory cache for workspace state (LRU, max 3)
interface CachedWorkspace {
  rootNodes: FileNode[]
  tabs: WorkspaceState['tabs']
  activeTabId: string | null
  expandedPaths: string[]
  sidebarVisible: boolean
  lastAccess: number
}

const workspaceCache = new Map<string, CachedWorkspace>()
const MAX_CACHE = 3

function evictCache(): void {
  if (workspaceCache.size <= MAX_CACHE) return
  let oldestKey: string | null = null
  let oldestTime = Infinity
  for (const [key, val] of workspaceCache.entries()) {
    if (val.lastAccess < oldestTime) {
      oldestTime = val.lastAccess
      oldestKey = key
    }
  }
  if (oldestKey) workspaceCache.delete(oldestKey)
}

export default function App() {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const setWorkspacePath = useWorkspaceStore((s) => s.setWorkspacePath)
  const setRootNodes = useWorkspaceStore((s) => s.setRootNodes)
  const sidebarVisible = useUIStore((s) => s.sidebarVisible)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const terminalVisible = useUIStore((s) => s.terminalVisible)
  const toggleTerminal = useUIStore((s) => s.toggleTerminal)
  const terminalWidth = useUIStore((s) => s.terminalWidth)
  const { tabs, activeTabId, setTabs } = useTabStore()
  const terminalTabs = useTerminalTabs(terminalVisible)
  const group = useGroupStore((s) => s.group)
  const setGroup = useGroupStore((s) => s.setGroup)

  const preloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useFsEvents()
  useKeyboard()

  // Initialize global UI state and load group data on mount
  useEffect(() => {
    useUIStore.getState().initFromGlobal()

    window.electronAPI.workspaceGroup.getForWindow().then((g) => {
      if (g) {
        setGroup(g)
      }
    })
  }, [setGroup])

  // Save tab state on changes (debounced) — includes expandedPaths
  useEffect(() => {
    if (!workspacePath) return
    const expandedPaths = Array.from(useWorkspaceStore.getState().expandedPaths)
    debouncedSaveTabState(workspacePath, {
      tabs,
      activeTabId,
      sidebarVisible,
      expandedPaths
    })
  }, [tabs, activeTabId, workspacePath, sidebarVisible])

  // Also save when expandedPaths change
  useEffect(() => {
    if (!workspacePath) return
    const unsub = useWorkspaceStore.subscribe((state, prev) => {
      if (state.expandedPaths !== prev.expandedPaths && state.workspacePath) {
        debouncedSaveTabState(state.workspacePath, {
          tabs: useTabStore.getState().tabs,
          activeTabId: useTabStore.getState().activeTabId,
          sidebarVisible: useUIStore.getState().sidebarVisible,
          expandedPaths: Array.from(state.expandedPaths)
        })
      }
    })
    return unsub
  }, [workspacePath])

  // Listen for workspace:open events from keyboard handler / menu
  useEffect(() => {
    const handler = (e: Event) => {
      const path = (e as CustomEvent).detail as string
      openWorkspace(path)
    }
    window.addEventListener('workspace:open', handler)
    return () => window.removeEventListener('workspace:open', handler)
  }, [])

  // Lazy preload inactive workspaces after 2s idle
  useEffect(() => {
    if (!workspacePath || !group) return

    if (preloadTimerRef.current) clearTimeout(preloadTimerRef.current)
    preloadTimerRef.current = setTimeout(async () => {
      const inactive = group.workspaces
        .filter((w) => w !== workspacePath && !workspaceCache.has(w))
        .slice(0, 2)

      for (const ws of inactive) {
        try {
          const [nodes, state] = await Promise.all([
            window.electronAPI.fs.readDir(ws),
            window.electronAPI.tabs.getState(ws)
          ])
          workspaceCache.set(ws, {
            rootNodes: nodes,
            tabs: state?.tabs ?? [],
            activeTabId: state?.activeTabId ?? null,
            expandedPaths: state?.expandedPaths ?? [],
            sidebarVisible: state?.sidebarVisible ?? true,
            lastAccess: Date.now()
          })
          evictCache()
        } catch {
          // Workspace folder may not exist — skip silently
        }
      }
    }, 2000)

    return () => {
      if (preloadTimerRef.current) clearTimeout(preloadTimerRef.current)
    }
  }, [workspacePath, group])

  const buildWorkspaceState = useCallback((): WorkspaceState => {
    return {
      tabs: useTabStore.getState().tabs,
      activeTabId: useTabStore.getState().activeTabId,
      sidebarVisible: useUIStore.getState().sidebarVisible,
      expandedPaths: Array.from(useWorkspaceStore.getState().expandedPaths)
    }
  }, [])

  const restoreExpandedDirs = useCallback(async (expandedPaths: string[]) => {
    // Read children for each expanded directory
    for (const dirPath of expandedPaths) {
      try {
        const children = await window.electronAPI.fs.readDir(dirPath)
        useWorkspaceStore.getState().updateNodeChildren(dirPath, children)
      } catch {
        // Directory may no longer exist — skip
      }
    }
  }, [])

  const openWorkspace = useCallback(
    async (folderPath: string) => {
      // Flush current workspace state before switching
      const currentPath = useWorkspaceStore.getState().workspacePath
      if (currentPath) {
        await flushSaveTabState(currentPath, buildWorkspaceState())

        // Cache current workspace for fast switching back
        workspaceCache.set(currentPath, {
          rootNodes: useWorkspaceStore.getState().rootNodes,
          tabs: useTabStore.getState().tabs,
          activeTabId: useTabStore.getState().activeTabId,
          expandedPaths: Array.from(useWorkspaceStore.getState().expandedPaths),
          sidebarVisible: useUIStore.getState().sidebarVisible,
          lastAccess: Date.now()
        })
        evictCache()
      }

      // Cancel any pending debounced save before resetting
      cancelPendingSave()
      useTabStore.getState().reset()

      // Check cache first
      const cached = workspaceCache.get(folderPath)
      if (cached) {
        cached.lastAccess = Date.now()
        setWorkspacePath(folderPath)
        setRootNodes(cached.rootNodes)
        useWorkspaceStore.getState().setExpandedPaths(cached.expandedPaths)
        setTabs(cached.tabs, cached.activeTabId)
        if (cached.sidebarVisible !== undefined) {
          useUIStore.getState().setSidebarVisible(cached.sidebarVisible)
        }
        // Re-read expanded dirs to catch external changes
        restoreExpandedDirs(cached.expandedPaths)
      } else {
        setWorkspacePath(folderPath)
        const nodes = await window.electronAPI.fs.readDir(folderPath)
        setRootNodes(nodes)

        // Restore saved state
        const savedState = await window.electronAPI.tabs.getState(folderPath)
        if (savedState && savedState.tabs.length > 0) {
          setTabs(savedState.tabs, savedState.activeTabId)
          if (savedState.sidebarVisible !== undefined) {
            useUIStore.getState().setSidebarVisible(savedState.sidebarVisible)
          }
          if (savedState.expandedPaths && savedState.expandedPaths.length > 0) {
            useWorkspaceStore.getState().setExpandedPaths(savedState.expandedPaths)
            restoreExpandedDirs(savedState.expandedPaths)
          }
        }
      }

      // Update group's active workspace
      if (group) {
        await window.electronAPI.workspaceGroup.setActiveWorkspace(folderPath)
        // Update local group state
        useGroupStore.getState().updateGroup({ activeWorkspace: folderPath })
      }
    },
    [setWorkspacePath, setRootNodes, setTabs, buildWorkspaceState, restoreExpandedDirs, group]
  )

  const handleOpenFolder = useCallback(async () => {
    const path = await window.electronAPI.workspace.openFolder()
    if (!path) return

    // If no group exists, create a default one
    if (!useGroupStore.getState().group) {
      const newGroup = await window.electronAPI.workspaceGroup.create(basename(path), path)
      useGroupStore.getState().setGroup(newGroup)
    } else {
      // Add workspace to current group
      const updatedGroup = await window.electronAPI.workspaceGroup.addWorkspace(path)
      useGroupStore.getState().setGroup(updatedGroup)
    }

    openWorkspace(path)
  }, [openWorkspace])

  if (!workspacePath) {
    return (
      <div className="flex h-screen flex-col bg-neutral-900">
        <WelcomeScreen
          onOpenFolder={handleOpenFolder}
          onOpenRecent={(path) => {
            // When opening from recent, also add to group
            handleOpenRecent(path)
          }}
        />
        <UpdateToast />
        <Toast />
      </div>
    )
  }

  // Helper for opening recent workspaces
  async function handleOpenRecent(path: string) {
    if (!useGroupStore.getState().group) {
      const newGroup = await window.electronAPI.workspaceGroup.create(basename(path), path)
      useGroupStore.getState().setGroup(newGroup)
    } else {
      const updatedGroup = await window.electronAPI.workspaceGroup.addWorkspace(path)
      useGroupStore.getState().setGroup(updatedGroup)
    }
    openWorkspace(path)
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-900">
      {/* Titlebar — full width drag area with toggles on the right */}
      <div data-drag className="flex h-11 shrink-0 items-center justify-end gap-1 border-b border-neutral-700 px-2">
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
        <button
          onClick={toggleTerminal}
          className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
          title={terminalVisible ? 'Hide Terminal (⌘T)' : 'Show Terminal (⌘T)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
            {terminalVisible && (
              <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.15" stroke="none" />
            )}
          </svg>
        </button>
      </div>
      {/* Main area — sidebar + content + terminal */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && <Sidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Tab row — file tabs and terminal tabs side by side */}
          <div className="flex shrink-0">
            <div className="min-w-0 flex-1">
              <TabBar />
            </div>
            {terminalVisible && (
              <div className="shrink-0 border-l border-neutral-700" style={{ width: terminalWidth }}>
                <TerminalTabBar
                  tabs={terminalTabs.tabs}
                  activeTabId={terminalTabs.activeTabId}
                  onSelect={terminalTabs.handleSelect}
                  onClose={terminalTabs.handleClose}
                  onCreate={terminalTabs.createTab}
                />
              </div>
            )}
          </div>
          {/* Content row — editor and terminal side by side */}
          <div className="flex flex-1 overflow-hidden">
            <div className="relative min-w-0 flex-1 overflow-hidden">
              <ContentArea />
            </div>
            <TerminalContent
              visible={terminalVisible}
              tabs={terminalTabs.tabs}
              activeTabId={terminalTabs.activeTabId}
            />
          </div>
        </div>
      </div>
      <StatusBar />
      <FuzzySearch />
      <UpdateToast />
      <Toast />
    </div>
  )
}
