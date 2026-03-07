export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  extension?: string
  children?: FileNode[]
}

export interface BookmarkFile {
  type: 'bookmark'
  url: string
  label: string
  service: 'docs' | 'sheets' | 'slides' | 'figma' | 'other'
}

export interface Tab {
  id: string
  type: 'file' | 'bookmark' | 'new-tab'
  filePath?: string
  bookmarkUrl?: string
  label: string
  icon: string
  scrollPosition?: number
  isDirty?: boolean
}

export interface WorkspaceState {
  tabs: Tab[]
  activeTabId: string | null
  sidebarWidth: number
  sidebarVisible?: boolean
}

export type FSEventType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'

export interface FSEvent {
  type: FSEventType
  path: string
}

export interface ElectronAPI {
  fs: {
    readDir: (dirPath: string) => Promise<FileNode[]>
    readFile: (filePath: string) => Promise<string>
    readBinaryFile: (filePath: string) => Promise<Uint8Array>
    readBookmark: (filePath: string) => Promise<BookmarkFile>
    createFile: (dirPath: string, name: string, content?: string) => Promise<string>
    writeFile: (filePath: string, content: string) => Promise<void>
    createDir: (dirPath: string, name: string) => Promise<string>
    rename: (oldPath: string, newPath: string) => Promise<void>
    trash: (filePath: string) => Promise<void>
    move: (srcPath: string, destPath: string) => Promise<void>
    revealInFinder: (filePath: string) => void
    copyPath: (filePath: string) => void
    openInDefaultApp: (filePath: string) => void
    listAllFiles: (rootPath: string) => Promise<{ name: string; path: string; extension: string }[]>
    existsFile: (filePath: string) => Promise<boolean>
    existsDir: (dirPath: string) => Promise<boolean>
    fetchPageTitle: (url: string) => Promise<string | null>
  }
  workspace: {
    openFolder: () => Promise<string | null>
    getInitialPath: () => Promise<string | null>
    getRecent: () => Promise<string[]>
    setRecent: (paths: string[]) => Promise<void>
  }
  tabs: {
    getState: (workspacePath: string) => Promise<WorkspaceState | null>
    saveState: (workspacePath: string, state: WorkspaceState) => Promise<void>
  }
  webview: {
    openExternal: (url: string) => Promise<void>
    getPartition: (workspacePath: string) => Promise<string>
  }
  fsWatch: {
    watch: (rootPath: string) => void
    unwatch: () => void
    updatePaths: (paths: string[]) => void
    onEvent: (callback: (event: FSEvent) => void) => () => void
  }
}
