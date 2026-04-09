import { BrowserWindow, Menu, clipboard, shell } from 'electron'
import { join, basename } from 'path'
import { stopWatching } from './fs-watcher'
import {
  getGroup,
  removeLastOpenedGroup
} from './workspace-group-persistence'

// Map of window id → group id for multi-window support
const windowGroupMap = new Map<number, string>()

export function createWindow(groupId?: string): BrowserWindow {
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

  if (groupId) {
    windowGroupMap.set(win.id, groupId)
    // Set title asynchronously from group data
    updateWindowTitle(win.id)
  }

  // Native right-click context menu for every editable surface in the window
  // (Milkdown, CodeMirror, Excalidraw, Spreadsheet, plain inputs).
  win.webContents.on('context-menu', (_event, params) => {
    const { editFlags, selectionText, isEditable, linkURL } = params
    const hasText = selectionText.trim().length > 0
    const template: Electron.MenuItemConstructorOptions[] = []

    if (linkURL) {
      template.push(
        { label: 'Open Link in Browser', click: () => { void shell.openExternal(linkURL) } },
        { label: 'Copy Link', click: () => clipboard.writeText(linkURL) },
        { type: 'separator' },
      )
    }

    if (isEditable) {
      template.push(
        { role: 'undo', enabled: editFlags.canUndo },
        { role: 'redo', enabled: editFlags.canRedo },
        { type: 'separator' },
        { role: 'cut', enabled: editFlags.canCut },
        { role: 'copy', enabled: editFlags.canCopy },
        { role: 'paste', enabled: editFlags.canPaste },
        { type: 'separator' },
        { role: 'selectAll' },
      )
    } else if (hasText) {
      template.push({ role: 'copy' })
    }

    if (template.length > 0) {
      Menu.buildFromTemplate(template).popup({ window: win })
    }
  })

  // In dev, load from vite dev server; in prod, load the built file
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.on('closed', () => {
    stopWatching(win.id)
    const gId = windowGroupMap.get(win.id)
    if (gId) {
      removeLastOpenedGroup(gId)
    }
    windowGroupMap.delete(win.id)
  })

  return win
}

export function getWindowGroupId(windowId: number): string | undefined {
  return windowGroupMap.get(windowId)
}

export function setWindowGroupId(windowId: number, groupId: string): void {
  windowGroupMap.set(windowId, groupId)
}

export function clearWindowGroupId(windowId: number): void {
  windowGroupMap.delete(windowId)
}

export function findWindowByGroupId(groupId: string): BrowserWindow | undefined {
  for (const [winId, gId] of windowGroupMap.entries()) {
    if (gId === groupId) {
      return BrowserWindow.fromId(winId) ?? undefined
    }
  }
  return undefined
}

export async function updateWindowTitle(windowId: number): Promise<void> {
  const groupId = windowGroupMap.get(windowId)
  if (!groupId) return

  const group = await getGroup(groupId)
  if (!group) return

  const win = BrowserWindow.fromId(windowId)
  if (!win) return

  const workspaceName = group.activeWorkspace ? basename(group.activeWorkspace) : 'No workspace'
  win.setTitle(`${group.name} — ${workspaceName}`)
}

// Legacy helper for workspace root tracking (used by fs-handlers)
export function getWindowWorkspacePath(_windowId: number): string | undefined {
  // This is now resolved via group's activeWorkspace
  return undefined
}
