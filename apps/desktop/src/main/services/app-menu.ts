import { app, Menu, dialog, BrowserWindow } from 'electron'
import { addRecentWorkspace } from './state-persistence'
import { createWindow, getWindowWorkspacePath } from './window-manager'
import { checkForUpdates } from './auto-updater'

export function buildAppMenu(): void {
  const appName = app.name

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: appName,
      submenu: [
        { role: 'about' },
        {
          label: 'Check for Updates...',
          click: () => checkForUpdates()
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const win = BrowserWindow.getFocusedWindow()
            if (!win) return

            const result = await dialog.showOpenDialog(win, {
              properties: ['openDirectory']
            })
            if (result.canceled || result.filePaths.length === 0) return

            const folderPath = result.filePaths[0]
            await addRecentWorkspace(folderPath)

            const currentWorkspace = getWindowWorkspacePath(win.id)
            if (!currentWorkspace) {
              win.webContents.send('menu:open-folder', folderPath)
            } else {
              createWindow(folderPath)
            }
          }
        },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
