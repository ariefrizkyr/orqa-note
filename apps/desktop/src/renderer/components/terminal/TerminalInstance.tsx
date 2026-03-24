import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface TerminalInstanceProps {
  sessionId: string
  visible: boolean
}

const THEME = {
  background: '#171717', // neutral-900
  foreground: '#e5e5e5', // neutral-200
  cursor: '#e5e5e5',
  cursorAccent: '#171717',
  selectionBackground: '#525252', // neutral-600
  black: '#171717',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#06b6d4',
  white: '#e5e5e5',
  brightBlack: '#525252',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#facc15',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#22d3ee',
  brightWhite: '#fafafa'
}

export function TerminalInstance({ sessionId, visible }: TerminalInstanceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Create terminal on mount
  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      theme: THEME,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
      allowTransparency: true,
      scrollback: 5000
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)

    // Fit after a brief delay to ensure container has dimensions
    requestAnimationFrame(() => {
      try {
        fitAddon.fit()
        const { cols, rows } = term
        window.electronAPI.terminal.resize(sessionId, cols, rows)
      } catch {
        // Container may not be visible yet
      }
    })

    // Custom key bindings
    term.attachCustomKeyEventHandler((e) => {
      if (e.type !== 'keydown') return true

      // Shift+Enter → newline without execute
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        window.electronAPI.terminal.write(sessionId, '\n')
        return false
      }

      // Cmd+Backspace → kill line (Ctrl+U)
      if (e.key === 'Backspace' && e.metaKey) {
        e.preventDefault()
        window.electronAPI.terminal.write(sessionId, '\x15')
        return false
      }

      return true
    })

    // Forward keystrokes to PTY
    term.onData((data) => {
      window.electronAPI.terminal.write(sessionId, data)
    })

    // Receive PTY output
    const removeDataListener = window.electronAPI.terminal.onData((sid, data) => {
      if (sid === sessionId) {
        term.write(data)
      }
    })

    termRef.current = term
    fitAddonRef.current = fitAddon
    cleanupRef.current = removeDataListener

    return () => {
      removeDataListener()
      term.dispose()
      termRef.current = null
      fitAddonRef.current = null
      cleanupRef.current = null
    }
  }, [sessionId])

  // Fit when visibility changes
  useEffect(() => {
    if (visible && fitAddonRef.current) {
      requestAnimationFrame(() => {
        try {
          fitAddonRef.current?.fit()
          if (termRef.current) {
            const { cols, rows } = termRef.current
            window.electronAPI.terminal.resize(sessionId, cols, rows)
          }
          termRef.current?.focus()
        } catch {
          // Ignore fit errors
        }
      })
    }
  }, [visible, sessionId])

  // Expose fit method for external resize triggers
  useEffect(() => {
    const handleResize = () => {
      if (visible && fitAddonRef.current) {
        try {
          fitAddonRef.current.fit()
          if (termRef.current) {
            const { cols, rows } = termRef.current
            window.electronAPI.terminal.resize(sessionId, cols, rows)
          }
        } catch {
          // Ignore
        }
      }
    }

    window.addEventListener('resize', handleResize)
    // Listen for custom terminal resize events (from panel resize handle)
    window.addEventListener('terminal:fit', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('terminal:fit', handleResize)
    }
  }, [visible, sessionId])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ display: visible ? 'block' : 'none' }}
    />
  )
}
