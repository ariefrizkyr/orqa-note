import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  onPin: () => void
  onUnpin: () => void
  onCloseOthers: () => void
  onCloseAll: () => void
  onCloseToTheRight: () => void
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
    case 'orqlnk': return '#FBBF24'
    default: return '#9CA3AF'
  }
}

interface ContextMenuProps {
  x: number
  y: number
  tab: TabType
  onPin: () => void
  onUnpin: () => void
  onClose: (e: React.MouseEvent) => void
  onCloseOthers: () => void
  onCloseAll: () => void
  onCloseToTheRight: () => void
  onDismiss: () => void
}

function TabContextMenu({ x, y, tab, onPin, onUnpin, onClose, onCloseOthers, onCloseAll, onCloseToTheRight, onDismiss }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: x, top: y })

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const clampedLeft = Math.min(x, window.innerWidth - rect.width - 4)
      const clampedTop = Math.min(y, window.innerHeight - rect.height - 4)
      setPosition({ left: Math.max(4, clampedLeft), top: Math.max(4, clampedTop) })
    }
  }, [x, y])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('[data-tab-context-menu]')) {
        onDismiss()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onDismiss])

  const itemClass = 'w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-700 rounded-sm transition-colors'
  const disabledClass = 'w-full px-3 py-1.5 text-left text-sm text-neutral-500 cursor-not-allowed rounded-sm'

  return createPortal(
    <div
      ref={menuRef}
      data-tab-context-menu
      className="fixed z-50 min-w-[180px] rounded-md border border-neutral-700 bg-neutral-800 py-1 shadow-xl"
      style={{ left: position.left, top: position.top }}
    >
      {tab.isPinned ? (
        <button className={itemClass} onClick={() => { onUnpin(); onDismiss() }}>
          Unpin Tab
        </button>
      ) : (
        <button className={itemClass} onClick={() => { onPin(); onDismiss() }}>
          Pin Tab
        </button>
      )}
      <div className="my-1 border-t border-neutral-700" />
      {tab.isPinned ? (
        <button className={disabledClass} disabled>
          Close Tab
        </button>
      ) : (
        <button className={itemClass} onClick={(e) => { onClose(e); onDismiss() }}>
          Close Tab
        </button>
      )}
      <button className={itemClass} onClick={() => { onCloseOthers(); onDismiss() }}>
        Close Others
      </button>
      <button className={itemClass} onClick={() => { onCloseAll(); onDismiss() }}>
        Close All
      </button>
      <button className={itemClass} onClick={() => { onCloseToTheRight(); onDismiss() }}>
        Close to the Right
      </button>
    </div>,
    document.body
  )
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
  onDrop,
  onPin,
  onUnpin,
  onCloseOthers,
  onCloseAll,
  onCloseToTheRight
}: TabProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const dismissContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  return (
    <>
      <div
        data-no-drag
        className={`group flex shrink-0 cursor-pointer items-center gap-2 border-r border-neutral-700 px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-300'
        }`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseDown={(e) => {
          if (e.button === 1) {
            e.preventDefault()
            if (!tab.isPinned) onClose(e)
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
        {tab.isPinned ? (
          <span className="ml-1 shrink-0 text-neutral-500" title="Pinned">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="17" x2="12" y2="22" />
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
            </svg>
          </span>
        ) : (
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
        )}
      </div>
      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          tab={tab}
          onPin={onPin}
          onUnpin={onUnpin}
          onClose={onClose}
          onCloseOthers={onCloseOthers}
          onCloseAll={onCloseAll}
          onCloseToTheRight={onCloseToTheRight}
          onDismiss={dismissContextMenu}
        />
      )}
    </>
  )
}
