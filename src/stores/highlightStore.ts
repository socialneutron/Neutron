import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Highlight {
  id: string
  user_id: string
  title: string
  cover_url: string
  post_ids: string[]
  created_at: string
}

interface HighlightState {
  highlightsByUser: Record<string, Highlight[]>
  addHighlight: (userId: string, title: string, coverUrl: string, postId: string) => void
  removeHighlight: (highlightId: string) => void
  addPostToHighlight: (highlightId: string, postId: string) => void
  removePostFromHighlight: (highlightId: string, postId: string) => void
  loadHighlights: (userId: string) => Promise<void>
}

export const useHighlightStore = create<HighlightState>((set, get) => ({
  highlightsByUser: {},

  addHighlight: (userId, title, coverUrl, postId) => {
    const highlights = get().highlightsByUser[userId] || []
    const newHighlight: Highlight = {
      id: `hl_${Date.now()}`,
      user_id: userId,
      title,
      cover_url: coverUrl,
      post_ids: [postId],
      created_at: new Date().toISOString(),
    }
    set({
      highlightsByUser: {
        ...get().highlightsByUser,
        [userId]: [newHighlight, ...highlights],
      },
    })
  },

  removeHighlight: (highlightId) => {
    const byUser = { ...get().highlightsByUser }
    for (const userId of Object.keys(byUser)) {
      byUser[userId] = byUser[userId].filter(h => h.id !== highlightId)
    }
    set({ highlightsByUser: byUser })
  },

  addPostToHighlight: (highlightId, postId) => {
    const byUser = { ...get().highlightsByUser }
    for (const userId of Object.keys(byUser)) {
      byUser[userId] = byUser[userId].map(h =>
        h.id === highlightId ? { ...h, post_ids: [...new Set([...h.post_ids, postId])] } : h
      )
    }
    set({ highlightsByUser: byUser })
  },

  removePostFromHighlight: (highlightId, postId) => {
    const byUser = { ...get().highlightsByUser }
    for (const userId of Object.keys(byUser)) {
      byUser[userId] = byUser[userId].map(h =>
        h.id === highlightId ? { ...h, post_ids: h.post_ids.filter(pid => pid !== postId) } : h
      )
    }
    set({ highlightsByUser: byUser })
  },

  loadHighlights: async (userId) => {
    const { data } = await supabase.from('highlights').select('*').eq('user_id', userId)
    if (data) {
      set((s) => ({
        highlightsByUser: { ...s.highlightsByUser, [userId]: data },
      }))
    }
  },
}))
