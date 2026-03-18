import type { FileNode } from '../../../shared/types'
import { dirname } from '../../lib/file-utils'

export interface ContextMenuAction {
  label: string
  action: () => Promise<void> | void
  separator?: boolean
}

export interface ClipboardState {
  sourcePath: string
  operation: 'copy' | 'cut'
}

interface ContextMenuCallbacks {
  onRefresh: () => void
  onCreateFile: (folderPath: string) => void
  onCreateFolder: (folderPath: string) => void
  onCreateBookmark: (folderPath: string) => void
  onCreateSpreadsheet: (folderPath: string) => void
  onCreateCanvas: (folderPath: string) => void
  onRename: (node: FileNode) => void
  onCopy: (node: FileNode) => void
  onCut: (node: FileNode) => void
  onPaste: (targetDir: string) => void
  onCollapseAll: () => void
  clipboard: ClipboardState | null
  workspacePath: string
}

export function getContextMenuActions(
  node: FileNode | null,
  callbacks: ContextMenuCallbacks
): ContextMenuAction[] {
  // Empty-space menu (no node) — targets workspace root
  if (!node) {
    const actions: ContextMenuAction[] = [
      {
        label: 'New File',
        action: () => callbacks.onCreateFile(callbacks.workspacePath)
      },
      {
        label: 'New Spreadsheet',
        action: () => callbacks.onCreateSpreadsheet(callbacks.workspacePath)
      },
      {
        label: 'New Canvas',
        action: () => callbacks.onCreateCanvas(callbacks.workspacePath)
      },
      {
        label: 'New Bookmark',
        action: () => callbacks.onCreateBookmark(callbacks.workspacePath)
      },
      {
        label: 'New Folder',
        action: () => callbacks.onCreateFolder(callbacks.workspacePath)
      }
    ]

    if (callbacks.clipboard) {
      actions.push({
        label: 'Paste',
        action: () => callbacks.onPaste(callbacks.workspacePath),
        separator: true
      })
    }

    actions.push({
      label: 'Refresh',
      action: () => callbacks.onRefresh(),
      separator: !callbacks.clipboard
    })

    actions.push({
      label: 'Collapse All',
      action: () => callbacks.onCollapseAll()
    })

    actions.push({
      label: 'Reveal in Finder',
      action: () => {
        window.electronAPI.fs.revealInFinder(callbacks.workspacePath)
      },
      separator: true
    })

    return actions
  }

  // Node-specific menu
  const targetDir = node.type === 'directory' ? node.path : dirname(node.path)

  const actions: ContextMenuAction[] = [
    {
      label: 'New File',
      action: () => callbacks.onCreateFile(targetDir)
    },
    {
      label: 'New Spreadsheet',
      action: () => callbacks.onCreateSpreadsheet(targetDir)
    },
    {
      label: 'New Canvas',
      action: () => callbacks.onCreateCanvas(targetDir)
    },
    {
      label: 'New Bookmark',
      action: () => callbacks.onCreateBookmark(targetDir)
    },
    {
      label: 'New Folder',
      action: () => callbacks.onCreateFolder(targetDir)
    },
    {
      label: 'Copy',
      action: () => callbacks.onCopy(node),
      separator: true
    },
    {
      label: 'Cut',
      action: () => callbacks.onCut(node)
    }
  ]

  if (callbacks.clipboard) {
    actions.push({
      label: 'Paste',
      action: () => callbacks.onPaste(targetDir)
    })
  }

  actions.push({
    label: 'Rename',
    action: () => callbacks.onRename(node),
    separator: true
  })

  actions.push({
    label: 'Delete',
    action: async () => {
      const confirmed = window.confirm(`Move "${node.name}" to Trash?`)
      if (!confirmed) return
      await window.electronAPI.fs.trash(node.path)
      callbacks.onRefresh()
    }
  })

  actions.push({
    label: 'Reveal in Finder',
    action: () => {
      window.electronAPI.fs.revealInFinder(node.path)
    },
    separator: true
  })

  const isBookmark = node.extension === 'orqlnk'
  actions.push({
    label: isBookmark ? 'Copy URL' : 'Copy Path',
    action: async () => {
      if (isBookmark) {
        try {
          const bookmark = await window.electronAPI.fs.readBookmark(node.path)
          navigator.clipboard.writeText(bookmark.url)
        } catch {
          navigator.clipboard.writeText(node.path)
        }
      } else {
        window.electronAPI.fs.copyPath(node.path)
      }
    }
  })

  return actions
}
