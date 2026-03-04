import { create } from 'zustand'

interface UIStore {
  sidebarWidth: number
  isSearchOpen: boolean
  isResizingSidebar: boolean

  setSidebarWidth: (width: number) => void
  setSearchOpen: (open: boolean) => void
  toggleSearch: () => void
  setResizingSidebar: (resizing: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarWidth: 260,
  isSearchOpen: false,
  isResizingSidebar: false,

  setSidebarWidth: (width) =>
    set({ sidebarWidth: Math.max(200, Math.min(400, width)) }),

  setSearchOpen: (open) => set({ isSearchOpen: open }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setResizingSidebar: (resizing) => set({ isResizingSidebar: resizing })
}))
