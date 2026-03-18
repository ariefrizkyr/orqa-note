import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react'
import { WorkspaceHeader } from './WorkspaceHeader'
import { FileTree } from './FileTree'
import type { InlineCreateState } from './FileTree'
import { BookmarkFormModal } from './BookmarkFormModal'
import { getContextMenuActions } from './ContextMenu'
import type { ClipboardState } from './ContextMenu'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { useTabStore } from '../../stores/tab-store'
import { useUIStore } from '../../stores/ui-store'
import { dirname, slugify, createBookmarkContent } from '../../lib/file-utils'
import type { FileNode } from '../../../shared/types'

export function Sidebar() {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const openTab = useTabStore((s) => s.openTab)
  const sidebarWidth = useUIStore((s) => s.sidebarWidth)
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth)
  const setResizingSidebar = useUIStore((s) => s.setResizingSidebar)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    node: FileNode | null
  } | null>(null)

  const [inlineCreate, setInlineCreate] = useState<InlineCreateState | null>(null)
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  // Resize handling
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!resizeRef.current) return
      const diff = e.clientX - resizeRef.current.startX
      setSidebarWidth(resizeRef.current.startWidth + diff)
    }

    function handleMouseUp() {
      resizeRef.current = null
      setResizingSidebar(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [setSidebarWidth, setResizingSidebar])

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth }
      setResizingSidebar(true)
    },
    [sidebarWidth, setResizingSidebar]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }, [])

  const handleEmptySpaceContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, node: null })
  }, [])

  const handleRefresh = useCallback(async () => {
    if (!workspacePath) return
    const nodes = await window.electronAPI.fs.readDir(workspacePath)
    useWorkspaceStore.getState().setRootNodes(nodes)
  }, [workspacePath])

  const expandFolder = useCallback(async (folderPath: string) => {
    const store = useWorkspaceStore.getState()
    if (!store.expandedPaths.has(folderPath)) {
      store.toggleExpanded(folderPath)
      const children = await window.electronAPI.fs.readDir(folderPath)
      store.updateNodeChildren(folderPath, children)
    }
  }, [])

  const handleStartCreateFile = useCallback(
    async (folderPath: string) => {
      if (folderPath !== workspacePath) {
        await expandFolder(folderPath)
      }
      setInlineCreate({ path: folderPath, type: 'file' })
    },
    [expandFolder, workspacePath]
  )

  const handleStartCreateFolder = useCallback(
    async (folderPath: string) => {
      if (folderPath !== workspacePath) {
        await expandFolder(folderPath)
      }
      setInlineCreate({ path: folderPath, type: 'folder' })
    },
    [expandFolder, workspacePath]
  )

  const handleCancelInlineCreate = useCallback(() => {
    setInlineCreate(null)
  }, [])

  const [renamingPath, setRenamingPath] = useState<string | null>(null)

  const handleStartRename = useCallback((node: FileNode) => {
    setRenamingPath(node.path)
  }, [])

  const handleRenameSubmit = useCallback(
    async (node: FileNode, newName: string) => {
      const parentDir = dirname(node.path)
      const newPath = parentDir + '/' + newName
      try {
        await window.electronAPI.fs.rename(node.path, newPath)
      } catch (err) {
        console.error('Rename failed:', err)
      }
      setRenamingPath(null)
    },
    []
  )

  const handleRenameCancel = useCallback(() => {
    setRenamingPath(null)
  }, [])

  const handleStartCreateSpreadsheet = useCallback(
    async (folderPath: string) => {
      if (folderPath !== workspacePath) {
        await expandFolder(folderPath)
      }
      setInlineCreate({ path: folderPath, type: 'file', defaultValue: 'Untitled.xlsx' })
    },
    [expandFolder, workspacePath]
  )

  const handleStartCreateCanvas = useCallback(
    async (folderPath: string) => {
      if (folderPath !== workspacePath) {
        await expandFolder(folderPath)
      }
      setInlineCreate({ path: folderPath, type: 'file', defaultValue: 'Untitled.excalidraw' })
    },
    [expandFolder, workspacePath]
  )

  const [bookmarkFolderPath, setBookmarkFolderPath] = useState<string | null>(null)

  const handleStartCreateBookmark = useCallback((folderPath: string) => {
    setBookmarkFolderPath(folderPath)
  }, [])

  const handleBookmarkSubmit = useCallback(
    async (data: { url: string; label: string; service: string }) => {
      if (!bookmarkFolderPath) return
      const slug = slugify(data.label)
      const content = createBookmarkContent(data.url, data.label, data.service)
      const filePath = await window.electronAPI.fs.createFile(bookmarkFolderPath, `${slug}.orqlnk`, content)
      // Refresh folder children
      if (bookmarkFolderPath === workspacePath) {
        const nodes = await window.electronAPI.fs.readDir(workspacePath)
        useWorkspaceStore.getState().setRootNodes(nodes)
      } else {
        const children = await window.electronAPI.fs.readDir(bookmarkFolderPath)
        useWorkspaceStore.getState().updateNodeChildren(bookmarkFolderPath, children)
      }
      openTab({
        type: 'bookmark',
        filePath,
        bookmarkUrl: data.url,
        label: data.label,
        icon: '🔗'
      })
      setBookmarkFolderPath(null)
    },
    [bookmarkFolderPath, openTab]
  )

  const handleCancelBookmark = useCallback(() => {
    setBookmarkFolderPath(null)
  }, [])

  // Clipboard callbacks
  const handleCopy = useCallback((node: FileNode) => {
    setClipboard({ sourcePath: node.path, operation: 'copy' })
  }, [])

  const handleCut = useCallback((node: FileNode) => {
    setClipboard({ sourcePath: node.path, operation: 'cut' })
  }, [])

  const handlePaste = useCallback(
    async (targetDir: string) => {
      if (!clipboard) return
      try {
        if (clipboard.operation === 'copy') {
          await window.electronAPI.fs.copy(clipboard.sourcePath, targetDir)
        } else {
          await window.electronAPI.fs.move(clipboard.sourcePath, targetDir)
          setClipboard(null)
        }
        // Refresh tree so the pasted item appears immediately
        if (targetDir === workspacePath) {
          const nodes = await window.electronAPI.fs.readDir(workspacePath)
          useWorkspaceStore.getState().setRootNodes(nodes)
        } else {
          const children = await window.electronAPI.fs.readDir(targetDir)
          useWorkspaceStore.getState().updateNodeChildren(targetDir, children)
        }
      } catch (err) {
        console.error('Paste failed:', err)
      }
    },
    [clipboard, workspacePath]
  )

  const handleCollapseAll = useCallback(() => {
    useWorkspaceStore.getState().collapseAll()
  }, [])

  // Clamp context menu position to stay within viewport
  useLayoutEffect(() => {
    if (!contextMenu) return
    const el = contextMenuRef.current
    if (!el) {
      setMenuPos({ x: contextMenu.x, y: contextMenu.y })
      return
    }
    const rect = el.getBoundingClientRect()
    const x = contextMenu.x + rect.width > window.innerWidth
      ? window.innerWidth - rect.width - 4
      : contextMenu.x
    const y = contextMenu.y + rect.height > window.innerHeight
      ? window.innerHeight - rect.height - 4
      : contextMenu.y
    setMenuPos({ x: Math.max(0, x), y: Math.max(0, y) })
  }, [contextMenu])

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [contextMenu])

  if (!workspacePath) return null

  return (
    <>
      <div
        className="flex h-full flex-col border-r border-neutral-700 bg-neutral-900"
        style={{ width: sidebarWidth }}
      >
        <WorkspaceHeader workspacePath={workspacePath} />
        <FileTree
          onContextMenu={handleContextMenu}
          onEmptySpaceContextMenu={handleEmptySpaceContextMenu}
          inlineCreate={inlineCreate}
          onCancelInlineCreate={handleCancelInlineCreate}
          renamingPath={renamingPath}
          onRenameSubmit={handleRenameSubmit}
          onRenameCancel={handleRenameCancel}
          workspacePath={workspacePath}
        />
      </div>

      {/* Resize handle */}
      <div
        className="absolute top-0 z-10 h-full w-1 cursor-col-resize hover:bg-blue-500/50"
        style={{ left: sidebarWidth - 2 }}
        onMouseDown={handleResizeStart}
      />

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[180px] rounded-md border border-neutral-600 bg-neutral-800 py-1 shadow-xl"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          {getContextMenuActions(contextMenu.node, {
            onRefresh: handleRefresh,
            onCreateFile: handleStartCreateFile,
            onCreateFolder: handleStartCreateFolder,
            onCreateBookmark: handleStartCreateBookmark,
            onCreateSpreadsheet: handleStartCreateSpreadsheet,
            onCreateCanvas: handleStartCreateCanvas,
            onRename: handleStartRename,
            onCopy: handleCopy,
            onCut: handleCut,
            onPaste: handlePaste,
            onCollapseAll: handleCollapseAll,
            clipboard,
            workspacePath
          }).map(
            (action, i) => (
              <div key={action.label}>
                {action.separator && i > 0 && (
                  <div className="my-1 border-t border-neutral-700" />
                )}
                <button
                  className="w-full px-3 py-1.5 text-left text-sm text-neutral-300 hover:bg-neutral-700"
                  onClick={() => {
                    action.action()
                    setContextMenu(null)
                  }}
                >
                  {action.label}
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* Bookmark form modal */}
      {bookmarkFolderPath && (
        <BookmarkFormModal
          onSubmit={handleBookmarkSubmit}
          onCancel={handleCancelBookmark}
        />
      )}
    </>
  )
}
