import { ipcMain, dialog, BrowserWindow } from 'electron'
import {
  getRecentWorkspaces,
  setRecentWorkspaces,
  addRecentWorkspace
} from '../services/state-persistence'
import { addWorkspaceRoot } from './fs-handlers'

export function registerWorkspaceHandlers(): void {
  ipcMain.handle('workspace:openFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const folderPath = result.filePaths[0]
    await addRecentWorkspace(folderPath)
    addWorkspaceRoot(folderPath)

    return folderPath
  })

  ipcMain.handle('workspace:getInitialPath', () => {
    // No longer used for workspace path — group system handles this
    return null
  })

  ipcMain.handle('workspace:getRecent', async () => {
    return getRecentWorkspaces()
  })

  ipcMain.handle('workspace:setRecent', async (_event, paths: string[]) => {
    await setRecentWorkspaces(paths)
  })
}
