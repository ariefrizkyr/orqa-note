import { create } from 'zustand'

type ToastPlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

interface ToastState {
  id: number
  message: string
  placement: ToastPlacement
}

interface ToastStore {
  toast: ToastState | null
  showToast: (options: { message: string; placement: ToastPlacement; duration?: number }) => void
  dismissToast: () => void
}

let nextId = 0
let dismissTimer: ReturnType<typeof setTimeout> | null = null

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,

  showToast: ({ message, placement, duration = 2000 }) => {
    if (dismissTimer) clearTimeout(dismissTimer)
    const id = ++nextId
    set({ toast: { id, message, placement } })
    dismissTimer = setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state))
      dismissTimer = null
    }, duration)
  },

  dismissToast: () => {
    if (dismissTimer) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }
    set({ toast: null })
  }
}))
