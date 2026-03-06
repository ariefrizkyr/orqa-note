import { useCallback, useEffect, useRef, useState } from 'react'
import { useInstance } from '@milkdown/react'
import { editorViewCtx } from '@milkdown/kit/core'
import type { EditorView } from '@milkdown/kit/prose/view'
import {
  SearchQuery,
  setSearchState,
  getSearchState,
  findNext,
  findPrev,
  replaceNext,
  replaceAll,
} from 'prosemirror-search'

export interface FindBarProps {
  visible: boolean
  initialMode: 'find' | 'replace'
  onClose: () => void
}

export function FindBar({ visible, initialMode, onClose }: FindBarProps) {
  const [loading, getInstance] = useInstance()
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [showReplace, setShowReplace] = useState(initialMode === 'replace')
  const [matchInfo, setMatchInfo] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync showReplace when mode changes
  useEffect(() => {
    if (visible) {
      setShowReplace(initialMode === 'replace')
    }
  }, [initialMode, visible])

  // Focus search input when bar opens
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [visible])

  const getView = useCallback((): EditorView | null => {
    if (loading) return null
    const editor = getInstance()
    if (!editor) return null
    return editor.ctx.get(editorViewCtx)
  }, [loading, getInstance])

  // Scroll the active match into the visible area of the scroll container
  const scrollToSelection = useCallback((view: EditorView) => {
    requestAnimationFrame(() => {
      const { from } = view.state.selection
      const coords = view.coordsAtPos(from)
      const scrollParent = view.dom.closest('.overflow-auto') ?? view.dom.parentElement
      if (!scrollParent || !coords) return
      const rect = scrollParent.getBoundingClientRect()
      if (coords.top < rect.top || coords.bottom > rect.bottom) {
        const targetY = coords.top - rect.top + scrollParent.scrollTop - rect.height / 3
        scrollParent.scrollTo({ top: targetY, behavior: 'smooth' })
      }
    })
  }, [])

  // Count matches and find which one is active
  const computeMatchInfo = useCallback((view: EditorView) => {
    const state = getSearchState(view.state)
    if (!state || !state.query.valid || !state.query.search) {
      setMatchInfo({ current: 0, total: 0 })
      return
    }
    let total = 0
    let current = 0
    const { doc, selection } = view.state
    let result = state.query.findNext(view.state, 0)
    while (result) {
      total++
      if (result.from === selection.from && result.to === selection.to) {
        current = total
      }
      const nextFrom = result.from + 1
      if (nextFrom > doc.content.size) break
      result = state.query.findNext(view.state, nextFrom)
    }
    setMatchInfo({ current: current || (total > 0 ? 1 : 0), total })
  }, [])

  // Update the search query in ProseMirror and navigate to the first match
  const updateSearch = useCallback((search: string, cs: boolean, re: boolean, replace: string) => {
    const view = getView()
    if (!view) return

    const query = new SearchQuery({
      search,
      caseSensitive: cs,
      regexp: re,
      replace,
    })
    const tr = setSearchState(view.state.tr, query)
    view.dispatch(tr)

    // Navigate to the first match so it scrolls into view
    if (search && query.valid) {
      findNext(view.state, view.dispatch, view)
      scrollToSelection(view)
    }

    requestAnimationFrame(() => computeMatchInfo(view))
  }, [getView, scrollToSelection, computeMatchInfo])

  // Update search whenever inputs change
  useEffect(() => {
    if (!visible) return
    updateSearch(searchText, caseSensitive, useRegex, replaceText)
  }, [searchText, caseSensitive, useRegex, replaceText, visible, updateSearch])

  const handleFindNext = useCallback(() => {
    const view = getView()
    if (!view) return
    findNext(view.state, view.dispatch, view)
    scrollToSelection(view)
    requestAnimationFrame(() => computeMatchInfo(view))
  }, [getView, scrollToSelection, computeMatchInfo])

  const handleFindPrev = useCallback(() => {
    const view = getView()
    if (!view) return
    findPrev(view.state, view.dispatch, view)
    scrollToSelection(view)
    requestAnimationFrame(() => computeMatchInfo(view))
  }, [getView, scrollToSelection, computeMatchInfo])

  const handleReplace = useCallback(() => {
    const view = getView()
    if (!view) return
    replaceNext(view.state, view.dispatch, view)
    scrollToSelection(view)
    requestAnimationFrame(() => computeMatchInfo(view))
  }, [getView, scrollToSelection, computeMatchInfo])

  const handleReplaceAll = useCallback(() => {
    const view = getView()
    if (!view) return
    replaceAll(view.state, view.dispatch, view)
    requestAnimationFrame(() => computeMatchInfo(view))
  }, [getView, computeMatchInfo])

  const handleClose = useCallback(() => {
    const view = getView()
    if (view) {
      const query = new SearchQuery({ search: '' })
      const tr = setSearchState(view.state.tr, query)
      view.dispatch(tr)
      view.focus()
    }
    setSearchText('')
    setReplaceText('')
    setMatchInfo({ current: 0, total: 0 })
    onClose()
  }, [getView, onClose])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleFindPrev()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleFindNext()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }, [handleFindNext, handleFindPrev, handleClose])

  const handleReplaceKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleReplace()
    }
  }, [handleClose, handleReplace])

  if (!visible) return null

  return (
    <div className="orqa-find-bar">
      <div className="orqa-find-bar-row">
        {/* Expand/collapse replace */}
        <button
          className="orqa-find-bar-toggle"
          onClick={() => setShowReplace((v) => !v)}
          title={showReplace ? 'Hide replace' : 'Show replace'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            {showReplace
              ? <polyline points="2,4 6,8 10,4" />
              : <polyline points="4,2 8,6 4,10" />
            }
          </svg>
        </button>

        <div className="orqa-find-bar-input-group">
          <input
            ref={searchInputRef}
            className="orqa-find-bar-input"
            type="text"
            placeholder="Find"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />

          {/* Case sensitivity toggle */}
          <button
            className={`orqa-find-bar-option ${caseSensitive ? 'active' : ''}`}
            onClick={() => setCaseSensitive((v) => !v)}
            title="Match case"
          >
            Aa
          </button>

          {/* Regex toggle */}
          <button
            className={`orqa-find-bar-option ${useRegex ? 'active' : ''}`}
            onClick={() => setUseRegex((v) => !v)}
            title="Use regular expression"
          >
            .*
          </button>
        </div>

        {/* Match count */}
        <span className="orqa-find-bar-count">
          {searchText
            ? matchInfo.total > 0
              ? `${matchInfo.current} of ${matchInfo.total}`
              : 'No results'
            : ''}
        </span>

        {/* Prev / Next */}
        <button className="orqa-find-bar-btn" onClick={handleFindPrev} title="Previous match (Shift+Enter)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18,15 12,9 6,15" />
          </svg>
        </button>
        <button className="orqa-find-bar-btn" onClick={handleFindNext} title="Next match (Enter)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>

        {/* Close */}
        <button className="orqa-find-bar-btn" onClick={handleClose} title="Close (Escape)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="orqa-find-bar-row">
          <div className="orqa-find-bar-spacer" />
          <input
            className="orqa-find-bar-input orqa-find-bar-replace-input"
            type="text"
            placeholder="Replace"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={handleReplaceKeyDown}
          />
          <button className="orqa-find-bar-btn orqa-find-bar-text-btn" onClick={handleReplace} title="Replace">
            Replace
          </button>
          <button className="orqa-find-bar-btn orqa-find-bar-text-btn" onClick={handleReplaceAll} title="Replace all">
            All
          </button>
        </div>
      )}
    </div>
  )
}
