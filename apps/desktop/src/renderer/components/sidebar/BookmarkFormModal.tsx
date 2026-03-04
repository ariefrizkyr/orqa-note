import { useCallback, useEffect, useRef, useState } from 'react'
import { detectServiceFromUrl } from '../../lib/file-utils'

interface BookmarkFormModalProps {
  onSubmit: (data: { url: string; label: string; service: string }) => void
  onCancel: () => void
}

export function BookmarkFormModal({ onSubmit, onCancel }: BookmarkFormModalProps) {
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [service, setService] = useState('other')
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [labelTouched, setLabelTouched] = useState(false)
  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    urlRef.current?.focus()
  }, [])

  const handleUrlBlur = useCallback(async () => {
    const currentUrl = urlRef.current?.value || ''
    if (!currentUrl) return

    const detected = detectServiceFromUrl(currentUrl)
    setService(detected)

    if (!labelTouched) {
      setFetchingTitle(true)
      try {
        const title = await window.electronAPI.fs.fetchPageTitle(currentUrl)
        if (title) setLabel(title)
      } finally {
        setFetchingTitle(false)
      }
    }
  }, [labelTouched])

  const handleSubmit = useCallback(() => {
    if (!url || !label) return
    onSubmit({ url, label, service })
  }, [url, label, service, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter') {
        handleSubmit()
      }
    },
    [onCancel, handleSubmit]
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-[400px] space-y-3 rounded-lg border border-neutral-700 bg-neutral-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-white">New Bookmark</h3>
        <input
          ref={urlRef}
          className="w-full rounded bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="URL (e.g., https://docs.google.com/...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUrlBlur}
        />
        <div className="relative">
          <input
            className="w-full rounded bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={fetchingTitle ? 'Fetching title...' : 'Label (e.g., Q2 Metrics)'}
            value={label}
            onChange={(e) => {
              setLabel(e.target.value)
              setLabelTouched(true)
            }}
          />
          {fetchingTitle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-blue-500" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!url || !label}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            Add Bookmark
          </button>
          <button
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
