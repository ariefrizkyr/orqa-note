import { app, Menu, dialog, BrowserWindow } from 'electron'
import { basename } from 'path'
import { addRecentWorkspace } from './state-persistence'
import {
  getAllGroups,
  createGroup,
  addLastOpenedGroup
} from './workspace-group-persistence'
import { createWindow, findWindowByGroupId } from './window-manager'
import { checkForUpdates } from './auto-updater'

export async function buildAppMenu(): Promise<void> {
  const appName = app.name
  const groups = await getAllGroups()

  const groupMenuItems: Electron.MenuItemConstructorOptions[] = groups.map((group) => ({
    label: group.name,
    click: () => {
      const existingWin = findWindowByGroupId(group.id)
      if (existingWin) {
        existingWin.focus()
        return
      }
      const win = createWindow(group.id)
      addLastOpenedGroup(group.id)
      if (group.activeWorkspace) {
        win.webContents.once('did-finish-load', () => {
          win.webContents.send('menu:open-folder', group.activeWorkspace)
        })
      }
    }
  }))

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
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            createWindow()
          }
        },
        { type: 'separator' },
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
            win.webContents.send('menu:open-folder', folderPath)
          }
        },
        { type: 'separator' },
        {
          label: 'Open Workspace Group',
          submenu: [
            ...groupMenuItems,
            ...(groupMenuItems.length > 0 ? [{ type: 'separator' as const }] : []),
            {
              label: 'New Group...',
              click: async () => {
                const win = BrowserWindow.getFocusedWindow()
                if (!win) return

                // Open folder picker for first workspace — group name derived from folder
                const folderResult = await dialog.showOpenDialog(win, {
                  properties: ['openDirectory'],
                  title: 'Select first workspace folder for new group'
                })
                if (folderResult.canceled || folderResult.filePaths.length === 0) return

                const folderPath = folderResult.filePaths[0]
                const groupName = basename(folderPath)

                const group = await createGroup(groupName, folderPath)
                const newWin = createWindow(group.id)
                await addLastOpenedGroup(group.id)
                newWin.webContents.once('did-finish-load', () => {
                  newWin.webContents.send('menu:open-folder', folderPath)
                })

                // Rebuild menu to include new group
                buildAppMenu()
              }
            }
          ]
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

export function rebuildAppMenu(): void {
  buildAppMenu()
}
