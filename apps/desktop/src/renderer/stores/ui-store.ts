import { create } from 'zustand'

interface UIStore {
  sidebarWidth: number
  sidebarVisible: boolean
  isSearchOpen: boolean
  isResizingSidebar: boolean

  setSidebarWidth: (width: number) => void
  setSidebarVisible: (visible: boolean) => void
  toggleSidebar: () => void
  setSearchOpen: (open: boolean) => void
  toggleSearch: () => void
  setResizingSidebar: (resizing: boolean) => void
  initFromGlobal: () => Promise<void>
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSaveGlobalUI(width: number): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    window.electronAPI.globalUI.saveState({ sidebarWidth: width })
    saveTimer = null
  }, 1000)
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarWidth: 260,
  sidebarVisible: true,
  isSearchOpen: false,
  isResizingSidebar: false,

  setSidebarWidth: (width) => {
    const clamped = Math.max(200, Math.min(400, width))
    set({ sidebarWidth: clamped })
    debouncedSaveGlobalUI(clamped)
  },
  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setSearchOpen: (open) => set({ isSearchOpen: open }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setResizingSidebar: (resizing) => set({ isResizingSidebar: resizing }),

  initFromGlobal: async () => {
    try {
      const state = await window.electronAPI.globalUI.getState()
      if (state.sidebarWidth) {
        set({ sidebarWidth: Math.max(200, Math.min(400, state.sidebarWidth)) })
      }
    } catch {
      // Use defaults
    }
  }
}))
