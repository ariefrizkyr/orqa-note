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
  setTabs: (tabs: Tab[], activeTabId: string | null) => void
  findTabByFilePath: (filePath: string) => Tab | undefined
  reset: () => void
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
      const newTabs = [...state.tabs]
      const [moved] = newTabs.splice(fromIndex, 1)
      newTabs.splice(toIndex, 0, moved)
      return { tabs: newTabs }
    }),

  updateTab: (id, updates) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t))
    })),

  setTabs: (tabs, activeTabId) => set({ tabs, activeTabId }),

  findTabByFilePath: (filePath) => get().tabs.find((t) => t.filePath === filePath),

  reset: () => set({ tabs: [], activeTabId: null, recentlyClosed: [] })
}))
