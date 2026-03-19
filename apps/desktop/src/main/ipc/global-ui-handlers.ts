import { ipcMain } from 'electron'
import { getGlobalUIState, saveGlobalUIState } from '../services/global-ui-persistence'
import type { GlobalUIState } from '../../shared/types'

export function registerGlobalUIHandlers(): void {
  ipcMain.handle('globalUI:getState', async () => {
    return getGlobalUIState()
  })

  ipcMain.handle('globalUI:saveState', async (_event, state: GlobalUIState) => {
    await saveGlobalUIState(state)
  })
}
