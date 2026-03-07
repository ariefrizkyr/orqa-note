import type { Tab as TabType } from '../../../shared/types'
import { getServiceColor, extname } from '../../lib/file-utils'

interface TabProps {
  tab: TabType
  isActive: boolean
  onClick: () => void
  onClose: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

function getTypeDotColor(tab: TabType): string {
  if (tab.type === 'bookmark') {
    return getServiceColor('other')
  }
  const ext = tab.filePath ? extname(tab.filePath) : ''
  switch (ext) {
    case 'md': return '#60A5FA'
    case 'csv': case 'xlsx': return '#34D399'
    case 'pdf': return '#F87171'
    case 'orqa': return '#FBBF24'
    default: return '#9CA3AF'
  }
}

export function Tab({
  tab,
  isActive,
  onClick,
  onClose,
  onMouseDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: TabProps) {
  return (
    <div
      data-no-drag
      className={`group flex shrink-0 cursor-pointer items-center gap-2 border-r border-neutral-700 px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-neutral-800 text-white'
          : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-300'
      }`}
      onClick={onClick}
      onMouseDown={(e) => {
        if (e.button === 1) {
          e.preventDefault()
          onClose(e)
        } else {
          onMouseDown(e)
        }
      }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: getTypeDotColor(tab) }}
      />
      <span className="max-w-[140px] truncate">{tab.label}</span>
      {tab.isDirty && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" title="Unsaved changes" />
      )}
      <button
        className="ml-1 shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-neutral-600 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          onClose(e)
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
