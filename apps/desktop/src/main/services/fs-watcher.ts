import { watch, type FSWatcher } from 'chokidar'
import { BrowserWindow } from 'electron'
import type { FSEvent } from '../../shared/types'

interface WatcherState {
  watcher: FSWatcher
  debounceTimer: ReturnType<typeof setTimeout> | null
  pendingEvents: FSEvent[]
}

const watchers = new Map<number, WatcherState>()

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

  const fsWatcher = watch(rootPath, {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.DS_Store'
    ],
    persistent: true,
    ignoreInitial: true,
    depth: undefined
  })

  const state: WatcherState = {
    watcher: fsWatcher,
    debounceTimer: null,
    pendingEvents: []
  }

  watchers.set(win.id, state)

  fsWatcher.on('add', (path) => queueEvent(win, state, { type: 'add', path }))
  fsWatcher.on('change', (path) => queueEvent(win, state, { type: 'change', path }))
  fsWatcher.on('unlink', (path) => queueEvent(win, state, { type: 'unlink', path }))
  fsWatcher.on('addDir', (path) => queueEvent(win, state, { type: 'addDir', path }))
  fsWatcher.on('unlinkDir', (path) => queueEvent(win, state, { type: 'unlinkDir', path }))
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
}

export function stopAllWatching(): void {
  for (const [windowId] of watchers) {
    stopWatching(windowId)
  }
}
