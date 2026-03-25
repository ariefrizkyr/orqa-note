import { useCallback, useEffect, useState } from 'react'
import { FileTreeNode } from './FileTreeNode'
import { InlineFileInput } from './InlineFileInput'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { useTabStore } from '../../stores/tab-store'
import { getFileIcon, extname as getExt, dirname } from '../../lib/file-utils'
import { createEmptyXlsxBytes } from '@orqa-note/spreadsheet'
import type { FileNode, BookmarkFile } from '../../../shared/types'

let toggleGeneration = 0

export interface InlineCreateState {
  path: string
  type: 'file' | 'folder'
  defaultValue?: string
}

interface FileTreeProps {
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void
  onEmptySpaceContextMenu: (e: React.MouseEvent) => void
  inlineCreate: InlineCreateState | null
  onCancelInlineCreate: () => void
  renamingPath: string | null
  onRenameSubmit: (node: FileNode, newName: string) => void
  onRenameCancel: () => void
  workspacePath: string
}

export function FileTree({ onContextMenu, onEmptySpaceContextMenu, inlineCreate, onCancelInlineCreate, renamingPath, onRenameSubmit, onRenameCancel, workspacePath }: FileTreeProps) {
  const { rootNodes, expandedPaths, toggleExpanded, updateNodeChildren } =
    useWorkspaceStore()
  const openTab = useTabStore((s) => s.openTab)
  const [bookmarkCache, setBookmarkCache] = useState<Record<string, BookmarkFile>>({})
  const [invalidBookmarks, setInvalidBookmarks] = useState<Set<string>>(new Set())
  const [draggedNode, setDraggedNode] = useState<FileNode | null>(null)
  const [isDragOverRoot, setIsDragOverRoot] = useState(false)

  // Load bookmark metadata for .orqlnk files
  useEffect(() => {
    const orqlnkFiles = flattenNodes(rootNodes).filter((n) => n.extension === 'orqlnk')
    for (const file of orqlnkFiles) {
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
        const myGeneration = ++toggleGeneration

        // Collect expanded descendants to reload in parallel
        const prefix = path + '/'
        const descendants = [...expandedPaths].filter((p) => p.startsWith(prefix))
        const pathsToLoad = [path, ...descendants]

        const results = await Promise.all(
          pathsToLoad.map(async (p) => ({
            path: p,
            children: await window.electronAPI.fs.readDir(p)
          }))
        )

        // Discard if another toggle happened while loading
        if (myGeneration !== toggleGeneration) return

        // Apply top-down so parent nodes exist before children are updated
        results.sort((a, b) => a.path.split('/').length - b.path.split('/').length)
        for (const { path: p, children } of results) {
          updateNodeChildren(p, children)
        }
      }
    },
    [expandedPaths, toggleExpanded, updateNodeChildren]
  )

  const handleFileClick = useCallback(
    async (node: FileNode) => {
      if (node.extension === 'orqlnk') {
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

  // Container-level drop handler for drag-to-root
  const handleContainerDragOver = useCallback(
    (e: React.DragEvent) => {
      if (draggedNode) {
        e.preventDefault()
        setIsDragOverRoot(true)
      }
    },
    [draggedNode]
  )

  const handleContainerDragLeave = useCallback((e: React.DragEvent) => {
    const container = e.currentTarget as HTMLElement
    if (!container.contains(e.relatedTarget as Node)) {
      setIsDragOverRoot(false)
    }
  }, [])

  const handleContainerDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOverRoot(false)
      if (!draggedNode) return

      // No-op if already at root
      if (dirname(draggedNode.path) === workspacePath) {
        setDraggedNode(null)
        return
      }

      try {
        await window.electronAPI.fs.move(draggedNode.path, workspacePath)
      } catch (err) {
        console.error('Move to root failed:', err)
      }
      setDraggedNode(null)
    },
    [draggedNode, workspacePath]
  )

  // Empty-space context menu handler — only fires when clicking the container itself
  const handleContainerContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // Only trigger if the click target is the container div itself
      if (e.target === e.currentTarget) {
        onEmptySpaceContextMenu(e)
      }
    },
    [onEmptySpaceContextMenu]
  )

  const handleInlineCreateSubmit = useCallback(
    async (name: string) => {
      if (!inlineCreate) return
      const { path: folderPath, type: createType } = inlineCreate
      try {
        if (createType === 'folder') {
          await window.electronAPI.fs.createDir(folderPath, name)
        } else {
          const ext = getExt(name)
          if (ext === 'xlsx') {
            const xlsxBytes = await createEmptyXlsxBytes()
            await window.electronAPI.fs.writeBinaryFile(`${folderPath}/${name}`, xlsxBytes)
          } else {
            await window.electronAPI.fs.createFile(folderPath, name)
          }
        }
        // Refresh the folder children
        if (folderPath === workspacePath) {
          const nodes = await window.electronAPI.fs.readDir(workspacePath)
          useWorkspaceStore.getState().setRootNodes(nodes)
        } else {
          const children = await window.electronAPI.fs.readDir(folderPath)
          updateNodeChildren(folderPath, children)
        }
        // Open the new file as a tab (only for files)
        if (createType === 'file') {
          const ext = getExt(name)
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
    [inlineCreate, updateNodeChildren, openTab, onCancelInlineCreate, workspacePath]
  )

  const isRootInlineCreate = inlineCreate?.path === workspacePath

  return (
    <div
      className={`flex-1 overflow-y-auto py-1 ${isDragOverRoot ? 'bg-neutral-800/50' : ''}`}
      onContextMenu={handleContainerContextMenu}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
    >
      {renderNodes(rootNodes, 0, expandedPaths, handleToggle, handleFileClick, onContextMenu, handleDragStart, handleDrop, bookmarkCache, invalidBookmarks, inlineCreate, handleInlineCreateSubmit, onCancelInlineCreate, renamingPath, onRenameSubmit, onRenameCancel, workspacePath)}
      {isRootInlineCreate && (
        <InlineFileInput
          depth={0}
          type={inlineCreate.type}
          defaultValue={inlineCreate.defaultValue}
          onSubmit={handleInlineCreateSubmit}
          onCancel={onCancelInlineCreate}
        />
      )}
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
  onRenameCancel: () => void,
  workspacePath: string
): React.ReactNode[] {
  return nodes.map((node) => {
    const isExpanded = expandedPaths.has(node.path)
    // Skip rendering inline input for root-level (handled in FileTree component)
    const showInlineCreate = inlineCreate?.path === node.path && node.path !== workspacePath
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
          bookmark={node.extension === 'orqlnk' ? bookmarkCache[node.path] : null}
          isInvalidBookmark={invalidBookmarks.has(node.path)}
        />
        {isExpanded && node.children && (
          renderNodes(node.children, depth + 1, expandedPaths, onToggle, onFileClick, onContextMenu, onDragStart, onDrop, bookmarkCache, invalidBookmarks, inlineCreate, onInlineCreateSubmit, onInlineCreateCancel, renamingPath, onRenameSubmit, onRenameCancel, workspacePath)
        )}
        {showInlineCreate && (
          <InlineFileInput
            depth={depth + 1}
            type={inlineCreate.type}
            defaultValue={inlineCreate.defaultValue}
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
