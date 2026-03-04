import { ipcMain, shell, clipboard, dialog, BrowserWindow } from 'electron'
import { readdir, stat, readFile, writeFile, mkdir, rename } from 'fs/promises'
import { join, extname, basename } from 'path'
import type { FileNode, BookmarkFile } from '../../shared/types'

interface SimpleFile {
  name: string
  path: string
  extension: string
}

const IGNORED_DIRS = new Set(['node_modules', '.git', '.DS_Store'])

async function listAllFilesRecursive(dirPath: string): Promise<SimpleFile[]> {
  const results: SimpleFile[] = []
  const entries = await readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith('.') || IGNORED_DIRS.has(entry.name)) continue
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
    if (entry.name === '.DS_Store') continue

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

export function registerFsHandlers(): void {
  ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
    return readDirShallow(dirPath)
  })

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    return readFile(filePath, 'utf-8')
  })

  ipcMain.handle('fs:readBookmark', async (_event, filePath: string) => {
    const content = await readFile(filePath, 'utf-8')
    const bookmark: BookmarkFile = JSON.parse(content)
    if (bookmark.type !== 'bookmark' || !bookmark.url || !bookmark.label) {
      throw new Error('Invalid bookmark file')
    }
    return bookmark
  })

  ipcMain.handle('fs:createFile', async (_event, dirPath: string, name: string, content?: string) => {
    const filePath = join(dirPath, name)
    await writeFile(filePath, content || '', 'utf-8')
    return filePath
  })

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    await writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('fs:createDir', async (_event, dirPath: string, name: string) => {
    const fullPath = join(dirPath, name)
    await mkdir(fullPath, { recursive: true })
    return fullPath
  })

  ipcMain.handle('fs:rename', async (_event, oldPath: string, newPath: string) => {
    await rename(oldPath, newPath)
  })

  ipcMain.handle('fs:trash', async (_event, filePath: string) => {
    await shell.trashItem(filePath)
  })

  ipcMain.handle('fs:move', async (_event, srcPath: string, destPath: string) => {
    const fileName = basename(srcPath)
    const newPath = join(destPath, fileName)
    await rename(srcPath, newPath)
  })

  ipcMain.on('fs:revealInFinder', (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  ipcMain.on('fs:copyPath', (_event, filePath: string) => {
    clipboard.writeText(filePath)
  })

  ipcMain.on('fs:openInDefaultApp', (_event, filePath: string) => {
    shell.openPath(filePath)
  })

  ipcMain.handle('fs:listAllFiles', async (_event, rootPath: string) => {
    return listAllFilesRecursive(rootPath)
  })

  ipcMain.handle('fs:fetchPageTitle', async (_event, url: string) => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      clearTimeout(timeout)
      const html = await res.text()
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      return match ? match[1].trim() : null
    } catch {
      return null
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
}
