import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ReadingMode = 'light' | 'dark' | 'eye-protection' | 'sepia'
export type InteractionMode = 'reading' | 'dictionary' | 'highlight'

interface BookReaderState {
  currentBookId: string | null
  currentPage: number
  totalPages: number
  readingMode: ReadingMode
  interactionMode: InteractionMode
  fontSize: number
  lineHeight: number
  fontFamily: 'sans' | 'serif' | 'mono'
  isDictionaryLookingUp: boolean
  dictionaryWord: string
  dictionaryDefinition: any | null
  showHighlightsPanel: boolean

  setCurrentBookId: (id: string | null) => void
  setCurrentPage: (page: number) => void
  setTotalPages: (total: number) => void
  setReadingMode: (mode: ReadingMode) => void
  setInteractionMode: (mode: InteractionMode) => void
  setFontSize: (size: number) => void
  setLineHeight: (height: number) => void
  setFontFamily: (family: 'sans' | 'serif' | 'mono') => void
  setIsDictionaryLookingUp: (looking: boolean) => void
  setDictionaryWord: (word: string) => void
  setDictionaryDefinition: (definition: any | null) => void
  setShowHighlightsPanel: (show: boolean) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  resetReader: () => void
}

const INITIAL = {
  currentBookId: null,
  currentPage: 0,
  totalPages: 0,
  readingMode: 'dark' as ReadingMode,
  interactionMode: 'reading' as InteractionMode,
  fontSize: 16,
  lineHeight: 1.6,
  fontFamily: 'sans' as const,
  isDictionaryLookingUp: false,
  dictionaryWord: '',
  dictionaryDefinition: null,
  showHighlightsPanel: false,
}

export const useBookReaderStore = create<BookReaderState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      setCurrentBookId: (id) => set({ currentBookId: id }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setTotalPages: (total) => set({ totalPages: total }),
      setReadingMode: (mode) => set({ readingMode: mode }),
      setInteractionMode: (mode) => set({ interactionMode: mode }),
      setFontSize: (size) => set({ fontSize: size }),
      setLineHeight: (height) => set({ lineHeight: height }),
      setFontFamily: (family) => set({ fontFamily: family }),
      setIsDictionaryLookingUp: (looking) => set({ isDictionaryLookingUp: looking }),
      setDictionaryWord: (word) => set({ dictionaryWord: word }),
      setDictionaryDefinition: (definition) => set({ dictionaryDefinition: definition }),
      setShowHighlightsPanel: (show) => set({ showHighlightsPanel: show }),

      goToNextPage: () => {
        const { currentPage, totalPages } = get()
        if (currentPage < totalPages - 1) {
          set({ currentPage: currentPage + 1 })
        }
      },

      goToPreviousPage: () => {
        const { currentPage } = get()
        if (currentPage > 0) {
          set({ currentPage: currentPage - 1 })
        }
      },

      resetReader: () => set(INITIAL),
    }),
    {
      name: 'neutron-book-reader',
      partialize: (state) => ({
        readingMode: state.readingMode,
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        fontFamily: state.fontFamily,
      }),
    }
  )
)