import { ipcMain, dialog, BrowserWindow } from 'electron'
import {
  getRecentWorkspaces,
  setRecentWorkspaces,
  addRecentWorkspace
} from '../services/state-persistence'
import { createWindow, getWindowWorkspacePath } from '../services/window-manager'
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

    // If current window has no workspace, open in same window
    const currentWorkspace = getWindowWorkspacePath(win.id)
    if (!currentWorkspace) {
      return folderPath
    }

    // Otherwise open in a new window
    createWindow(folderPath)
    return null
  })

  ipcMain.handle('workspace:getInitialPath', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    return getWindowWorkspacePath(win.id) ?? null
  })

  ipcMain.handle('workspace:getRecent', async () => {
    return getRecentWorkspaces()
  })

  ipcMain.handle('workspace:setRecent', async (_event, paths: string[]) => {
    await setRecentWorkspaces(paths)
  })
}
