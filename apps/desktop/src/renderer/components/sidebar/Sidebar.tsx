import { useState, useCallback, useRef, useEffect } from 'react'
import { WorkspaceHeader } from './WorkspaceHeader'
import { FileTree } from './FileTree'
import { BookmarkFormModal } from './BookmarkFormModal'
import { getContextMenuActions } from './ContextMenu'
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
    node: FileNode
  } | null>(null)

  const [inlineCreate, setInlineCreate] = useState<{ path: string; type: 'file' | 'folder' } | null>(null)

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
      await expandFolder(folderPath)
      setInlineCreate({ path: folderPath, type: 'file' })
    },
    [expandFolder]
  )

  const handleStartCreateFolder = useCallback(
    async (folderPath: string) => {
      await expandFolder(folderPath)
      setInlineCreate({ path: folderPath, type: 'folder' })
    },
    [expandFolder]
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

  const [bookmarkFolderPath, setBookmarkFolderPath] = useState<string | null>(null)

  const handleStartCreateBookmark = useCallback((folderPath: string) => {
    setBookmarkFolderPath(folderPath)
  }, [])

  const handleBookmarkSubmit = useCallback(
    async (data: { url: string; label: string; service: string }) => {
      if (!bookmarkFolderPath) return
      const slug = slugify(data.label)
      const content = createBookmarkContent(data.url, data.label, data.service)
      const filePath = await window.electronAPI.fs.createFile(bookmarkFolderPath, `${slug}.orqa`, content)
      // Refresh folder children
      const children = await window.electronAPI.fs.readDir(bookmarkFolderPath)
      useWorkspaceStore.getState().updateNodeChildren(bookmarkFolderPath, children)
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
          inlineCreate={inlineCreate}
          onCancelInlineCreate={handleCancelInlineCreate}
          renamingPath={renamingPath}
          onRenameSubmit={handleRenameSubmit}
          onRenameCancel={handleRenameCancel}
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
          className="fixed z-50 min-w-[180px] rounded-md border border-neutral-600 bg-neutral-800 py-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {getContextMenuActions(contextMenu.node, { onRefresh: handleRefresh, onCreateFile: handleStartCreateFile, onCreateFolder: handleStartCreateFolder, onCreateBookmark: handleStartCreateBookmark, onRename: handleStartRename }).map(
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
