import { ipcMain, BrowserWindow, app } from 'electron'
import {
  createTerminalSession,
  writeToSession,
  resizeSession,
  killSession,
  killSessionsForWindow,
  getShellName
} from '../services/terminal-manager'

export function registerTerminalHandlers(): void {
  ipcMain.handle('terminal:create', async (event, cwd?: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window found for terminal')
    return createTerminalSession(win.id, cwd)
  })

  ipcMain.handle('terminal:getShellName', async () => {
    return getShellName()
  })

  ipcMain.on('terminal:write', (_event, sessionId: string, data: string) => {
    writeToSession(sessionId, data)
  })

  ipcMain.on('terminal:resize', (_event, sessionId: string, cols: number, rows: number) => {
    resizeSession(sessionId, cols, rows)
  })

  ipcMain.on('terminal:kill', (_event, sessionId: string) => {
    killSession(sessionId)
  })

  // Clean up sessions when a window closes
  BrowserWindow.getAllWindows().forEach((win) => {
    win.on('closed', () => killSessionsForWindow(win.id))
  })

  // Also handle future windows
  app.on('browser-window-created', (_event, win) => {
    win.on('closed', () => killSessionsForWindow(win.id))
  })
}
