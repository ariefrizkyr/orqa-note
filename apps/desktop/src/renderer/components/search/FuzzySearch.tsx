import { useCallback, useEffect, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import { useUIStore } from '../../stores/ui-store'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { useTabStore } from '../../stores/tab-store'
import { getFileIcon } from '../../lib/file-utils'

interface SearchResult {
  name: string
  path: string
  extension: string
}

export function FuzzySearch() {
  const isOpen = useUIStore((s) => s.isSearchOpen)
  const setSearchOpen = useUIStore((s) => s.setSearchOpen)
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const openTab = useTabStore((s) => s.openTab)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const fuseRef = useRef<Fuse<SearchResult> | null>(null)

  // Build full workspace file index when search opens
  useEffect(() => {
    if (isOpen && workspacePath) {
      inputRef.current?.focus()
      setQuery('')
      setResults([])
      setSelectedIndex(0)

      window.electronAPI.fs.listAllFiles(workspacePath).then((files) => {
        fuseRef.current = new Fuse(files, {
          keys: ['name'],
          threshold: 0.4
        })
      })
    }
  }, [isOpen, workspacePath])

  useEffect(() => {
    if (query.trim() && fuseRef.current) {
      const matched = fuseRef.current.search(query, { limit: 10 })
      setResults(matched.map((m) => m.item))
      setSelectedIndex(0)
    } else {
      setResults([])
    }
  }, [query])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      openTab({
        type: 'file',
        filePath: result.path,
        label: result.name,
        icon: getFileIcon(result.extension)
      })
      setSearchOpen(false)
    },
    [openTab, setSearchOpen]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    },
    [results, selectedIndex, handleSelect, setSearchOpen]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20%]"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-[500px] rounded-lg border border-neutral-600 bg-neutral-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="w-full rounded-t-lg bg-transparent px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none"
          placeholder="Search files..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {results.length > 0 && (
          <div className="max-h-[300px] overflow-y-auto border-t border-neutral-700 py-1">
            {results.map((result, i) => (
              <button
                key={result.path}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                  i === selectedIndex
                    ? 'bg-blue-600/30 text-white'
                    : 'text-neutral-300 hover:bg-neutral-700'
                }`}
                onClick={() => handleSelect(result)}
              >
                <span>{getFileIcon(result.extension)}</span>
                <span className="truncate font-medium">{result.name}</span>
                <span className="ml-auto truncate text-xs text-neutral-500">
                  {workspacePath ? result.path.replace(workspacePath, '') : result.path}
                </span>
              </button>
            ))}
          </div>
        )}
        {query && results.length === 0 && (
          <div className="border-t border-neutral-700 px-4 py-3 text-center text-sm text-neutral-500">
            No files found
          </div>
        )}
      </div>
    </div>
  )
}
