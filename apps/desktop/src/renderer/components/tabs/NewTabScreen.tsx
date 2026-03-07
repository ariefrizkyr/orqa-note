import { useCallback, useRef, useState } from 'react'
import { useWorkspaceStore } from '../../stores/workspace-store'
import { useTabStore } from '../../stores/tab-store'
import { detectServiceFromUrl, slugify, createBookmarkContent } from '../../lib/file-utils'

const FILE_CARDS = [
  { label: 'Markdown', ext: '.md', icon: '📝', description: 'Create a new document' },
  { label: 'Spreadsheet', ext: '.csv', icon: '📊', description: 'Create a CSV file' },
  { label: 'Canvas', ext: '.excalidraw', icon: '🎨', description: 'Create a drawing' },
  { label: 'Mermaid', ext: '.mmd', icon: '🔀', description: 'Create a diagram' }
]

export function NewTabScreen() {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const openTab = useTabStore((s) => s.openTab)
  const [showBookmarkForm, setShowBookmarkForm] = useState(false)
  const [bookmarkUrl, setBookmarkUrl] = useState('')
  const [bookmarkLabel, setBookmarkLabel] = useState('')
  const [bookmarkService, setBookmarkService] = useState('other')
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [labelTouched, setLabelTouched] = useState(false)
  const urlInputRef = useRef<HTMLInputElement>(null)

  const handleCreateFile = useCallback(
    async (ext: string) => {
      if (!workspacePath) return
      const name = window.prompt(`File name (e.g., my-doc${ext}):`)
      if (!name) return
      const fileName = name.endsWith(ext) ? name : name + ext
      const filePath = await window.electronAPI.fs.createFile(workspacePath, fileName)
      openTab({
        type: 'file',
        filePath,
        label: fileName,
        icon: '📝'
      })
    },
    [workspacePath, openTab]
  )

  const handleUrlBlur = useCallback(async () => {
    const currentUrl = urlInputRef.current?.value || ''
    if (!currentUrl) return

    setBookmarkService(detectServiceFromUrl(currentUrl))

    if (!labelTouched) {
      setFetchingTitle(true)
      try {
        const title = await window.electronAPI.fs.fetchPageTitle(currentUrl)
        if (title) setBookmarkLabel(title)
      } finally {
        setFetchingTitle(false)
      }
    }
  }, [labelTouched])

  const handleCreateBookmark = useCallback(async () => {
    if (!workspacePath || !bookmarkUrl || !bookmarkLabel) return
    const slug = slugify(bookmarkLabel)
    const content = createBookmarkContent(bookmarkUrl, bookmarkLabel, bookmarkService)
    const filePath = await window.electronAPI.fs.createFile(workspacePath, `${slug}.orqa`, content)
    openTab({
      type: 'bookmark',
      filePath,
      bookmarkUrl,
      label: bookmarkLabel,
      icon: '🔗'
    })
    setShowBookmarkForm(false)
    setBookmarkUrl('')
    setBookmarkLabel('')
    setBookmarkService('other')
    setLabelTouched(false)
  }, [workspacePath, bookmarkUrl, bookmarkLabel, bookmarkService, openTab])

  return (
    <div data-no-drag className="flex h-full items-center justify-center">
      <div className="w-[500px]">
        <h2 className="mb-6 text-center text-lg font-semibold text-white">New Tab</h2>

        <div className="grid grid-cols-2 gap-3">
          {FILE_CARDS.map((card) => (
            <button
              key={card.ext}
              onClick={() => handleCreateFile(card.ext)}
              className="flex flex-col items-center gap-2 rounded-lg border border-neutral-700 p-4 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
            >
              <span className="text-2xl">{card.icon}</span>
              <span className="text-sm font-medium text-white">{card.label}</span>
              <span className="text-xs text-neutral-500">{card.description}</span>
            </button>
          ))}
          <button
            onClick={() => setShowBookmarkForm(true)}
            className="flex flex-col items-center gap-2 rounded-lg border border-neutral-700 p-4 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
          >
            <span className="text-2xl">🔗</span>
            <span className="text-sm font-medium text-white">Bookmark</span>
            <span className="text-xs text-neutral-500">Add external link</span>
          </button>
        </div>

        {showBookmarkForm && (
          <div className="mt-6 space-y-3 rounded-lg border border-neutral-700 p-4">
            <input
              ref={urlInputRef}
              className="w-full rounded bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="URL (e.g., https://docs.google.com/...)"
              value={bookmarkUrl}
              onChange={(e) => setBookmarkUrl(e.target.value)}
              onBlur={handleUrlBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBookmark() }}
              autoFocus
            />
            <div className="relative">
              <input
                className="w-full rounded bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={fetchingTitle ? 'Fetching title...' : 'Label (e.g., Q2 Metrics)'}
                value={bookmarkLabel}
                onChange={(e) => {
                  setBookmarkLabel(e.target.value)
                  setLabelTouched(true)
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBookmark() }}
              />
              {fetchingTitle && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-blue-500" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateBookmark}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
              >
                Add Bookmark
              </button>
              <button
                onClick={() => setShowBookmarkForm(false)}
                className="rounded px-4 py-2 text-sm text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
