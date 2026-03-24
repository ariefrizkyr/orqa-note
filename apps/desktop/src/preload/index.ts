import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, FSEvent, UpdateStatus, WorkspaceState, GlobalUIState } from '../shared/types'

const api: ElectronAPI = {
  fs: {
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    readBinaryFile: (filePath: string) => ipcRenderer.invoke('fs:readBinaryFile', filePath),
    readBookmark: (filePath: string) => ipcRenderer.invoke('fs:readBookmark', filePath),
    createFile: (dirPath: string, name: string, content?: string) => ipcRenderer.invoke('fs:createFile', dirPath, name, content),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    writeBinaryFile: (filePath: string, data: Uint8Array) => ipcRenderer.invoke('fs:writeBinaryFile', filePath, data),
    createDir: (dirPath: string, name: string) => ipcRenderer.invoke('fs:createDir', dirPath, name),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    trash: (filePath: string) => ipcRenderer.invoke('fs:trash', filePath),
    copy: (srcPath: string, destPath: string) => ipcRenderer.invoke('fs:copy', srcPath, destPath),
    move: (srcPath: string, destPath: string) => ipcRenderer.invoke('fs:move', srcPath, destPath),
    revealInFinder: (filePath: string) => ipcRenderer.send('fs:revealInFinder', filePath),
    copyPath: (filePath: string) => ipcRenderer.send('fs:copyPath', filePath),
    openInDefaultApp: (filePath: string) => ipcRenderer.send('fs:openInDefaultApp', filePath),
    listAllFiles: (rootPath: string) => ipcRenderer.invoke('fs:listAllFiles', rootPath),
    existsFile: (filePath: string) => ipcRenderer.invoke('fs:existsFile', filePath),
    existsDir: (dirPath: string) => ipcRenderer.invoke('fs:existsDir', dirPath),
    fetchPageTitle: (url: string) => ipcRenderer.invoke('fs:fetchPageTitle', url),
    showSaveDialog: (options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => ipcRenderer.invoke('fs:showSaveDialog', options)
  },
  workspace: {
    openFolder: () => ipcRenderer.invoke('workspace:openFolder'),
    getInitialPath: () => ipcRenderer.invoke('workspace:getInitialPath'),
    getRecent: () => ipcRenderer.invoke('workspace:getRecent'),
    setRecent: (paths: string[]) => ipcRenderer.invoke('workspace:setRecent', paths)
  },
  tabs: {
    getState: (workspacePath: string) => ipcRenderer.invoke('tabs:getState', workspacePath),
    saveState: (workspacePath: string, state: WorkspaceState) =>
      ipcRenderer.invoke('tabs:saveState', workspacePath, state)
  },
  webview: {
    openExternal: (url: string) => ipcRenderer.invoke('webview:openExternal', url),
    getPartition: (workspacePath: string) => ipcRenderer.invoke('webview:getPartition', workspacePath)
  },
  workspaceGroup: {
    getForWindow: () => ipcRenderer.invoke('workspaceGroup:getForWindow'),
    addWorkspace: (workspacePath: string) =>
      ipcRenderer.invoke('workspaceGroup:addWorkspace', workspacePath),
    removeWorkspace: (workspacePath: string) =>
      ipcRenderer.invoke('workspaceGroup:removeWorkspace', workspacePath),
    setActiveWorkspace: (workspacePath: string) =>
      ipcRenderer.invoke('workspaceGroup:setActiveWorkspace', workspacePath),
    rename: (name: string) =>
      ipcRenderer.invoke('workspaceGroup:rename', name),
    getAll: () => ipcRenderer.invoke('workspaceGroup:getAll'),
    create: (name: string, firstWorkspacePath: string) =>
      ipcRenderer.invoke('workspaceGroup:create', name, firstWorkspacePath),
    open: (groupId: string) => ipcRenderer.invoke('workspaceGroup:open', groupId)
  },
  globalUI: {
    getState: () => ipcRenderer.invoke('globalUI:getState'),
    saveState: (state: GlobalUIState) => ipcRenderer.invoke('globalUI:saveState', state)
  },
  fsWatch: {
    watch: (rootPath: string) => ipcRenderer.send('fsWatch:watch', rootPath),
    unwatch: () => ipcRenderer.send('fsWatch:unwatch'),
    updatePaths: (paths: string[]) => ipcRenderer.send('fsWatch:updatePaths', paths),
    onEvent: (callback: (event: FSEvent) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, fsEvent: FSEvent) => callback(fsEvent)
      ipcRenderer.on('fsWatch:event', handler)
      return () => ipcRenderer.removeListener('fsWatch:event', handler)
    }
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onStatus: (callback: (status: UpdateStatus) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, status: UpdateStatus) => callback(status)
      ipcRenderer.on('updater:status', handler)
      return () => ipcRenderer.removeListener('updater:status', handler)
    }
  },
  terminal: {
    create: (cwd?: string) => ipcRenderer.invoke('terminal:create', cwd),
    write: (sessionId: string, data: string) => ipcRenderer.send('terminal:write', sessionId, data),
    resize: (sessionId: string, cols: number, rows: number) => ipcRenderer.send('terminal:resize', sessionId, cols, rows),
    kill: (sessionId: string) => ipcRenderer.send('terminal:kill', sessionId),
    getShellName: () => ipcRenderer.invoke('terminal:getShellName'),
    onData: (callback: (sessionId: string, data: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, sessionId: string, data: string) => callback(sessionId, data)
      ipcRenderer.on('terminal:data', handler)
      return () => ipcRenderer.removeListener('terminal:data', handler)
    },
    onExit: (callback: (sessionId: string, exitCode: number) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, sessionId: string, exitCode: number) => callback(sessionId, exitCode)
      ipcRenderer.on('terminal:exit', handler)
      return () => ipcRenderer.removeListener('terminal:exit', handler)
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

// Forward menu events to renderer as DOM custom events
ipcRenderer.on('menu:open-folder', (_event, folderPath: string) => {
  window.dispatchEvent(new CustomEvent('workspace:open', { detail: folderPath }))
})
