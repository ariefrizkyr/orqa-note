interface TerminalTab {
  id: string
  sessionId: string
  title: string
}

interface TerminalTabBarProps {
  tabs: TerminalTab[]
  activeTabId: string | null
  onSelect: (tabId: string) => void
  onClose: (tabId: string) => void
  onCreate: () => void
}

export function TerminalTabBar({ tabs, activeTabId, onSelect, onClose, onCreate }: TerminalTabBarProps) {
  return (
    <div className="flex h-[40px] shrink-0 items-center border-b border-neutral-700 bg-neutral-900">
      <div className="flex flex-1 items-center overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex h-[40px] cursor-pointer items-center gap-1.5 border-r border-neutral-700 px-3 text-xs ${
              tab.id === activeTabId
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            onClick={() => onSelect(tab.id)}
          >
            <span className="truncate">{tab.title}</span>
            <button
              className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-neutral-600 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onClose(tab.id)
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        className="flex h-[40px] w-[32px] shrink-0 items-center justify-center text-neutral-400 hover:text-white"
        onClick={onCreate}
        title="New Terminal"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}

export type { TerminalTab }
