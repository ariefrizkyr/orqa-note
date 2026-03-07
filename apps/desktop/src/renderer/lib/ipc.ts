import type { WorkspaceState } from '../../shared/types'

let saveTimer: ReturnType<typeof setTimeout> | null = null
let pendingWorkspacePath: string | null = null

export function cancelPendingSave(): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  pendingWorkspacePath = null
}

export function debouncedSaveTabState(
  workspacePath: string,
  state: WorkspaceState
): void {
  if (saveTimer) clearTimeout(saveTimer)
  pendingWorkspacePath = workspacePath
  saveTimer = setTimeout(() => {
    // Guard: only save if workspace hasn't changed since debounce started
    if (pendingWorkspacePath === workspacePath) {
      window.electronAPI.tabs.saveState(workspacePath, state)
    }
    saveTimer = null
    pendingWorkspacePath = null
  }, 1000)
}

export function flushSaveTabState(
  workspacePath: string,
  state: WorkspaceState
): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  pendingWorkspacePath = null
  return window.electronAPI.tabs.saveState(workspacePath, state)
}
