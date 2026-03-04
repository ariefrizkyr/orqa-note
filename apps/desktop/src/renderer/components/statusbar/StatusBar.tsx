import { useWorkspaceStore } from '../../stores/workspace-store'
import { useTabStore } from '../../stores/tab-store'
import { basename } from '../../lib/file-utils'

export function StatusBar() {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const tabs = useTabStore((s) => s.tabs)
  const activeTab = tabs.find((t) => t.id === activeTabId)

  const fileType = activeTab
    ? activeTab.type === 'bookmark'
      ? 'Bookmark'
      : activeTab.filePath?.split('.').pop()?.toUpperCase() || 'File'
    : null

  return (
    <div
      data-no-drag
      className="flex h-[28px] shrink-0 items-center justify-between border-t border-neutral-700 bg-neutral-900 px-4 text-[11px] text-neutral-500"
    >
      <div className="flex items-center gap-3">
        {fileType && (
          <span className="rounded bg-neutral-800 px-1.5 py-0.5">{fileType}</span>
        )}
      </div>
      <div>
        {workspacePath && (
          <span>{basename(workspacePath)}</span>
        )}
      </div>
    </div>
  )
}
