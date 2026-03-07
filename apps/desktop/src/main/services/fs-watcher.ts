import { watch, type FSWatcher } from 'chokidar'
import { BrowserWindow } from 'electron'
import type { FSEvent } from '../../shared/types'

interface WatcherState {
  watcher: FSWatcher
  debounceTimer: ReturnType<typeof setTimeout> | null
  pendingEvents: FSEvent[]
  watchedPaths: Set<string>
}

const watchers = new Map<number, WatcherState>()

const IGNORED = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.DS_Store'
]

function flushEvents(win: BrowserWindow, state: WatcherState) {
  if (state.pendingEvents.length === 0) return
  const events = [...state.pendingEvents]
  state.pendingEvents.length = 0
  for (const event of events) {
    win.webContents.send('fsWatch:event', event)
  }
}

function queueEvent(win: BrowserWindow, state: WatcherState, event: FSEvent) {
  state.pendingEvents.push(event)
  if (state.debounceTimer) clearTimeout(state.debounceTimer)
  state.debounceTimer = setTimeout(() => flushEvents(win, state), 100)
}

export function startWatching(rootPath: string, win: BrowserWindow): void {
  stopWatching(win.id)
  console.log(`[fs-watcher] start watching: ${rootPath} (window ${win.id})`)

  const fsWatcher = watch(rootPath, {
    ignored: IGNORED,
    persistent: true,
    ignoreInitial: true,
    depth: 0
  })

  const state: WatcherState = {
    watcher: fsWatcher,
    debounceTimer: null,
    pendingEvents: [],
    watchedPaths: new Set([rootPath])
  }

  watchers.set(win.id, state)

  fsWatcher.on('add', (path) => queueEvent(win, state, { type: 'add', path }))
  fsWatcher.on('change', (path) => queueEvent(win, state, { type: 'change', path }))
  fsWatcher.on('unlink', (path) => queueEvent(win, state, { type: 'unlink', path }))
  fsWatcher.on('addDir', (path) => queueEvent(win, state, { type: 'addDir', path }))
  fsWatcher.on('unlinkDir', (path) => queueEvent(win, state, { type: 'unlinkDir', path }))
  fsWatcher.on('error', (err) => {
    console.error('[fs-watcher] error:', err instanceof Error ? err.message : err)
  })
}

export function updateWatchedPaths(windowId: number, paths: string[]): void {
  const state = watchers.get(windowId)
  if (!state) return

  const nextPaths = new Set(paths)

  // Unwatch paths that are no longer visible
  for (const p of state.watchedPaths) {
    if (!nextPaths.has(p)) {
      state.watcher.unwatch(p)
    }
  }

  // Watch newly visible paths
  for (const p of nextPaths) {
    if (!state.watchedPaths.has(p)) {
      state.watcher.add(p)
    }
  }

  state.watchedPaths = nextPaths
}

export function stopWatching(windowId: number): void {
  const state = watchers.get(windowId)
  if (!state) return

  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer)
  }
  state.pendingEvents.length = 0
  state.watcher.close()
  watchers.delete(windowId)
  console.log(`[fs-watcher] stopped watching (window ${windowId})`)
}

export function stopAllWatching(): void {
  for (const [windowId] of watchers) {
    stopWatching(windowId)
  }
}
