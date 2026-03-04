import { useCallback, useState } from 'react'
import { Tab } from './Tab'
import { useTabStore } from '../../stores/tab-store'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, reorderTabs, openTab } = useTabStore()
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleClose = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation()
      closeTab(tabId)
    },
    [closeTab]
  )

  const handleNewTab = useCallback(() => {
    openTab({
      type: 'new-tab',
      label: 'New Tab',
      icon: '+'
    })
  }, [openTab])

  return (
    <div
      data-drag
      className="flex h-[40px] shrink-0 items-stretch border-b border-neutral-700 bg-neutral-900"
    >
      <div data-no-drag className="flex flex-1 items-stretch overflow-x-auto">
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onClick={() => setActiveTab(tab.id)}
            onClose={(e) => handleClose(e, tab.id)}
            onMouseDown={() => {}}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null && dragIndex !== index) {
                reorderTabs(dragIndex, index)
              }
              setDragIndex(null)
            }}
          />
        ))}
      </div>
      <button
        onClick={handleNewTab}
        className="flex shrink-0 items-center px-3 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
        title="New Tab"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
