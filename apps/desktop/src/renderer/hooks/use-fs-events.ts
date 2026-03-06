import { useEffect } from 'react'
import { useWorkspaceStore } from '../stores/workspace-store'
import { useTabStore } from '../stores/tab-store'
import { dirname } from '../lib/file-utils'
import type { FSEvent } from '../../shared/types'

/**
 * Tracks file paths written by our own save operations so the fs watcher
 * can ignore the resulting change events instead of prompting the user.
 */
const selfWrittenPaths = new Map<string, ReturnType<typeof setTimeout>>()
const SELF_WRITE_WINDOW_MS = 2000

export function markSelfWritten(filePath: string): void {
  const prev = selfWrittenPaths.get(filePath)
  if (prev) clearTimeout(prev)
  selfWrittenPaths.set(
    filePath,
    setTimeout(() => selfWrittenPaths.delete(filePath), SELF_WRITE_WINDOW_MS),
  )
}

function consumeSelfWritten(filePath: string): boolean {
  const timer = selfWrittenPaths.get(filePath)
  if (!timer) return false
  clearTimeout(timer)
  selfWrittenPaths.delete(filePath)
  return true
}

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

      // Handle external file changes
      if (event.type === 'change') {
        // Ignore change events caused by our own save operations
        if (consumeSelfWritten(event.path)) return

        const tab = useTabStore.getState().findTabByFilePath(event.path)
        if (tab) {
          if (tab.isDirty) {
            // File changed externally while user has unsaved changes — ask
            const reload = window.confirm(
              'File changed externally. Reload and lose your changes, or keep your version?\n\nClick OK to reload, Cancel to keep your version.',
            )
            if (reload) {
              useTabStore.getState().clearDirty(tab.id)
              // Force re-render by bumping label (triggers content reload)
              useTabStore.getState().updateTab(tab.id, { label: tab.label })
            }
          } else {
            // Not dirty — silently reload
            useTabStore.getState().updateTab(tab.id, { label: tab.label })
          }
        }
      }
    })

    return () => {
      window.electronAPI.fsWatch.unwatch()
      unsubscribe()
    }
  }, [workspacePath])
}
