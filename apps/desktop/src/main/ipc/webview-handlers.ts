import { ipcMain, shell } from 'electron'
import { getSessionPartition } from '../services/state-persistence'

export function registerWebviewHandlers(): void {
  ipcMain.handle('webview:openExternal', async (_event, url: string) => {
    await shell.openExternal(url)
  })

  ipcMain.handle('webview:getPartition', async (_event, workspacePath: string) => {
    return getSessionPartition(workspacePath)
  })
}
