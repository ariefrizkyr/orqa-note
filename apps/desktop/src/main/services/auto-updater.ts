import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateInfo, ProgressInfo } from 'electron-updater'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

function broadcastStatus(payload: Record<string, unknown>): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('updater:status', payload)
  }
}

autoUpdater.on('checking-for-update', () => {
  broadcastStatus({ status: 'checking' })
})

autoUpdater.on('update-available', (info: UpdateInfo) => {
  broadcastStatus({ status: 'available', version: info.version })
})

autoUpdater.on('update-not-available', () => {
  broadcastStatus({ status: 'not-available', version: app.getVersion() })
})

autoUpdater.on('download-progress', (progress: ProgressInfo) => {
  broadcastStatus({ status: 'downloading', progress: Math.round(progress.percent) })
})

autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
  broadcastStatus({ status: 'downloaded', version: info.version })
})

autoUpdater.on('error', (err: Error) => {
  broadcastStatus({ status: 'error', error: err.message })
})

export function checkForUpdates(): void {
  autoUpdater.checkForUpdates().catch(() => {
    // Errors are handled by the 'error' event listener
  })
}

export function downloadUpdate(): void {
  autoUpdater.downloadUpdate()
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall()
}

export function scheduleUpdateCheck(): void {
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {
      // Silent fail on background check
    })
  }, 10_000)
}
