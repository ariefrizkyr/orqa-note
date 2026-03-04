import { useEffect, useState } from 'react'

interface WelcomeScreenProps {
  onOpenFolder: () => void
  onOpenRecent: (path: string) => void
}

export function WelcomeScreen({ onOpenFolder, onOpenRecent }: WelcomeScreenProps) {
  const [recentPaths, setRecentPaths] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI.workspace.getRecent().then(setRecentPaths)
  }, [])

  const handleOpenRecent = async (path: string) => {
    const exists = await window.electronAPI.fs.existsDir(path)
    if (!exists) {
      setError(`Folder not found: ${path}`)
      // Remove stale entry
      const updated = recentPaths.filter((p) => p !== path)
      setRecentPaths(updated)
      window.electronAPI.workspace.setRecent(updated)
      setTimeout(() => setError(null), 3000)
      return
    }
    onOpenRecent(path)
  }

  return (
    <div
      data-drag
      className="flex h-full items-center justify-center"
    >
      <div className="flex w-[400px] flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Orqa Note</h1>
          <p className="mt-2 text-sm text-neutral-400">The PM Workspace</p>
        </div>

        <button
          onClick={onOpenFolder}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <span>Open Folder...</span>
          <kbd className="rounded bg-blue-700 px-1.5 py-0.5 text-xs">⌘O</kbd>
        </button>

        {error && (
          <div className="w-full rounded-md bg-red-900/50 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {recentPaths.length > 0 && (
          <div className="w-full">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Recent
            </h2>
            <ul className="space-y-1">
              {recentPaths.map((path) => (
                <li key={path}>
                  <button
                    onClick={() => handleOpenRecent(path)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
                  >
                    <span className="text-neutral-500">›</span>
                    <span className="truncate">{path.replace(/^\/Users\/[^/]+/, '~')}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
