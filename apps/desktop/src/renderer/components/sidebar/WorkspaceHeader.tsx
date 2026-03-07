import { basename } from '../../lib/file-utils'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { useUIStore } from '../../stores/ui-store'

interface WorkspaceHeaderProps {
  workspacePath: string
}

export function WorkspaceHeader({ workspacePath }: WorkspaceHeaderProps) {
  const collapseAll = useWorkspaceStore((s) => s.collapseAll)
  const toggleSearch = useUIStore((s) => s.toggleSearch)

  return (
    <div data-drag className="flex items-center justify-between border-b border-neutral-700 px-4 py-3">
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
      </div>
    </div>
  )
}
