import { useState, useRef, useEffect, useCallback } from 'react'
import { useGroupStore } from '../../stores/group-store'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { useUIStore } from '../../stores/ui-store'
import { basename } from '../../lib/file-utils'

interface WorkspaceSwitcherProps {
  workspacePath: string
  onSwitchWorkspace: (path: string) => void
  onAddWorkspace: () => void
}

export function WorkspaceSwitcher({
  workspacePath,
  onSwitchWorkspace,
  onAddWorkspace
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(
    null
  )
  const [namingGroup, setNamingGroup] = useState(false)
  const [groupNameInput, setGroupNameInput] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const group = useGroupStore((s) => s.group)
  const collapseAll = useWorkspaceStore((s) => s.collapseAll)
  const toggleSearch = useUIStore((s) => s.toggleSearch)

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setNamingGroup(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [contextMenu])

  // Close dropdown on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setNamingGroup(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  // Focus name input when naming mode activates
  useEffect(() => {
    if (namingGroup && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [namingGroup])

  const handleSelect = useCallback(
    (path: string) => {
      if (path === workspacePath) {
        setIsOpen(false)
        return
      }
      setIsOpen(false)
      onSwitchWorkspace(path)
    },
    [workspacePath, onSwitchWorkspace]
  )

  const handleAdd = useCallback(() => {
    // If group has exactly 1 workspace, prompt to name the group first
    if (group && group.workspaces.length === 1) {
      setGroupNameInput(group.name)
      setNamingGroup(true)
      return
    }
    setIsOpen(false)
    onAddWorkspace()
  }, [onAddWorkspace, group])

  const handleNameSubmit = useCallback(async () => {
    const name = groupNameInput.trim()
    if (!name) return

    // Rename the group
    const updatedGroup = await window.electronAPI.workspaceGroup.rename(name)
    useGroupStore.getState().setGroup(updatedGroup)

    setNamingGroup(false)
    setIsOpen(false)
    onAddWorkspace()
  }, [groupNameInput, onAddWorkspace])

  const handleNameCancel = useCallback(() => {
    setNamingGroup(false)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent, path: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, path })
  }, [])

  const handleRemove = useCallback(
    async (path: string) => {
      setContextMenu(null)
      const updatedGroup = await window.electronAPI.workspaceGroup.removeWorkspace(path)

      // If group is now empty, reset to welcome screen
      if (updatedGroup.workspaces.length === 0) {
        useGroupStore.getState().setGroup(null)
        const { useWorkspaceStore } = await import('../../stores/workspace-store')
        const { useTabStore } = await import('../../stores/tab-store')
        useWorkspaceStore.getState().reset()
        useTabStore.getState().reset()
        return
      }

      useGroupStore.getState().setGroup(updatedGroup)

      // If we removed the active workspace, switch to the new active
      if (path === workspacePath && updatedGroup.activeWorkspace) {
        onSwitchWorkspace(updatedGroup.activeWorkspace)
      }
    },
    [workspacePath, onSwitchWorkspace]
  )

  const workspaces = group?.workspaces ?? [workspacePath]
  const showGroupName = group && group.workspaces.length > 1

  return (
    <div data-drag className="relative border-b border-neutral-700">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Dropdown trigger */}
        <button
          data-no-drag
          onClick={() => setIsOpen(!isOpen)}
          className="flex min-w-0 flex-col gap-0.5 rounded px-1 py-0.5 transition-colors hover:bg-neutral-800"
        >
          {showGroupName && (
            <span className="truncate text-[10px] font-medium uppercase tracking-wider text-neutral-500">
              {group.name}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-white">
              {basename(workspacePath)}
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`shrink-0 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {/* Action buttons */}
        <div data-no-drag className="flex items-center gap-0.5">
          <button
            onClick={toggleSearch}
            className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
            title="Search (⌘K)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            onClick={collapseAll}
            className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
            title="Collapse All Folders"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown popover */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-2 right-2 top-full z-50 rounded-md border border-neutral-600 bg-neutral-800 py-1 shadow-xl"
        >
          {/* Group naming prompt */}
          {namingGroup && (
            <>
              <div className="px-3 py-2">
                <label className="mb-1 block text-xs text-neutral-400">
                  Name this workspace group
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSubmit()
                    if (e.key === 'Escape') handleNameCancel()
                  }}
                  className="w-full rounded border border-neutral-600 bg-neutral-900 px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="e.g. Work, Personal, Client"
                />
                <div className="mt-2 flex justify-end gap-1.5">
                  <button
                    className="rounded px-2 py-0.5 text-xs text-neutral-400 hover:text-white"
                    onClick={handleNameCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-500"
                    onClick={handleNameSubmit}
                  >
                    Continue
                  </button>
                </div>
              </div>
              <div className="my-1 border-t border-neutral-700" />
            </>
          )}

          {/* Workspace list */}
          {!namingGroup && (
            <>
              {workspaces.map((ws) => (
                <button
                  key={ws}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-neutral-700 ${
                    ws === workspacePath ? 'text-white' : 'text-neutral-300'
                  }`}
                  onClick={() => handleSelect(ws)}
                  onContextMenu={(e) => handleContextMenu(e, ws)}
                >
                  <span className="truncate">{basename(ws)}</span>
                  {ws === workspacePath && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-auto shrink-0 text-blue-400"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
              <div className="my-1 border-t border-neutral-700" />
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                onClick={handleAdd}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add workspace...</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[160px] rounded-md border border-neutral-600 bg-neutral-800 py-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-3 py-1.5 text-left text-sm text-neutral-300 hover:bg-neutral-700"
            onClick={() => handleRemove(contextMenu.path)}
          >
            Remove from group
          </button>
          <button
            className="w-full px-3 py-1.5 text-left text-sm text-neutral-300 hover:bg-neutral-700"
            onClick={() => {
              window.electronAPI.fs.revealInFinder(contextMenu.path)
              setContextMenu(null)
            }}
          >
            Reveal in Finder
          </button>
        </div>
      )}
    </div>
  )
}
