import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HiddenListingsState {
  hiddenIds: string[]
  hide: (id: string) => void
  unhide: (id: string) => void
  isHidden: (id: string) => boolean
}

export const useHiddenListingsStore = create<HiddenListingsState>()(
  persist(
    (set, get) => ({
      hiddenIds: [],

      hide: (id) => {
        if (!get().hiddenIds.includes(id)) {
          set({ hiddenIds: [...get().hiddenIds, id] })
        }
      },

      unhide: (id) => {
        set({ hiddenIds: get().hiddenIds.filter(h => h !== id) })
      },

      isHidden: (id) => {
        return get().hiddenIds.includes(id)
      },
    }),
    {
      name: 'neutron-hidden-listings',
      partialize: (state) => ({ hiddenIds: state.hiddenIds }),
    }
  )
)
