import { create } from 'zustand'

interface UIStore {
  sidebarWidth: number
  sidebarVisible: boolean
  isSearchOpen: boolean
  isResizingSidebar: boolean
  terminalVisible: boolean
  terminalWidth: number
  isResizingTerminal: boolean

  setSidebarWidth: (width: number) => void
  setSidebarVisible: (visible: boolean) => void
  toggleSidebar: () => void
  setSearchOpen: (open: boolean) => void
  toggleSearch: () => void
  setResizingSidebar: (resizing: boolean) => void
  setTerminalVisible: (visible: boolean) => void
  toggleTerminal: () => void
  setTerminalWidth: (width: number) => void
  setResizingTerminal: (resizing: boolean) => void
  initFromGlobal: () => Promise<void>
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSaveGlobalUI(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const { sidebarWidth, terminalVisible, terminalWidth } = useUIStore.getState()
    window.electronAPI.globalUI.saveState({ sidebarWidth, terminalVisible, terminalWidth })
    saveTimer = null
  }, 1000)
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarWidth: 260,
  sidebarVisible: true,
  isSearchOpen: false,
  isResizingSidebar: false,
  terminalVisible: false,
  terminalWidth: 400,
  isResizingTerminal: false,

  setSidebarWidth: (width) => {
    const clamped = Math.max(200, Math.min(400, width))
    set({ sidebarWidth: clamped })
    debouncedSaveGlobalUI()
  },
  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setSearchOpen: (open) => set({ isSearchOpen: open }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setResizingSidebar: (resizing) => set({ isResizingSidebar: resizing }),

  setTerminalVisible: (visible) => {
    set({ terminalVisible: visible })
    debouncedSaveGlobalUI()
  },
  toggleTerminal: () => {
    set((state) => ({ terminalVisible: !state.terminalVisible }))
    debouncedSaveGlobalUI()
  },
  setTerminalWidth: (width) => {
    const clamped = Math.max(250, Math.min(600, width))
    set({ terminalWidth: clamped })
    debouncedSaveGlobalUI()
  },
  setResizingTerminal: (resizing) => set({ isResizingTerminal: resizing }),

  initFromGlobal: async () => {
    try {
      const state = await window.electronAPI.globalUI.getState()
      const updates: Partial<UIStore> = {}
      if (state.sidebarWidth) {
        updates.sidebarWidth = Math.max(200, Math.min(400, state.sidebarWidth))
      }
      if (state.terminalVisible !== undefined) {
        updates.terminalVisible = state.terminalVisible
      }
      if (state.terminalWidth) {
        updates.terminalWidth = Math.max(250, Math.min(600, state.terminalWidth))
      }
      set(updates)
    } catch {
      // Use defaults
    }
  }
}))
