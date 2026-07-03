import { create } from 'zustand'

interface ScrollPositionState {
  positions: Record<string, number>
  setPosition: (key: string, position: number) => void
  getPosition: (key: string) => number
  clearPosition: (key: string) => void
}

export const useScrollPositionStore = create<ScrollPositionState>((set, get) => ({
  positions: {},

  setPosition: (key, position) => {
    set((s) => ({ positions: { ...s.positions, [key]: position } }))
    try { sessionStorage.setItem(`scroll_${key}`, String(position)) } catch {}
  },

  getPosition: (key) => {
    const cached = get().positions[key]
    if (cached !== undefined) return cached
    try {
      const stored = sessionStorage.getItem(`scroll_${key}`)
      if (stored !== null) return Number(stored)
    } catch {}
    return 0
  },

  clearPosition: (key) => {
    set((s) => {
      const { [key]: _, ...rest } = s.positions
      return { positions: rest }
    })
    try { sessionStorage.removeItem(`scroll_${key}`) } catch {}
  },
}))
