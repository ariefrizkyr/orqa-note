import { BrowserWindow } from 'electron'
import { join } from 'path'
import { stopWatching } from './fs-watcher'
import { addWorkspaceRoot, removeWorkspaceRoot } from '../ipc/fs-handlers'

// Map of window id → workspace path for multi-window support
const windowWorkspacePaths = new Map<number, string>()

export function createWindow(workspacePath?: string): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webviewTag: true
    }
  })

  if (workspacePath) {
    windowWorkspacePaths.set(win.id, workspacePath)
    addWorkspaceRoot(workspacePath)
  }

  // In dev, load from vite dev server; in prod, load the built file
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.on('closed', () => {
    stopWatching(win.id)
    const wsPath = windowWorkspacePaths.get(win.id)
    if (wsPath) removeWorkspaceRoot(wsPath)
    windowWorkspacePaths.delete(win.id)
  })

  return win
}

export function getWindowWorkspacePath(windowId: number): string | undefined {
  return windowWorkspacePaths.get(windowId)
}
