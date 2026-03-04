import { basename } from '../../lib/file-utils'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { useUIStore } from '../../stores/ui-store'

interface WorkspaceHeaderProps {
  workspacePath: string
  onOpenFolder: () => void
}

export function WorkspaceHeader({ workspacePath, onOpenFolder }: WorkspaceHeaderProps) {
  const collapseAll = useWorkspaceStore((s) => s.collapseAll)
  const toggleSearch = useUIStore((s) => s.toggleSearch)

  return (
    <div data-drag className="flex items-center justify-between border-b border-neutral-700 px-4 py-3 pt-11">
      <span className="truncate text-sm font-semibold text-white">
        {basename(workspacePath)}
      </span>
      <div data-no-drag className="flex items-center gap-0.5">
        <button
          onClick={toggleSearch}
          className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
          title="Search (⌘K)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button
          onClick={collapseAll}
          className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
          title="Collapse All Folders"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
        <button
          onClick={onOpenFolder}
          className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
          title="Open Folder (⌘O)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
