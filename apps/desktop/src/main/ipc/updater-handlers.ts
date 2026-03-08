import { ipcMain } from 'electron'
import { checkForUpdates, downloadUpdate, installUpdate } from '../services/auto-updater'

export function registerUpdaterHandlers(): void {
  ipcMain.handle('updater:check', () => {
    checkForUpdates()
  })

  ipcMain.handle('updater:download', () => {
    downloadUpdate()
  })

  ipcMain.handle('updater:install', () => {
    installUpdate()
  })
}
