import type { FileNode } from '../../../shared/types'
import { dirname } from '../../lib/file-utils'

export async function showContextMenu(_node: FileNode): Promise<void> {
  // Context menu actions are handled via prompts since we can't use
  // Electron Menu directly from renderer. We use simple window.prompt
  // as a v1 approach — can be replaced with a custom modal later.
  // For v1, we create a simple div-based context menu
  // The actual native context menu requires IPC to main process Menu.buildFromTemplate
  // This is handled in Sidebar.tsx via IPC
}

export interface ContextMenuAction {
  label: string
  action: () => Promise<void> | void
  separator?: boolean
}

export function getContextMenuActions(
  node: FileNode,
  callbacks: {
    onRefresh: () => void
    onCreateFile?: (folderPath: string) => void
    onCreateFolder?: (folderPath: string) => void
    onCreateBookmark?: (folderPath: string) => void
    onRename?: (node: FileNode) => void
  }
): ContextMenuAction[] {
  const parentDir = node.type === 'directory' ? node.path : dirname(node.path)

  return [
    {
      label: 'New File',
      action: async () => {
        const target = node.type === 'directory' ? node.path : parentDir
        if (callbacks.onCreateFile) {
          callbacks.onCreateFile(target)
          return
        }
        const name = window.prompt('File name:')
        if (!name) return
        await window.electronAPI.fs.createFile(target, name)
        callbacks.onRefresh()
      }
    },
    {
      label: 'New Bookmark',
      action: () => {
        const target = node.type === 'directory' ? node.path : parentDir
        if (callbacks.onCreateBookmark) {
          callbacks.onCreateBookmark(target)
        }
      }
    },
    {
      label: 'New Folder',
      action: async () => {
        const target = node.type === 'directory' ? node.path : parentDir
        if (callbacks.onCreateFolder) {
          callbacks.onCreateFolder(target)
          return
        }
        const name = window.prompt('Folder name:')
        if (!name) return
        await window.electronAPI.fs.createDir(target, name)
        callbacks.onRefresh()
      }
    },
    {
      label: 'Rename',
      action: () => {
        if (callbacks.onRename) {
          callbacks.onRename(node)
        }
      },
      separator: true
    },
    {
      label: 'Delete',
      action: async () => {
        const confirmed = window.confirm(`Move "${node.name}" to Trash?`)
        if (!confirmed) return
        await window.electronAPI.fs.trash(node.path)
        callbacks.onRefresh()
      }
    },
    {
      label: 'Reveal in Finder',
      action: () => {
        window.electronAPI.fs.revealInFinder(node.path)
      },
      separator: true
    },
    {
      label: 'Copy Path',
      action: () => {
        window.electronAPI.fs.copyPath(node.path)
      }
    }
  ]
}
