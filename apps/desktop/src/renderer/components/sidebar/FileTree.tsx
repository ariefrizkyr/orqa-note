import { useCallback, useEffect, useState } from 'react'
import { FileTreeNode } from './FileTreeNode'
import { InlineFileInput } from './InlineFileInput'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { useTabStore } from '../../stores/tab-store'
import { getFileIcon } from '../../lib/file-utils'
import type { FileNode, BookmarkFile } from '../../../shared/types'

export interface InlineCreateState {
  path: string
  type: 'file' | 'folder'
}

interface FileTreeProps {
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void
  inlineCreate: InlineCreateState | null
  onCancelInlineCreate: () => void
  renamingPath: string | null
  onRenameSubmit: (node: FileNode, newName: string) => void
  onRenameCancel: () => void
}

export function FileTree({ onContextMenu, inlineCreate, onCancelInlineCreate, renamingPath, onRenameSubmit, onRenameCancel }: FileTreeProps) {
  const { rootNodes, expandedPaths, toggleExpanded, updateNodeChildren } =
    useWorkspaceStore()
  const openTab = useTabStore((s) => s.openTab)
  const [bookmarkCache, setBookmarkCache] = useState<Record<string, BookmarkFile>>({})
  const [invalidBookmarks, setInvalidBookmarks] = useState<Set<string>>(new Set())
  const [draggedNode, setDraggedNode] = useState<FileNode | null>(null)

  // Load bookmark metadata for .orqa files
  useEffect(() => {
    const orqaFiles = flattenNodes(rootNodes).filter((n) => n.extension === 'orqa')
    for (const file of orqaFiles) {
      if (!bookmarkCache[file.path] && !invalidBookmarks.has(file.path)) {
        window.electronAPI.fs.readBookmark(file.path).then((bm) => {
          setBookmarkCache((prev) => ({ ...prev, [file.path]: bm }))
        }).catch(() => {
          setInvalidBookmarks((prev) => new Set(prev).add(file.path))
        })
      }
    }
  }, [rootNodes])

  const handleToggle = useCallback(
    async (path: string) => {
      const isExpanded = expandedPaths.has(path)
      toggleExpanded(path)

      if (!isExpanded) {
        const children = await window.electronAPI.fs.readDir(path)
        updateNodeChildren(path, children)
      }
    },
    [expandedPaths, toggleExpanded, updateNodeChildren]
  )

  const handleFileClick = useCallback(
    async (node: FileNode) => {
      if (node.extension === 'orqa') {
        if (invalidBookmarks.has(node.path)) {
          openTab({
            type: 'file',
            filePath: node.path,
            label: `⚠ ${node.name}`,
            icon: '⚠️'
          })
          return
        }
        try {
          const bookmark = await window.electronAPI.fs.readBookmark(node.path)
          openTab({
            type: 'bookmark',
            filePath: node.path,
            bookmarkUrl: bookmark.url,
            label: bookmark.label,
            icon: '🔗'
          })
        } catch {
          setInvalidBookmarks((prev) => new Set(prev).add(node.path))
          openTab({
            type: 'file',
            filePath: node.path,
            label: `⚠ ${node.name}`,
            icon: '⚠️'
          })
        }
      } else {
        openTab({
          type: 'file',
          filePath: node.path,
          label: node.name,
          icon: getFileIcon(node.extension)
        })
      }
    },
    [openTab]
  )

  const handleDragStart = useCallback((_e: React.DragEvent, node: FileNode) => {
    setDraggedNode(node)
  }, [])

  const handleDrop = useCallback(
    async (_e: React.DragEvent, target: FileNode) => {
      if (!draggedNode || target.path === draggedNode.path) return
      // Prevent dropping into own descendant
      if (target.path.startsWith(draggedNode.path + '/')) return

      try {
        await window.electronAPI.fs.move(draggedNode.path, target.path)
        // FS watcher will handle tree update
      } catch (err) {
        console.error('Move failed:', err)
      }
      setDraggedNode(null)
    },
    [draggedNode]
  )

  const handleInlineCreateSubmit = useCallback(
    async (name: string) => {
      if (!inlineCreate) return
      const { path: folderPath, type: createType } = inlineCreate
      try {
        if (createType === 'folder') {
          await window.electronAPI.fs.createDir(folderPath, name)
        } else {
          await window.electronAPI.fs.createFile(folderPath, name)
        }
        // Refresh the folder children
        const children = await window.electronAPI.fs.readDir(folderPath)
        updateNodeChildren(folderPath, children)
        // Open the new file as a tab (only for files)
        if (createType === 'file') {
          const ext = name.includes('.') ? name.split('.').pop() || '' : ''
          openTab({
            type: 'file',
            filePath: `${folderPath}/${name}`,
            label: name,
            icon: getFileIcon(ext)
          })
        }
      } catch (err) {
        console.error(`Create ${createType} failed:`, err)
      }
      onCancelInlineCreate()
    },
    [inlineCreate, updateNodeChildren, openTab, onCancelInlineCreate]
  )

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {renderNodes(rootNodes, 0, expandedPaths, handleToggle, handleFileClick, onContextMenu, handleDragStart, handleDrop, bookmarkCache, invalidBookmarks, inlineCreate, handleInlineCreateSubmit, onCancelInlineCreate, renamingPath, onRenameSubmit, onRenameCancel)}
    </div>
  )
}

function renderNodes(
  nodes: FileNode[],
  depth: number,
  expandedPaths: Set<string>,
  onToggle: (path: string) => void,
  onFileClick: (node: FileNode) => void,
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void,
  onDragStart: (e: React.DragEvent, node: FileNode) => void,
  onDrop: (e: React.DragEvent, target: FileNode) => void,
  bookmarkCache: Record<string, BookmarkFile>,
  invalidBookmarks: Set<string>,
  inlineCreate: InlineCreateState | null,
  onInlineCreateSubmit: (name: string) => void,
  onInlineCreateCancel: () => void,
  renamingPath: string | null,
  onRenameSubmit: (node: FileNode, newName: string) => void,
  onRenameCancel: () => void
): React.ReactNode[] {
  return nodes.map((node) => {
    const isExpanded = expandedPaths.has(node.path)
    return (
      <div key={node.path}>
        <FileTreeNode
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          isRenaming={renamingPath === node.path}
          onToggle={onToggle}
          onFileClick={onFileClick}
          onContextMenu={onContextMenu}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onRenameSubmit={onRenameSubmit}
          onRenameCancel={onRenameCancel}
          bookmark={node.extension === 'orqa' ? bookmarkCache[node.path] : null}
          isInvalidBookmark={invalidBookmarks.has(node.path)}
        />
        {isExpanded && node.children && (
          renderNodes(node.children, depth + 1, expandedPaths, onToggle, onFileClick, onContextMenu, onDragStart, onDrop, bookmarkCache, invalidBookmarks, inlineCreate, onInlineCreateSubmit, onInlineCreateCancel, renamingPath, onRenameSubmit, onRenameCancel)
        )}
        {inlineCreate?.path === node.path && (
          <InlineFileInput
            depth={depth + 1}
            type={inlineCreate.type}
            onSubmit={onInlineCreateSubmit}
            onCancel={onInlineCreateCancel}
          />
        )}
      </div>
    )
  })
}

function flattenNodes(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children) {
      result.push(...flattenNodes(node.children))
    }
  }
  return result
}
