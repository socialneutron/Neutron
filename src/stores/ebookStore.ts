import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Ebook, UserEbook, EbookHighlight } from '../types/database'
import { ebookService } from '../services/ebookService'

interface EbookState {
  ebooks: Ebook[]
  userEbooks: UserEbook[]
  publishedEbooks: Ebook[]
  selectedEbook: Ebook | null
  activeCategory: string
  searchQuery: string
  isLoading: boolean

  setEbooks: (ebooks: Ebook[]) => void
  setUserEbooks: (userEbooks: UserEbook[]) => void
  setSelectedEbook: (ebook: Ebook | null) => void
  setActiveCategory: (category: string) => void
  setSearchQuery: (query: string) => void
  setIsLoading: (loading: boolean) => void

  fetchEbooks: (category?: string) => Promise<void>
  searchEbooks: (query: string) => Promise<void>
  purchaseEbook: (userId: string, ebookId: string) => Promise<void>
  fetchUserEbooks: (userId: string) => Promise<void>
  updateProgress: (userId: string, ebookId: string, progress: number) => Promise<void>
  addHighlight: (userId: string, ebookId: string, highlight: Omit<EbookHighlight, 'id' | 'created_at'>) => Promise<void>
  removeHighlight: (userId: string, ebookId: string, highlightId: string) => Promise<void>
  addPublishedEbook: (ebook: Ebook) => void
}

const INITIAL = {
  ebooks: [],
  userEbooks: [],
  publishedEbooks: [],
  selectedEbook: null,
  activeCategory: 'All',
  searchQuery: '',
  isLoading: false,
}

export const useEbookStore = create<EbookState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      setEbooks: (ebooks) => set({ ebooks }),
      setUserEbooks: (userEbooks) => set({ userEbooks }),
      setSelectedEbook: (ebook) => set({ selectedEbook: ebook }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      fetchEbooks: async (category) => {
        set({ isLoading: true })
        try {
          const mockEbooks = ebookService.getMockEbooks()
          const { publishedEbooks } = get()
          const all = [...publishedEbooks, ...mockEbooks]
          set({ ebooks: all, isLoading: false })
        } catch (error) {
          console.error('Error fetching ebooks:', error)
          set({ isLoading: false })
        }
      },

      searchEbooks: async (query) => {
        set({ isLoading: true, searchQuery: query })
        try {
          if (!query.trim()) {
            const ebooks = ebookService.getMockEbooks()
            set({ ebooks, isLoading: false })
            return
          }
          const ebooks = await ebookService.searchEbooks(query)
          set({ ebooks, isLoading: false })
        } catch (error) {
          console.error('Error searching ebooks:', error)
          set({ isLoading: false })
        }
      },

      purchaseEbook: async (userId, ebookId) => {
        try {
          const userEbook = await ebookService.purchaseEbook(userId, ebookId)
          if (userEbook) {
            const { userEbooks } = get()
            const exists = userEbooks.find(e => e.ebook_id === ebookId)
            if (!exists) {
              set({ userEbooks: [...userEbooks, userEbook] })
            }
          } else {
            throw new Error('Failed to claim magazine')
          }
        } catch (error) {
          console.error('Error purchasing ebook:', error)
          throw error
        }
      },

      fetchUserEbooks: async (userId) => {
        try {
          const userEbooks = await ebookService.getUserEbooks(userId)
          set({ userEbooks })
        } catch (error) {
          console.error('Error fetching user ebooks:', error)
        }
      },

      updateProgress: async (userId, ebookId, progress) => {
        await ebookService.updateProgress(userId, ebookId, progress)
        const { userEbooks } = get()
        const index = userEbooks.findIndex(e => e.ebook_id === ebookId)
        if (index !== -1) {
          const updated = [...userEbooks]
          updated[index] = { ...updated[index], progress, last_read_at: new Date().toISOString() }
          set({ userEbooks: updated })
        }
      },

      addHighlight: async (userId, ebookId, highlight) => {
        await ebookService.addHighlight(userId, ebookId, highlight)
        const { userEbooks } = get()
        const index = userEbooks.findIndex(e => e.ebook_id === ebookId)
        if (index !== -1) {
          const updated = [...userEbooks]
          const newHighlight: EbookHighlight = {
            ...highlight,
            id: `highlight-${Date.now()}`,
            created_at: new Date().toISOString(),
          }
          updated[index] = {
            ...updated[index],
            highlights: [...updated[index].highlights, newHighlight],
          }
          set({ userEbooks: updated })
        }
      },

      removeHighlight: async (userId, ebookId, highlightId) => {
        await ebookService.removeHighlight(userId, ebookId, highlightId)
        const { userEbooks } = get()
        const index = userEbooks.findIndex(e => e.ebook_id === ebookId)
        if (index !== -1) {
          const updated = [...userEbooks]
          updated[index] = {
            ...updated[index],
            highlights: updated[index].highlights.filter(h => h.id !== highlightId),
          }
          set({ userEbooks: updated })
        }
      },

      addPublishedEbook: (ebook) => {
        const { publishedEbooks, ebooks } = get()
        set({
          publishedEbooks: [ebook, ...publishedEbooks],
          ebooks: [ebook, ...ebooks],
        })
      },
    }),
    {
      name: 'neutron-ebooks',
      partialize: (state) => ({
        userEbooks: state.userEbooks,
        publishedEbooks: state.publishedEbooks,
        activeCategory: state.activeCategory,
      }),
    }
  )
)