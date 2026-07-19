import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { savePdfData, getPdfData, deletePdfData, savePdfThumbnail, getPdfThumbnail, deletePdfThumbnail } from '../lib/pdfdb'
import { pdfjsLib } from '../lib/pdfjs'

export interface UploadedPdf {
  id: string
  title: string
  author: string
  fileName: string
  dataUrl: string
  totalPages: number
  uploadedAt: string
  lastReadAt: string
  lastReadPage: number
  progress: number
}

export interface UploadedPdfMeta {
  id: string
  title: string
  author: string
  fileName: string
  totalPages: number
  uploadedAt: string
  lastReadAt: string
  lastReadPage: number
  progress: number
}

export interface PdfHighlight {
  id: string
  pdfId: string
  page: number
  text: string
  color: string
  createdAt: string
}

export interface PdfNote {
  id: string
  pdfId: string
  page: number
  text: string
  highlightId?: string
  createdAt: string
  updatedAt: string
}

export interface DictHistoryEntry {
  word: string
  timestamp: number
}

export interface SavedWord {
  word: string
  partOfSpeech: string
  savedAt: number
}

export interface ApiDefinition {
  definition: string
  example?: string
  synonyms: string[]
  antonyms: string[]
}

export interface ApiMeaning {
  partOfSpeech: string
  definitions: ApiDefinition[]
  synonyms: string[]
  antonyms: string[]
}

export interface ApiDefinitionResponse {
  word: string
  phonetic: string
  phonetics: { text: string; audio?: string }[]
  origin?: string
  meanings: ApiMeaning[]
  sourceUrls: string[]
}

interface PdfReaderState {
  uploadedPdfs: (UploadedPdfMeta & { dataUrl: string })[]
  highlights: Record<string, PdfHighlight[]>
  notes: Record<string, PdfNote[]>
  currentPdfId: string | null
  currentPage: number
  totalPages: number
  zoom: number
  readingMode: 'light' | 'dark' | 'sepia' | 'eye-protection'
  dictionaryWord: string | null
  leftPanelTab: 'notes' | 'dict'
  pdfDataCache: Record<string, string>
  dictHistory: DictHistoryEntry[]
  savedWords: SavedWord[]
  dictCache: Record<string, ApiDefinitionResponse>
  pdfThumbnails: Record<string, string>

  addPdf: (pdf: UploadedPdf) => Promise<void>
  removePdf: (id: string) => Promise<void>
  loadPdfData: (id: string) => Promise<string | null>
  generateAndCacheThumbnail: (pdfId: string, dataUrl: string) => Promise<void>
  loadPdfThumbnail: (pdfId: string) => Promise<string | null>
  setCurrentPdfId: (id: string | null) => void
  setCurrentPage: (page: number) => void
  setTotalPages: (total: number) => void
  setZoom: (zoom: number) => void
  setReadingMode: (mode: 'light' | 'dark' | 'sepia' | 'eye-protection') => void
  setDictionaryWord: (word: string | null) => void
  setLeftPanelTab: (tab: 'notes' | 'dict') => void
  updatePdfProgress: (id: string, page: number, progress: number) => void

  addHighlight: (highlight: PdfHighlight) => void
  removeHighlight: (pdfId: string, highlightId: string) => void
  getHighlights: (pdfId: string) => PdfHighlight[]

  addNote: (note: PdfNote) => void
  updateNote: (noteId: string, text: string) => void
  removeNote: (pdfId: string, noteId: string) => void
  getNotes: (pdfId: string) => PdfNote[]

  addDictHistory: (word: string) => void
  removeDictHistory: (word: string) => void
  clearDictHistory: () => void
  toggleSavedWord: (word: string, partOfSpeech: string) => void
  isWordSaved: (word: string) => boolean
  cacheDefinition: (word: string, data: ApiDefinitionResponse) => void
}

