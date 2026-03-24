import { app, BrowserWindow, ipcMain } from 'electron'
import { registerFsHandlers } from './ipc/fs-handlers'
import { registerWorkspaceHandlers } from './ipc/workspace-handlers'
import { registerTabHandlers } from './ipc/tab-handlers'
import { registerWebviewHandlers } from './ipc/webview-handlers'
import { registerUpdaterHandlers } from './ipc/updater-handlers'
import { registerWorkspaceGroupHandlers } from './ipc/workspace-group-handlers'
import { registerGlobalUIHandlers } from './ipc/global-ui-handlers'
import { registerTerminalHandlers } from './ipc/terminal-handlers'
import { startWatching, stopWatching, stopAllWatching, updateWatchedPaths } from './services/fs-watcher'
import { createWindow } from './services/window-manager'
import { buildAppMenu } from './services/app-menu'
import { scheduleUpdateCheck } from './services/auto-updater'
import { getLastOpenedGroupIds, getGroup } from './services/workspace-group-persistence'

app.setName('Orqa')

// Register IPC handlers before window creation
registerFsHandlers()
registerWorkspaceHandlers()
registerTabHandlers()
registerWebviewHandlers()
registerUpdaterHandlers()
registerWorkspaceGroupHandlers()
registerGlobalUIHandlers()
registerTerminalHandlers()

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

ipcMain.on('fsWatch:updatePaths', (event, paths: string[]) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    updateWatchedPaths(win.id, paths)
  }
})

app.whenReady().then(async () => {
  buildAppMenu()
  scheduleUpdateCheck()

  // Restore previously open workspace groups
  const lastGroupIds = await getLastOpenedGroupIds()

  if (lastGroupIds.length > 0) {
    for (const groupId of lastGroupIds) {
      const group = await getGroup(groupId)
      if (group) {
        const win = createWindow(groupId)
        // Send active workspace once window is ready
        if (group.activeWorkspace) {
          win.webContents.once('did-finish-load', () => {
            win.webContents.send('menu:open-folder', group.activeWorkspace)
          })
        }
      }
    }
  } else {
    // No groups — show welcome screen
    createWindow()
  }

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
