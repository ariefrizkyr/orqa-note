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
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarWidth: 260,
  sidebarVisible: true,
  isSearchOpen: false,
  isResizingSidebar: false,

  setSidebarWidth: (width) =>
    set({ sidebarWidth: Math.max(200, Math.min(400, width)) }),
  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setSearchOpen: (open) => set({ isSearchOpen: open }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setResizingSidebar: (resizing) => set({ isResizingSidebar: resizing })
}))