export const usePdfReaderStore = create<PdfReaderState>()(
  persist(
    (set, get) => ({
      uploadedPdfs: [],
      highlights: {},
      notes: {},
      currentPdfId: null,
      currentPage: 0,
      totalPages: 0,
      zoom: 1,
      readingMode: 'dark',
      dictionaryWord: null,
      leftPanelTab: 'notes',
      pdfDataCache: {},
      dictHistory: [],
      savedWords: [],
      dictCache: {},
      pdfThumbnails: {},

      addPdf: async (pdf) => {
        const { dataUrl, ...meta } = pdf
        const updated = [meta, ...get().uploadedPdfs]
        set({ uploadedPdfs: updated })
        await savePdfData(pdf.id, dataUrl)
      },

      removePdf: async (id) => {
        const { uploadedPdfs, highlights, notes } = get()
        const newHighlights = { ...highlights }
        delete newHighlights[id]
        const newNotes = { ...notes }
        delete newNotes[id]
        const newThumbs = { ...get().pdfThumbnails }
        delete newThumbs[id]
        set({
          uploadedPdfs: uploadedPdfs.filter(p => p.id !== id),
          highlights: newHighlights,
          notes: newNotes,
          pdfThumbnails: newThumbs,
        })
        await deletePdfData(id)
        await deletePdfThumbnail(id)
      },

      loadPdfData: async (id) => {
        const cached = get().pdfDataCache[id]
        if (cached) return cached
        const dataUrl = await getPdfData(id)
        if (dataUrl) {
          set({ pdfDataCache: { ...get().pdfDataCache, [id]: dataUrl } })
        }
        return dataUrl
      },

      generateAndCacheThumbnail: async (pdfId, dataUrl) => {
        try {
          const base64 = dataUrl.startsWith('data:')
            ? atob(dataUrl.split(',')[1])
            : atob(dataUrl)
          const bytes = new Uint8Array(base64.length)
          for (let i = 0; i < base64.length; i++) bytes[i] = base64.charCodeAt(i)

          const doc = await pdfjsLib.getDocument({ data: bytes.buffer }).promise
          const page = await doc.getPage(1)
          const viewport = page.getViewport({ scale: 0.3 })

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          await page.render({ canvasContext: ctx, viewport }).promise

          const thumbnail = canvas.toDataURL('image/jpeg', 0.7)
          doc.destroy()

          set({ pdfThumbnails: { ...get().pdfThumbnails, [pdfId]: thumbnail } })
          await savePdfThumbnail(pdfId, thumbnail)
        } catch {
          // thumbnail generation failed — silently ignore, fallback icon will show
        }
      },

      loadPdfThumbnail: async (pdfId) => {
        const cached = get().pdfThumbnails[pdfId]
        if (cached) return cached
        const thumbnail = await getPdfThumbnail(pdfId)
        if (thumbnail) {
          set({ pdfThumbnails: { ...get().pdfThumbnails, [pdfId]: thumbnail } })
        }
        return thumbnail
      },

      setCurrentPdfId: (id) => set({ currentPdfId: id }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setTotalPages: (total) => set({ totalPages: total }),
      setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.5, zoom)) }),
      setReadingMode: (mode) => set({ readingMode: mode }),
      setDictionaryWord: (word) => set({ dictionaryWord: word }),
      setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),

      updatePdfProgress: (id, page, progress) => {
        const updated = get().uploadedPdfs.map(p =>
          p.id === id
            ? { ...p, lastReadPage: page, lastReadAt: new Date().toISOString(), progress }
            : p
        )
        set({ uploadedPdfs: updated })
      },

      addHighlight: (highlight) => {
        const { highlights } = get()
        const pdfHighlights = highlights[highlight.pdfId] || []
        set({ highlights: { ...highlights, [highlight.pdfId]: [...pdfHighlights, highlight] } })
      },

      removeHighlight: (pdfId, highlightId) => {
        const { highlights } = get()
        const pdfHighlights = (highlights[pdfId] || []).filter(h => h.id !== highlightId)
        set({ highlights: { ...highlights, [pdfId]: pdfHighlights } })
      },

      getHighlights: (pdfId) => get().highlights[pdfId] || [],

      addNote: (note) => {
        const { notes } = get()
        const pdfNotes = notes[note.pdfId] || []
        set({ notes: { ...notes, [note.pdfId]: [...pdfNotes, note] } })
      },

      updateNote: (noteId, text) => {
        const { notes } = get()
        const newNotes = { ...notes }
        for (const pdfId of Object.keys(newNotes)) {
          newNotes[pdfId] = newNotes[pdfId].map(n =>
            n.id === noteId ? { ...n, text, updatedAt: new Date().toISOString() } : n
          )
        }
        set({ notes: newNotes })
      },

      removeNote: (pdfId, noteId) => {
        const { notes } = get()
        const pdfNotes = (notes[pdfId] || []).filter(n => n.id !== noteId)
        set({ notes: { ...notes, [pdfId]: pdfNotes } })
      },

      getNotes: (pdfId) => get().notes[pdfId] || [],

      addDictHistory: (word) => {
        const normalized = word.toLowerCase().trim()
        const { dictHistory } = get()
        const filtered = dictHistory.filter(h => h.word !== normalized)
        const updated = [{ word: normalized, timestamp: Date.now() }, ...filtered].slice(0, 20)
        set({ dictHistory: updated })
      },

      removeDictHistory: (word) => {
        const normalized = word.toLowerCase().trim()
        set({ dictHistory: get().dictHistory.filter(h => h.word !== normalized) })
      },

      clearDictHistory: () => set({ dictHistory: [] }),

      toggleSavedWord: (word, partOfSpeech) => {
        const normalized = word.toLowerCase().trim()
        const { savedWords } = get()
        const exists = savedWords.find(w => w.word === normalized)
        if (exists) {
          set({ savedWords: savedWords.filter(w => w.word !== normalized) })
        } else {
          set({ savedWords: [{ word: normalized, partOfSpeech, savedAt: Date.now() }, ...savedWords] })
        }
      },

      isWordSaved: (word) => {
        return get().savedWords.some(w => w.word === word.toLowerCase().trim())
      },

      cacheDefinition: (word, data) => {
        set({ dictCache: { ...get().dictCache, [word.toLowerCase().trim()]: data } })
      },
    }),
    {
      name: 'neutron-pdf-reader',
      partialize: (state) => ({
        uploadedPdfs: state.uploadedPdfs.map(({ ...meta }) => meta),
        highlights: state.highlights,
        notes: state.notes,
        readingMode: state.readingMode,
        zoom: state.zoom,
        dictHistory: state.dictHistory,
        savedWords: state.savedWords,
      }),
    }
  )
)
