import { useCallback, useState } from 'react'
import { Tab } from './Tab'
import { useTabStore } from '../../stores/tab-store'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, reorderTabs } = useTabStore()
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleClose = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation()
      closeTab(tabId)
    },
    [closeTab]
  )

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
    </div>
  )
}
