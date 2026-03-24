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
  contentVersion?: number
}

export interface WorkspaceState {
  tabs: Tab[]
  activeTabId: string | null
  sidebarVisible?: boolean
  expandedPaths?: string[]
  /** @deprecated Use global UI state for sidebarWidth */
  sidebarWidth?: number
}

export interface WorkspaceGroup {
  id: string
  name: string
  workspaces: string[]
  activeWorkspace: string | null
}

export interface WorkspaceGroupsFile {
  groups: WorkspaceGroup[]
  lastOpenedGroupIds: string[]
}

export interface GlobalUIState {
  sidebarWidth: number
  terminalVisible?: boolean
  terminalWidth?: number
}

export type FSEventType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'

export interface FSEvent {
  type: FSEventType
  path: string
}

export type UpdateStatusType = 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export interface UpdateStatus {
  status: UpdateStatusType
  version?: string
  progress?: number
  error?: string
}

export interface ElectronAPI {
  fs: {
    readDir: (dirPath: string) => Promise<FileNode[]>
    readFile: (filePath: string) => Promise<string>
    readBinaryFile: (filePath: string) => Promise<Uint8Array>
    readBookmark: (filePath: string) => Promise<BookmarkFile>
    createFile: (dirPath: string, name: string, content?: string) => Promise<string>
    writeFile: (filePath: string, content: string) => Promise<void>
    writeBinaryFile: (filePath: string, data: Uint8Array) => Promise<void>
    createDir: (dirPath: string, name: string) => Promise<string>
    rename: (oldPath: string, newPath: string) => Promise<void>
    trash: (filePath: string) => Promise<void>
    copy: (srcPath: string, destPath: string) => Promise<void>
    move: (srcPath: string, destPath: string) => Promise<void>
    revealInFinder: (filePath: string) => void
    copyPath: (filePath: string) => void
    openInDefaultApp: (filePath: string) => void
    listAllFiles: (rootPath: string) => Promise<{ name: string; path: string; extension: string }[]>
    existsFile: (filePath: string) => Promise<boolean>
    existsDir: (dirPath: string) => Promise<boolean>
    fetchPageTitle: (url: string) => Promise<string | null>
    showSaveDialog: (options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>
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
  workspaceGroup: {
    getForWindow: () => Promise<WorkspaceGroup | null>
    addWorkspace: (workspacePath: string) => Promise<WorkspaceGroup>
    removeWorkspace: (workspacePath: string) => Promise<WorkspaceGroup>
    setActiveWorkspace: (workspacePath: string) => Promise<void>
    rename: (name: string) => Promise<WorkspaceGroup>
    getAll: () => Promise<WorkspaceGroup[]>
    create: (name: string, firstWorkspacePath: string) => Promise<WorkspaceGroup>
    open: (groupId: string) => Promise<void>
  }
  globalUI: {
    getState: () => Promise<GlobalUIState>
    saveState: (state: GlobalUIState) => Promise<void>
  }
  fsWatch: {
    watch: (rootPath: string) => void
    unwatch: () => void
    updatePaths: (paths: string[]) => void
    onEvent: (callback: (event: FSEvent) => void) => () => void
  }
  updater: {
    check: () => Promise<void>
    download: () => Promise<void>
    install: () => Promise<void>
    onStatus: (callback: (status: UpdateStatus) => void) => () => void
  }
  terminal: {
    create: (cwd?: string) => Promise<string>
    write: (sessionId: string, data: string) => void
    resize: (sessionId: string, cols: number, rows: number) => void
    kill: (sessionId: string) => void
    getShellName: () => Promise<string>
    onData: (callback: (sessionId: string, data: string) => void) => () => void
    onExit: (callback: (sessionId: string, exitCode: number) => void) => () => void
  }
}
