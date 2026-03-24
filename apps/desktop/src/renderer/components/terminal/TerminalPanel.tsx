import { useEffect, useCallback, useRef } from 'react'
import { TerminalTabBar } from './TerminalTabBar'
import type { TerminalTab } from './TerminalTabBar'
import { TerminalInstance } from './TerminalInstance'
import { useUIStore } from '../../stores/ui-store'
import { useTerminalTabs } from './use-terminal-tabs'

export { TerminalTabBar }
export type { TerminalTab }
export { useTerminalTabs }

interface TerminalContentProps {
  visible: boolean
  tabs: TerminalTab[]
  activeTabId: string | null
}

export function TerminalContent({ visible, tabs, activeTabId }: TerminalContentProps) {
  const terminalWidth = useUIStore((s) => s.terminalWidth)
  const setTerminalWidth = useUIStore((s) => s.setTerminalWidth)
  const setResizingTerminal = useUIStore((s) => s.setResizingTerminal)
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  // Resize handle
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!resizeRef.current) return
      const diff = resizeRef.current.startX - e.clientX
      setTerminalWidth(resizeRef.current.startWidth + diff)
      window.dispatchEvent(new Event('terminal:fit'))
    }

    function handleMouseUp() {
      if (resizeRef.current) {
        resizeRef.current = null
        setResizingTerminal(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [setTerminalWidth, setResizingTerminal])

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      resizeRef.current = { startX: e.clientX, startWidth: terminalWidth }
      setResizingTerminal(true)
    },
    [terminalWidth, setResizingTerminal]
  )

  return (
    <>
      {/* Resize handle */}
      <div
        className="w-1 shrink-0 cursor-col-resize hover:bg-blue-500/50"
        style={{ display: visible ? 'block' : 'none' }}
        onMouseDown={handleResizeStart}
      />
      {/* Terminal content */}
      <div
        className="relative shrink-0 overflow-hidden border-l border-neutral-700 bg-neutral-900"
        style={{ width: terminalWidth, display: visible ? 'block' : 'none' }}
      >
        {tabs.map((tab) => (
          <TerminalInstance
            key={tab.id}
            sessionId={tab.sessionId}
            visible={tab.id === activeTabId}
          />
        ))}
        {tabs.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            No terminals open
          </div>
        )}
      </div>
    </>
  )
}
