import { useEffect } from 'react'
import { useUpdateStore } from '../../stores/update-store'

export function UpdateToast() {
  const { status, version, progress, error, toastVisible, setStatus, dismissToast } =
    useUpdateStore()

  useEffect(() => {
    const cleanup = window.electronAPI.updater.onStatus((event) => {
      setStatus(event.status, event.version, event.progress, event.error)
    })
    return cleanup
  }, [setStatus])

  // Auto-dismiss for transient states
  useEffect(() => {
    if (status === 'not-available') {
      const timer = setTimeout(dismissToast, 3000)
      return () => clearTimeout(timer)
    }
    if (status === 'error') {
      const timer = setTimeout(dismissToast, 5000)
      return () => clearTimeout(timer)
    }
  }, [status, dismissToast])

  if (!toastVisible || !status || status === 'checking') return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-neutral-700 bg-neutral-800 p-4 shadow-2xl">
      {status === 'available' && (
        <>
          <p className="text-sm text-neutral-200">
            A new version <span className="font-semibold text-white">v{version}</span> is available.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={dismissToast}
              className="rounded px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-200"
            >
              Later
            </button>
            <button
              onClick={() => window.electronAPI.updater.download()}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-blue-500"
            >
              Download
            </button>
          </div>
        </>
      )}

      {status === 'downloading' && (
        <>
          <p className="text-sm text-neutral-200">Downloading update...</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-neutral-500">{progress}%</p>
        </>
      )}

      {status === 'downloaded' && (
        <>
          <p className="text-sm text-neutral-200">
            Update <span className="font-semibold text-white">v{version}</span> is ready to install.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={dismissToast}
              className="rounded px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-200"
            >
              Later
            </button>
            <button
              onClick={() => window.electronAPI.updater.install()}
              className="rounded bg-green-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-green-500"
            >
              Restart Now
            </button>
          </div>
        </>
      )}

      {status === 'not-available' && (
        <p className="text-sm text-neutral-400">
          You're up to date{version ? ` (v${version})` : ''}.
        </p>
      )}

      {status === 'error' && (
        <div>
          <p className="text-sm text-red-400">Could not check for updates.</p>
          {error && <p className="mt-1 text-xs text-neutral-500">{error}</p>}
        </div>
      )}
    </div>
  )
}
