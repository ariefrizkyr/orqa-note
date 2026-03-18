import { useState, useCallback, useRef, useEffect } from 'react'
import { getFileIcon, getServiceColor, getServiceLabel } from '../../lib/file-utils'
import type { FileNode, BookmarkFile } from '../../../shared/types'

interface FileTreeNodeProps {
  node: FileNode
  depth: number
  isExpanded: boolean
  isRenaming: boolean
  onToggle: (path: string) => void
  onFileClick: (node: FileNode) => void
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void
  onDragStart: (e: React.DragEvent, node: FileNode) => void
  onDrop: (e: React.DragEvent, targetNode: FileNode) => void
  onRenameSubmit: (node: FileNode, newName: string) => void
  onRenameCancel: () => void
  bookmark?: BookmarkFile | null
  isInvalidBookmark?: boolean
}

export function FileTreeNode({
  node,
  depth,
  isExpanded,
  isRenaming,
  onToggle,
  onFileClick,
  onContextMenu,
  onDragStart,
  onDrop,
  onRenameSubmit,
  onRenameCancel,
  bookmark,
  isInvalidBookmark
}: FileTreeNodeProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) {
      const input = renameInputRef.current
      if (input) {
        input.focus()
        // Select name without extension for files
        const dotIndex = node.name.lastIndexOf('.')
        if (node.type === 'file' && dotIndex > 0) {
          input.setSelectionRange(0, dotIndex)
        } else {
          input.select()
        }
      }
    }
  }, [isRenaming, node.name, node.type])

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const newName = renameInputRef.current?.value.trim()
        if (newName && newName !== node.name) {
          onRenameSubmit(node, newName)
        } else {
          onRenameCancel()
        }
      } else if (e.key === 'Escape') {
        onRenameCancel()
      }
    },
    [node, onRenameSubmit, onRenameCancel]
  )

  const handleRenameBlur = useCallback(() => {
    const newName = renameInputRef.current?.value.trim()
    if (newName && newName !== node.name) {
      onRenameSubmit(node, newName)
    } else {
      onRenameCancel()
    }
  }, [node, onRenameSubmit, onRenameCancel])

  const handleClick = useCallback(() => {
    if (node.type === 'directory') {
      onToggle(node.path)
    } else {
      onFileClick(node)
    }
  }, [node, onToggle, onFileClick])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (node.type === 'directory') {
      e.preventDefault()
      setIsDragOver(true)
    }
  }, [node.type])

  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      setIsDragOver(false)
      if (node.type === 'directory') {
        e.stopPropagation()
        onDrop(e, node)
      }
    },
    [node, onDrop]
  )

  return (
    <div
      className={`flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-sm transition-colors hover:bg-neutral-800 ${
        isDragOver ? 'bg-neutral-700' : ''
      }`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, node)}
      draggable
      onDragStart={(e) => onDragStart(e, node)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {node.type === 'directory' ? (
        <span className="w-4 text-center text-[10px] text-neutral-500">
          {isExpanded ? '▼' : '▶'}
        </span>
      ) : (
        <span className="w-4 text-center text-xs">{getFileIcon(node.extension)}</span>
      )}

      {isRenaming ? (
        <input
          ref={renameInputRef}
          type="text"
          defaultValue={node.name}
          className="flex-1 rounded border border-neutral-600 bg-neutral-800 px-1.5 py-0.5 text-sm text-neutral-300 outline-none focus:border-blue-500"
          onKeyDown={handleRenameKeyDown}
          onBlur={handleRenameBlur}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate text-neutral-300">{node.name}</span>
      )}

      {isInvalidBookmark && (
        <span className="ml-auto text-[10px] text-yellow-500" title="Invalid bookmark file">⚠</span>
      )}

      {bookmark && !isInvalidBookmark && (
        <span
          className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: getServiceColor(bookmark.service) + '22',
            color: getServiceColor(bookmark.service)
          }}
        >
          {getServiceLabel(bookmark.service)}
        </span>
      )}
    </div>
  )
}
