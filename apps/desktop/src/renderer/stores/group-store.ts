import { create } from 'zustand'
import type { WorkspaceGroup } from '../../shared/types'

interface GroupStore {
  group: WorkspaceGroup | null
  setGroup: (group: WorkspaceGroup | null) => void
  updateGroup: (updates: Partial<WorkspaceGroup>) => void
}

export const useGroupStore = create<GroupStore>((set) => ({
  group: null,

  setGroup: (group) => set({ group }),

  updateGroup: (updates) =>
    set((state) => {
      if (!state.group) return state
      return { group: { ...state.group, ...updates } }
    })
}))
