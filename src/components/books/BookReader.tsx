import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Sun, Moon, Eye, BookOpen, Search, Settings,
  ChevronLeft, ChevronRight, Highlighter, X
} from 'lucide-react'
import ReaderSettings from './ReaderSettings'
import DictionaryPopup from './DictionaryPopup'
import HighlightToolbar from './HighlightToolbar'
import { useBookReaderStore, type ReadingMode, type InteractionMode } from '../../stores/bookReaderStore'
import { useEbookStore } from '../../stores/ebookStore'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'

const C = {
  bg: '#020617',
  card: '#0f172a',
  accent: '#00D2FF',
  accentHov: '#00b8d9',
  green: '#22c55e',
  purple: '#7928CA',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

const READING_MODES: { id: ReadingMode; label: string; icon: React.ReactNode; bg: string; text: string }[] = [
  { id: 'light', label: 'Light', icon: <Sun size={16} />, bg: '#ffffff', text: '#1a1a1a' },
  { id: 'dark', label: 'Dark', icon: <Moon size={16} />, bg: '#1a1a2e', text: '#e0e0e0' },
  { id: 'eye-protection', label: 'Eye Care', icon: <Eye size={16} />, bg: '#fef9e7', text: '#5d4e37' },
  { id: 'sepia', label: 'Sepia', icon: <BookOpen size={16} />, bg: '#f4ecd8', text: '#5b4636' },
]

interface BookReaderProps {
  bookId: string
  onClose: () => void
}

export default function BookReader({ bookId, onClose }: BookReaderProps) {
  const { user } = useSupabaseAuth()
  const { userEbooks, updateProgress, addHighlight, removeHighlight } = useEbookStore()
  const {
    currentPage,
    readingMode,
    interactionMode,
    fontSize,
    lineHeight,
    fontFamily,
    showHighlightsPanel,
    setCurrentPage,
    setTotalPages,
    setReadingMode,
    setInteractionMode,
    setShowHighlightsPanel,
    goToNextPage,
    goToPreviousPage,
  } = useBookReaderStore()

  const [showSettings, setShowSettings] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false)
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0 })
  const [dictionaryWord, setDictionaryWord] = useState('')
  const [showDictionary, setShowDictionary] = useState(false)
  const [dictionaryPosition, setDictionaryPosition] = useState({ x: 0, y: 0 })

  const userEbook = userEbooks.find(ue => ue.ebook_id === bookId)
  const ebook = userEbook?.ebook
  const highlights = userEbook?.highlights || []

  // Sample book content (in real app, this would come from PDF parsing)
  const samplePages = [
    `Chapter 1: The Power of Habit

Habits are the compound interest of self-improvement. The same way that money multiplies through compound interest, the effects of your habits multiply as you repeat them. They seem to make little difference on any given day and yet the impact they deliver over the months and years can be enormous. It is only when looking back two, five, or perhaps ten years later that the value of good habits and the cost of bad ones becomes strikingly apparent.`,
    `Chapter 2: How Habits Work

The Habit Loop is a neurological loop that governs any habit. The loop consists of three elements: a cue, a routine, and a reward. The cue triggers the brain to choose which habit to use. The routine is the habit itself. The reward helps your brain figure out if this particular loop is worth remembering for the future.`,
    `Chapter 3: The Golden Rule of Habit Change

The Golden Rule of Habit Change says: You can't extinguish a bad habit, you can only change it. The key to changing a bad habit is to keep the old cue and deliver the old reward, but insert a new routine. The cue and the reward stay the same while the routine changes.`,
    `Chapter 4: The Habit Loop in Business

Organizations succeed not because of what they know but because of how they behave. The habits of organizations are the collective habits of the people within them. Companies that understand how to use the Habit Loop can create the right habits in their employees.`,
    `Chapter 5: Keystone Habits

Some habits matter more than others in remaking businesses and lives. These are "keystone habits" — the habits that matter most. When keystone habits change, they set off a chain reaction that helps other good habits take hold. Exercise is a keystone habit. When people start exercising regularly, they start changing other unrelated patterns as well.`,
  ]

  const totalPagesCount = samplePages.length

  useEffect(() => {
    setTotalPages(totalPagesCount)
    if (userEbook) {
      const savedPage = Math.floor((userEbook.progress / 100) * totalPagesCount)
      setCurrentPage(savedPage)
    }
  }, [bookId])

  const currentPageContent = samplePages[currentPage] || samplePages[0]

  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      setSelectedText(text)

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setHighlightPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      })

      if (interactionMode === 'dictionary') {
        setDictionaryWord(text)
        setDictionaryPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 10,
        })
        setShowDictionary(true)
      } else {
        setShowHighlightToolbar(true)
      }
    }
  }, [interactionMode])

  const handleAddHighlight = async (color: string) => {
    if (!user?.id || !bookId || !selectedText) return

    await addHighlight(user.id, bookId, {
      page: currentPage,
      text: selectedText,
      color,
    })

    setShowHighlightToolbar(false)
    setSelectedText('')
    window.getSelection()?.removeAllRanges()
  }

  const handleRemoveHighlight = async (highlightId: string) => {
    if (!user?.id || !bookId) return
    await removeHighlight(user.id, bookId, highlightId)
  }

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage)
    const progress = Math.round((newPage / totalPagesCount) * 100)
    if (user?.id && bookId) {
      await updateProgress(user.id, bookId, progress)
    }
  }

  const getFontFamily = () => {
    switch (fontFamily) {
      case 'serif': return 'Georgia, serif'
      case 'mono': return 'Courier New, monospace'
      default: return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  }

  const modeConfig = READING_MODES.find(m => m.id === readingMode) || READING_MODES[1]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: modeConfig.bg, color: modeConfig.text,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
        background: `${modeConfig.bg}ee`, backdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.1)', color: modeConfig.text,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
            {ebook?.title || 'Book'}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, opacity: 0.6 }}>
            {ebook?.author || 'Unknown'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Mode Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: 'rgba(255,255,255,0.1)', color: modeConfig.text,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {modeConfig.icon}
            </button>
            <AnimatePresence>
              {showModeSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: 8, zIndex: 100,
                    minWidth: 140,
                  }}
                >
                  {READING_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setReadingMode(mode.id)
                        setShowModeSelector(false)
                      }}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: 'none', cursor: 'pointer',
                        background: readingMode === mode.id ? `${C.accent}20` : 'transparent',
                        color: readingMode === mode.id ? C.accent : C.text,
                        fontSize: 12, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 8,
                        textAlign: 'left',
                      }}
                    >
                      {mode.icon}
                      {mode.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interaction Mode */}
          <button
            onClick={() => setInteractionMode(interactionMode === 'dictionary' ? 'reading' : 'dictionary')}
            style={{
              width: 36, height: 36, borderRadius: 8, border: 'none',
              background: interactionMode === 'dictionary' ? `${C.accent}30` : 'rgba(255,255,255,0.1)',
              color: interactionMode === 'dictionary' ? C.accent : modeConfig.text,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Search size={16} />
          </button>

          {/* Highlights */}
          <button
            onClick={() => setShowHighlightsPanel(!showHighlightsPanel)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: 'none',
              background: showHighlightsPanel ? `${C.purple}30` : 'rgba(255,255,255,0.1)',
              color: showHighlightsPanel ? C.purple : modeConfig.text,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Highlighter size={16} />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: 'none',
              background: showSettings ? `${C.green}30` : 'rgba(255,255,255,0.1)',
              color: showSettings ? C.green : modeConfig.text,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Book Content */}
        <div
          style={{
            flex: 1, overflow: 'auto', padding: '32px 24px',
            maxWidth: 700, margin: '0 auto', width: '100%',
          }}
          onMouseUp={handleTextSelect}
        >
          <div style={{
            fontSize,
            lineHeight,
            fontFamily: getFontFamily(),
            whiteSpace: 'pre-wrap',
          }}>
            {currentPageContent}
          </div>
        </div>

        {/* Highlights Panel */}
        <AnimatePresence>
          {showHighlightsPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              style={{
                borderLeft: `1px solid ${C.border}`,
                background: `${modeConfig.bg}ee`,
                overflow: 'hidden',
              }}
            >
              <div style={{ width: 280, padding: '16px', height: '100%', overflow: 'auto' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>
                  Highlights ({highlights.length})
                </h4>
                {highlights.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {highlights.map(h => (
                      <div
                        key={h.id}
                        style={{
                          padding: '10px 12px', borderRadius: 8,
                          background: `${h.color}15`, border: `1px solid ${h.color}30`,
                          position: 'relative',
                        }}
                      >
                        <button
                          onClick={() => handleRemoveHighlight(h.id)}
                          style={{
                            position: 'absolute', top: 6, right: 6,
                            width: 18, height: 18, borderRadius: 4,
                            border: 'none', background: 'rgba(0,0,0,0.3)',
                            color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <X size={10} />
                        </button>
                        <p style={{
                          margin: 0, fontSize: 12, lineHeight: 1.4,
                          borderLeft: `3px solid ${h.color}`,
                          paddingLeft: 8,
                        }}>
                          {h.text.length > 100 ? h.text.substring(0, 100) + '...' : h.text}
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: 10, opacity: 0.6 }}>
                          Page {h.page + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, opacity: 0.6, textAlign: 'center', marginTop: 40 }}>
                    No highlights yet. Select text to highlight.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 16px', borderTop: `1px solid ${C.border}`,
        background: `${modeConfig.bg}ee`, backdropFilter: 'blur(8px)',
        gap: 16,
      }}>
        <button
          onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          style={{
            width: 36, height: 36, borderRadius: 8, border: 'none',
            background: currentPage === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            color: currentPage === 0 ? 'rgba(255,255,255,0.3)' : modeConfig.text,
            cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {currentPage + 1} / {totalPagesCount}
        </div>

        <button
          onClick={() => handlePageChange(Math.min(totalPagesCount - 1, currentPage + 1))}
          disabled={currentPage === totalPagesCount - 1}
          style={{
            width: 36, height: 36, borderRadius: 8, border: 'none',
            background: currentPage === totalPagesCount - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            color: currentPage === totalPagesCount - 1 ? 'rgba(255,255,255,0.3)' : modeConfig.text,
            cursor: currentPage === totalPagesCount - 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronRight size={18} />
        </button>

        {/* Progress */}
        <div style={{ marginLeft: 16, minWidth: 100 }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${((currentPage + 1) / totalPagesCount) * 100}%`,
              background: `linear-gradient(90deg, ${C.accent}, ${C.purple})`,
              borderRadius: 2,
            }} />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <ReaderSettings onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* Highlight Toolbar */}
      <AnimatePresence>
        {showHighlightToolbar && (
          <HighlightToolbar
            position={highlightPosition}
            onHighlight={handleAddHighlight}
            onClose={() => {
              setShowHighlightToolbar(false)
              setSelectedText('')
            }}
          />
        )}
      </AnimatePresence>

      {/* Dictionary Popup */}
      <AnimatePresence>
        {showDictionary && (
          <DictionaryPopup
            word={dictionaryWord}
            position={dictionaryPosition}
            onClose={() => {
              setShowDictionary(false)
              setDictionaryWord('')
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}