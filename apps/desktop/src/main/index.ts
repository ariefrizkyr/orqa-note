import { app, BrowserWindow, ipcMain } from 'electron'
import { registerFsHandlers } from './ipc/fs-handlers'
import { registerWorkspaceHandlers } from './ipc/workspace-handlers'
import { registerTabHandlers } from './ipc/tab-handlers'
import { registerWebviewHandlers } from './ipc/webview-handlers'
import { startWatching, stopWatching, stopAllWatching } from './services/fs-watcher'
import { createWindow } from './services/window-manager'

app.setName('Orqa')

// Register IPC handlers before window creation
registerFsHandlers()
registerWorkspaceHandlers()
registerTabHandlers()
registerWebviewHandlers()

// FS watch IPC — per-window watchers
ipcMain.on('fsWatch:watch', (event, rootPath: string) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    startWatching(rootPath, win)
  }
})

ipcMain.on('fsWatch:unwatch', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    stopWatching(win.id)
  }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopAllWatching()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
