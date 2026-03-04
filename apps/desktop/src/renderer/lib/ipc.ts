import type { WorkspaceState } from '../../shared/types'

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function debouncedSaveTabState(
  workspacePath: string,
  state: WorkspaceState
): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    window.electronAPI.tabs.saveState(workspacePath, state)
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
  return window.electronAPI.tabs.saveState(workspacePath, state)
}
