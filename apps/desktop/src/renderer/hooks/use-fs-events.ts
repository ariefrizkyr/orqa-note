import { useEffect } from 'react'
import { useWorkspaceStore } from '../stores/workspace-store'
import { useTabStore } from '../stores/tab-store'
import { dirname } from '../lib/file-utils'
import type { FSEvent } from '../../shared/types'

export function useFsEvents(): void {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)

  useEffect(() => {
    if (!workspacePath) return

    window.electronAPI.fsWatch.watch(workspacePath)

    const unsubscribe = window.electronAPI.fsWatch.onEvent(async (event: FSEvent) => {
      const parentDir = dirname(event.path)
      const expandedPaths = useWorkspaceStore.getState().expandedPaths
      const isVisible = parentDir === workspacePath || expandedPaths.has(parentDir)

      if (!isVisible) return

      // Re-read the parent directory to get updated listing
      try {
        const nodes = await window.electronAPI.fs.readDir(parentDir)
        if (parentDir === workspacePath) {
          useWorkspaceStore.getState().setRootNodes(nodes)
        } else {
          useWorkspaceStore.getState().updateNodeChildren(parentDir, nodes)
        }
      } catch {
        // Directory may have been deleted
      }

      // Handle tab updates for deleted files
      if (event.type === 'unlink') {
        const tab = useTabStore.getState().findTabByFilePath(event.path)
        if (tab) {
          useTabStore.getState().closeTab(tab.id)
        }
      }

      // Refresh markdown preview for changed files
      if (event.type === 'change') {
        const tab = useTabStore.getState().findTabByFilePath(event.path)
        if (tab) {
          // Force re-render by updating a timestamp-like field
          useTabStore.getState().updateTab(tab.id, { label: tab.label })
        }
      }
    })

    return () => {
      window.electronAPI.fsWatch.unwatch()
      unsubscribe()
    }
  }, [workspacePath])
}
