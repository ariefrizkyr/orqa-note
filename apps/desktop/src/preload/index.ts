import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, FSEvent, WorkspaceState } from '../shared/types'

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
  fsWatch: {
    watch: (rootPath: string) => ipcRenderer.send('fsWatch:watch', rootPath),
    unwatch: () => ipcRenderer.send('fsWatch:unwatch'),
    updatePaths: (paths: string[]) => ipcRenderer.send('fsWatch:updatePaths', paths),
    onEvent: (callback: (event: FSEvent) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, fsEvent: FSEvent) => callback(fsEvent)
      ipcRenderer.on('fsWatch:event', handler)
      return () => ipcRenderer.removeListener('fsWatch:event', handler)
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

// Forward menu events to renderer as DOM custom events
ipcRenderer.on('menu:open-folder', (_event, folderPath: string) => {
  window.dispatchEvent(new CustomEvent('workspace:open', { detail: folderPath }))
})
