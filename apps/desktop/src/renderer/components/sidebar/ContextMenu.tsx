import type { FileNode } from '../../../shared/types'
import { dirname } from '../../lib/file-utils'

export interface ContextMenuAction {
  label: string
  action: () => Promise<void> | void
  separator?: boolean
}

export function getContextMenuActions(
  node: FileNode,
  callbacks: {
    onRefresh: () => void
    onCreateFile: (folderPath: string) => void
    onCreateFolder: (folderPath: string) => void
    onCreateBookmark: (folderPath: string) => void
    onRename: (node: FileNode) => void
  }
): ContextMenuAction[] {
  const parentDir = node.type === 'directory' ? node.path : dirname(node.path)

  return [
    {
      label: 'New File',
      action: () => {
        const target = node.type === 'directory' ? node.path : parentDir
        callbacks.onCreateFile(target)
      }
    },
    {
      label: 'New Bookmark',
      action: () => {
        const target = node.type === 'directory' ? node.path : parentDir
        callbacks.onCreateBookmark(target)
      }
    },
    {
      label: 'New Folder',
      action: () => {
        const target = node.type === 'directory' ? node.path : parentDir
        callbacks.onCreateFolder(target)
      }
    },
    {
      label: 'Rename',
      action: () => {
        callbacks.onRename(node)
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
