import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { Tab } from '../../shared/types'

interface TabStore {
  tabs: Tab[]
  activeTabId: string | null
  recentlyClosed: Tab[]

  openTab: (tab: Omit<Tab, 'id'>) => string
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  reopenLastClosed: () => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  updateTab: (id: string, updates: Partial<Tab>) => void
  markDirty: (id: string) => void
  clearDirty: (id: string) => void
  setTabs: (tabs: Tab[], activeTabId: string | null) => void
  findTabByFilePath: (filePath: string) => Tab | undefined
  reset: () => void
  pinTab: (id: string) => void
  unpinTab: (id: string) => void
  closeAllTabs: () => void
  closeOtherTabs: (id: string) => void
  closeTabsToTheRight: (id: string) => void
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  recentlyClosed: [],

  openTab: (tabData) => {
    const existing = tabData.filePath
      ? get().tabs.find((t) => t.filePath === tabData.filePath)
      : tabData.bookmarkUrl
        ? get().tabs.find((t) => t.bookmarkUrl === tabData.bookmarkUrl)
        : tabData.type === 'new-tab'
          ? get().tabs.find((t) => t.type === 'new-tab')
          : undefined

    if (existing) {
      set({ activeTabId: existing.id })
      return existing.id
    }

    const id = uuid()
    const tab: Tab = { ...tabData, id }
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: id
    }))
    return id
  },

  closeTab: (id) => {
    const tab = get().tabs.find((t) => t.id === id)
    if (tab?.isPinned) return

    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === id)
      const newTabs = state.tabs.filter((t) => t.id !== id)

      let newActive = state.activeTabId
      if (state.activeTabId === id) {
        if (newTabs.length === 0) {
          newActive = null
        } else if (idx >= newTabs.length) {
          newActive = newTabs[newTabs.length - 1].id
        } else {
          newActive = newTabs[idx].id
        }
      }

      return {
        tabs: newTabs,
        activeTabId: newActive,
        recentlyClosed: tab
          ? [tab, ...state.recentlyClosed].slice(0, 10)
          : state.recentlyClosed
      }
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  reopenLastClosed: () =>
    set((state) => {
      if (state.recentlyClosed.length === 0) return state
      const [tab, ...rest] = state.recentlyClosed
      const newId = uuid()
      const reopened = { ...tab, id: newId }
      return {
        tabs: [...state.tabs, reopened],
        activeTabId: newId,
        recentlyClosed: rest
      }
    }),

  reorderTabs: (fromIndex, toIndex) =>
    set((state) => {
      const pinnedCount = state.tabs.filter((t) => t.isPinned).length
      const fromPinned = fromIndex < pinnedCount
      // Clamp toIndex within the same zone
      let clampedTo = toIndex
      if (fromPinned) {
        clampedTo = Math.max(0, Math.min(clampedTo, pinnedCount - 1))
      } else {
        clampedTo = Math.max(pinnedCount, Math.min(clampedTo, state.tabs.length - 1))
      }
      if (fromIndex === clampedTo) return state
      const newTabs = [...state.tabs]
      const [moved] = newTabs.splice(fromIndex, 1)
      newTabs.splice(clampedTo, 0, moved)
      return { tabs: newTabs }
    }),

  updateTab: (id, updates) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t))
    })),

  markDirty: (id) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, isDirty: true } : t))
    })),

  clearDirty: (id) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, isDirty: false } : t))
    })),

  setTabs: (tabs, activeTabId) => set({ tabs, activeTabId }),

  findTabByFilePath: (filePath) => get().tabs.find((t) => t.filePath === filePath),

  reset: () => set({ tabs: [], activeTabId: null, recentlyClosed: [] }),

  pinTab: (id) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === id)
      if (idx === -1 || state.tabs[idx].isPinned) return state
      const newTabs = [...state.tabs]
      const [tab] = newTabs.splice(idx, 1)
      const pinnedCount = newTabs.filter((t) => t.isPinned).length
      newTabs.splice(pinnedCount, 0, { ...tab, isPinned: true })
      return { tabs: newTabs }
    }),

  unpinTab: (id) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === id)
      if (idx === -1 || !state.tabs[idx].isPinned) return state
      const newTabs = [...state.tabs]
      const [tab] = newTabs.splice(idx, 1)
      const pinnedCount = newTabs.filter((t) => t.isPinned).length
      newTabs.splice(pinnedCount, 0, { ...tab, isPinned: false })
      return { tabs: newTabs }
    }),

  closeAllTabs: () =>
    set((state) => {
      const pinned = state.tabs.filter((t) => t.isPinned)
      const closed = state.tabs.filter((t) => !t.isPinned)
      const newActive = pinned.find((t) => t.id === state.activeTabId)
        ? state.activeTabId
        : pinned.length > 0
          ? pinned[pinned.length - 1].id
          : null
      return {
        tabs: pinned,
        activeTabId: newActive,
        recentlyClosed: [...closed, ...state.recentlyClosed].slice(0, 10)
      }
    }),

  closeOtherTabs: (id) =>
    set((state) => {
      const keep = state.tabs.filter((t) => t.id === id || t.isPinned)
      const closed = state.tabs.filter((t) => t.id !== id && !t.isPinned)
      const newActive = keep.find((t) => t.id === state.activeTabId)
        ? state.activeTabId
        : id
      return {
        tabs: keep,
        activeTabId: newActive,
        recentlyClosed: [...closed, ...state.recentlyClosed].slice(0, 10)
      }
    }),

  closeTabsToTheRight: (id) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === id)
      if (idx === -1) return state
      const left = state.tabs.slice(0, idx + 1)
      const right = state.tabs.slice(idx + 1)
      const keptRight = right.filter((t) => t.isPinned)
      const closedRight = right.filter((t) => !t.isPinned)
      const newTabs = [...left, ...keptRight]
      const newActive = newTabs.find((t) => t.id === state.activeTabId)
        ? state.activeTabId
        : id
      return {
        tabs: newTabs,
        activeTabId: newActive,
        recentlyClosed: [...closedRight, ...state.recentlyClosed].slice(0, 10)
      }
    })
}))
