import { create } from 'zustand'
import type { UpdateStatusType } from '../../shared/types'

interface UpdateStore {
  status: UpdateStatusType | null
  version: string | null
  progress: number
  error: string | null
  toastVisible: boolean

  setStatus: (status: UpdateStatusType, version?: string, progress?: number, error?: string) => void
  showToast: () => void
  dismissToast: () => void
}

export const useUpdateStore = create<UpdateStore>((set) => ({
  status: null,
  version: null,
  progress: 0,
  error: null,
  toastVisible: false,

  setStatus: (status, version, progress, error) =>
    set({
      status,
      version: version ?? null,
      progress: progress ?? 0,
      error: error ?? null,
      toastVisible: true
    }),

  showToast: () => set({ toastVisible: true }),
  dismissToast: () => set({ toastVisible: false })
}))
