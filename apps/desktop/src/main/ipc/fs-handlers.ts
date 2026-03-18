import { ipcMain, shell, clipboard, dialog, BrowserWindow } from 'electron'
import { readdir, stat, readFile, writeFile, mkdir, rename, cp } from 'fs/promises'
import { join, extname, basename, resolve, relative } from 'path'
import type { FileNode, BookmarkFile } from '../../shared/types'

interface FileEntry {
  name: string
  path: string
  extension: string
}

const IGNORED_NAMES = new Set(['node_modules', '.git', '.DS_Store'])

const log = {
  error: (context: string, err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[fs] ${context}:`, message)
  },
  warn: (context: string, msg: string) => {
    console.warn(`[fs] ${context}:`, msg)
  },
}

// Track known workspace roots so we can validate paths
const activeWorkspaceRoots = new Set<string>()

export function addWorkspaceRoot(root: string): void {
  activeWorkspaceRoots.add(resolve(root))
}

export function removeWorkspaceRoot(root: string): void {
  activeWorkspaceRoots.delete(resolve(root))
}

function isWithinWorkspace(targetPath: string): boolean {
  if (activeWorkspaceRoots.size === 0) return true
  const resolved = resolve(targetPath)
  for (const root of activeWorkspaceRoots) {
    const rel = relative(root, resolved)
    if (!rel.startsWith('..') && !rel.startsWith('/')) return true
  }
  return false
}

function assertWithinWorkspace(targetPath: string, operation: string): void {
  if (!isWithinWorkspace(targetPath)) {
    const msg = `Path outside workspace boundary: ${targetPath}`
    log.warn(operation, msg)
    throw new Error(msg)
  }
}

async function listAllFilesRecursive(dirPath: string): Promise<FileEntry[]> {
  const results: FileEntry[] = []
  const entries = await readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith('.') || IGNORED_NAMES.has(entry.name)) continue
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await listAllFilesRecursive(fullPath)))
    } else {
      results.push({
        name: entry.name,
        path: fullPath,
        extension: extname(entry.name).slice(1).toLowerCase()
      })
    }
  }
  return results
}

async function readDirShallow(dirPath: string): Promise<FileNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const nodes: FileNode[] = []

  for (const entry of entries) {
    if (IGNORED_NAMES.has(entry.name)) continue

    const fullPath = join(dirPath, entry.name)
    const isDir = entry.isDirectory()

    nodes.push({
      name: entry.name,
      path: fullPath,
      type: isDir ? 'directory' : 'file',
      extension: isDir ? undefined : extname(entry.name).slice(1).toLowerCase()
    })
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function registerFsHandlers(): void {
  ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
    try {
      assertWithinWorkspace(dirPath, 'readDir')
      return await readDirShallow(dirPath)
    } catch (err) {
      log.error('readDir', err)
      throw err
    }
  })

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      assertWithinWorkspace(filePath, 'readFile')
      return await readFile(filePath, 'utf-8')
    } catch (err) {
      log.error('readFile', err)
      throw err
    }
  })

  ipcMain.handle('fs:readBinaryFile', async (_event, filePath: string) => {
    try {
      assertWithinWorkspace(filePath, 'readBinaryFile')
      return await readFile(filePath)
    } catch (err) {
      log.error('readBinaryFile', err)
      throw err
    }
  })

  ipcMain.handle('fs:readBookmark', async (_event, filePath: string) => {
    try {
      assertWithinWorkspace(filePath, 'readBookmark')
      const content = await readFile(filePath, 'utf-8')
      const bookmark: BookmarkFile = JSON.parse(content)
      if (bookmark.type !== 'bookmark' || !bookmark.url || !bookmark.label) {
        throw new Error('Invalid bookmark file')
      }
      return bookmark
    } catch (err) {
      log.error('readBookmark', err)
      throw err
    }
  })

  ipcMain.handle('fs:createFile', async (_event, dirPath: string, name: string, content?: string) => {
    try {
      const filePath = join(dirPath, name)
      assertWithinWorkspace(filePath, 'createFile')
      await writeFile(filePath, content || '', 'utf-8')
      return filePath
    } catch (err) {
      log.error('createFile', err)
      throw err
    }
  })

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    try {
      assertWithinWorkspace(filePath, 'writeFile')
      await writeFile(filePath, content, 'utf-8')
    } catch (err) {
      log.error('writeFile', err)
      throw err
    }
  })

  ipcMain.handle('fs:writeBinaryFile', async (_event, filePath: string, data: Uint8Array) => {
    try {
      assertWithinWorkspace(filePath, 'writeBinaryFile')
      await writeFile(filePath, Buffer.from(data))
    } catch (err) {
      log.error('writeBinaryFile', err)
      throw err
    }
  })

  ipcMain.handle('fs:createDir', async (_event, dirPath: string, name: string) => {
    try {
      const fullPath = join(dirPath, name)
      assertWithinWorkspace(fullPath, 'createDir')
      await mkdir(fullPath, { recursive: true })
      return fullPath
    } catch (err) {
      log.error('createDir', err)
      throw err
    }
  })

  ipcMain.handle('fs:rename', async (_event, oldPath: string, newPath: string) => {
    try {
      assertWithinWorkspace(oldPath, 'rename')
      assertWithinWorkspace(newPath, 'rename')
      await rename(oldPath, newPath)
    } catch (err) {
      log.error('rename', err)
      throw err
    }
  })

  ipcMain.handle('fs:trash', async (_event, filePath: string) => {
    try {
      assertWithinWorkspace(filePath, 'trash')
      await shell.trashItem(filePath)
    } catch (err) {
      log.error('trash', err)
      throw err
    }
  })

  ipcMain.handle('fs:copy', async (_event, srcPath: string, destPath: string) => {
    try {
      assertWithinWorkspace(srcPath, 'copy')
      assertWithinWorkspace(destPath, 'copy')
      const fileName = basename(srcPath)
      const newPath = join(destPath, fileName)
      await cp(srcPath, newPath, { recursive: true })
    } catch (err) {
      log.error('copy', err)
      throw err
    }
  })

  ipcMain.handle('fs:move', async (_event, srcPath: string, destPath: string) => {
    try {
      assertWithinWorkspace(srcPath, 'move')
      assertWithinWorkspace(destPath, 'move')
      const fileName = basename(srcPath)
      const newPath = join(destPath, fileName)
      await rename(srcPath, newPath)
    } catch (err) {
      log.error('move', err)
      throw err
    }
  })

  ipcMain.on('fs:revealInFinder', (_event, filePath: string) => {
    if (isWithinWorkspace(filePath)) {
      shell.showItemInFolder(filePath)
    }
  })

  ipcMain.on('fs:copyPath', (_event, filePath: string) => {
    clipboard.writeText(filePath)
  })

  ipcMain.on('fs:openInDefaultApp', (_event, filePath: string) => {
    if (isWithinWorkspace(filePath)) {
      shell.openPath(filePath)
    }
  })

  ipcMain.handle('fs:listAllFiles', async (_event, rootPath: string) => {
    try {
      assertWithinWorkspace(rootPath, 'listAllFiles')
      return await listAllFilesRecursive(rootPath)
    } catch (err) {
      log.error('listAllFiles', err)
      throw err
    }
  })

  ipcMain.handle('fs:fetchPageTitle', async (_event, url: string) => {
    if (!isValidUrl(url)) {
      log.warn('fetchPageTitle', `Invalid URL rejected: ${url}`)
      return null
    }
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'OrqaNote/1.0' }
      })
      clearTimeout(timeout)
      const html = await res.text()
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      return match ? match[1].trim() : null
    } catch (err) {
      log.error('fetchPageTitle', err)
      return null
    }
  })

  ipcMain.handle('fs:existsFile', async (_event, filePath: string) => {
    try {
      const s = await stat(filePath)
      return s.isFile()
    } catch {
      return false
    }
  })

  ipcMain.handle('fs:existsDir', async (_event, dirPath: string) => {
    try {
      const s = await stat(dirPath)
      return s.isDirectory()
    } catch {
      return false
    }
  })

  ipcMain.handle('fs:showSaveDialog', async (_event, options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showSaveDialog(win, {
      defaultPath: options.defaultPath,
      filters: options.filters,
    })
    if (result.canceled || !result.filePath) return null
    return result.filePath
  })
}
