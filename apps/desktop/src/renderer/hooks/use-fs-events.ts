import { useEffect } from 'react'
import { useWorkspaceStore } from '../stores/workspace-store'
import { useTabStore } from '../stores/tab-store'
import { dirname } from '../lib/file-utils'
import type { FSEvent } from '../../shared/types'

/**
 * Tracks file paths written by our own save operations so the fs watcher
 * can ignore the resulting change events instead of prompting the user.
 */
const fsEventGeneration = new Map<string, number>()
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
  const expandedPaths = useWorkspaceStore((s) => s.expandedPaths)
  const tabs = useTabStore((s) => s.tabs)

  // Warn before closing window with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasDirty = useTabStore.getState().tabs.some((t) => t.isDirty)
      if (hasDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // Sync visible directories to the main process watcher
  useEffect(() => {
    if (!workspacePath) return
    const pathSet = new Set([workspacePath, ...expandedPaths])
    // Also watch directories of open tabs so we detect external changes
    for (const tab of tabs) {
      if (tab.filePath) {
        pathSet.add(dirname(tab.filePath))
      }
    }
    window.electronAPI.fsWatch.updatePaths([...pathSet])
  }, [workspacePath, expandedPaths, tabs])

  useEffect(() => {
    if (!workspacePath) return

    window.electronAPI.fsWatch.watch(workspacePath)

    const unsubscribe = window.electronAPI.fsWatch.onEvent(async (event: FSEvent) => {
      const parentDir = dirname(event.path)
      const expandedPaths = useWorkspaceStore.getState().expandedPaths
      const isVisible = parentDir === workspacePath || expandedPaths.has(parentDir)

      if (!isVisible) return

      // Generation guard: discard stale results when rapid events fire for the same dir
      const gen = (fsEventGeneration.get(parentDir) ?? 0) + 1
      fsEventGeneration.set(parentDir, gen)

      // Re-read the parent directory to get updated listing
      try {
        const nodes = await window.electronAPI.fs.readDir(parentDir)
        if (gen !== fsEventGeneration.get(parentDir)) return

        if (parentDir === workspacePath) {
          useWorkspaceStore.getState().setRootNodes(nodes)
        } else {
          useWorkspaceStore.getState().updateNodeChildren(parentDir, nodes)
        }

        // Reload children for any expanded subdirectories whose data was replaced
        const currentExpanded = useWorkspaceStore.getState().expandedPaths
        const expandedChildren = nodes.filter(
          (n) => n.type === 'directory' && currentExpanded.has(n.path)
        )
        if (expandedChildren.length > 0) {
          const results = await Promise.all(
            expandedChildren.map(async (n) => ({
              path: n.path,
              children: await window.electronAPI.fs.readDir(n.path)
            }))
          )
          if (gen !== fsEventGeneration.get(parentDir)) return

          for (const { path, children } of results) {
            useWorkspaceStore.getState().updateNodeChildren(path, children)
          }
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

      // Handle external file changes — disk is source of truth, always reload
      if (event.type === 'change') {
        // Ignore change events caused by our own save operations
        if (consumeSelfWritten(event.path)) return

        const tab = useTabStore.getState().findTabByFilePath(event.path)
        if (tab) {
          useTabStore.getState().updateTab(tab.id, {
            contentVersion: (tab.contentVersion ?? 0) + 1
          })
        }
      }
    })

    return () => {
      window.electronAPI.fsWatch.unwatch()
      unsubscribe()
    }
  }, [workspacePath])
}
