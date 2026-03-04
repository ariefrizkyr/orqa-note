import { ipcMain } from 'electron'
import { getTabState, saveTabState } from '../services/state-persistence'
import type { WorkspaceState } from '../../shared/types'

export function registerTabHandlers(): void {
  ipcMain.handle('tabs:getState', async (_event, workspacePath: string) => {
    return getTabState(workspacePath)
  })

  ipcMain.handle(
    'tabs:saveState',
    async (_event, workspacePath: string, state: WorkspaceState) => {
      await saveTabState(workspacePath, state)
    }
  )
}
