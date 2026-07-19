import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Sun, Moon, Eye, BookOpen,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
} from 'lucide-react'
import PdfViewer from './PdfViewer'
import LeftPanel from './LeftPanel'
import HighlightToolbar from './HighlightToolbar'
import { usePdfReaderStore, type UploadedPdfMeta } from '../../stores/pdfReaderStore'

const C = {
  bg: '#020617',
  card: '#0f172a',
  accent: '#00D2FF',
  purple: '#7928CA',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

const READING_MODES = [
  { id: 'light' as const, label: 'Light', icon: <Sun size={16} />, bg: '#ffffff', text: '#1a1a1a' },
  { id: 'dark' as const, label: 'Dark', icon: <Moon size={16} />, bg: '#1a1a2e', text: '#e0e0e0' },
  { id: 'eye-protection' as const, label: 'Eye Care', icon: <Eye size={16} />, bg: '#fef9e7', text: '#5d4e37' },
  { id: 'sepia' as const, label: 'Sepia', icon: <BookOpen size={16} />, bg: '#f4ecd8', text: '#5b4636' },
]

interface PdfReaderScreenProps {
  pdf: UploadedPdfMeta
  onClose: () => void
}

export default function PdfReaderScreen({ pdf, onClose }: PdfReaderScreenProps) {
  const {
    currentPage, totalPages, zoom, readingMode,
    setCurrentPage, setZoom, setReadingMode, updatePdfProgress,
    setDictionaryWord, setLeftPanelTab, addHighlight, loadPdfData,
  } = usePdfReaderStore()

  const [showModeSelector, setShowModeSelector] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false)
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0 })
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoadingData(true)
    loadPdfData(pdf.id).then(url => {
      if (!cancelled) {
        setDataUrl(url)
        setLoadingData(false)
      }
    })
    return () => { cancelled = true }
  }, [pdf.id])

  useEffect(() => {
    setCurrentPage(pdf.lastReadPage || 0)
  }, [pdf.id])

  const modeConfig = READING_MODES.find(m => m.id === readingMode) || READING_MODES[1]

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    const progress = Math.round(((newPage + 1) / (totalPages || pdf.totalPages)) * 100)
    updatePdfProgress(pdf.id, newPage, progress)
  }

  const handleTextSelection = useCallback((text: string, rect: { x: number; y: number; width: number; height: number }) => {
    setSelectedText(text)
    setHighlightPosition({ x: rect.x, y: rect.y })
    setShowHighlightToolbar(true)
  }, [])

  const handleAddHighlight = (color: string) => {
    if (!selectedText) return
    addHighlight({
      id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pdfId: pdf.id,
      page: currentPage,
      text: selectedText,
      color,
      createdAt: new Date().toISOString(),
    })
    setShowHighlightToolbar(false)
    setSelectedText('')
    window.getSelection()?.removeAllRanges()
  }

  const handleLookupWord = () => {
    if (!selectedText) return
    setDictionaryWord(selectedText.split(/\s+/)[0])
    setLeftPanelTab('dict')
    setShowHighlightToolbar(false)
    setSelectedText('')
    window.getSelection()?.removeAllRanges()
  }

  if (loadingData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: modeConfig.bg, color: modeConfig.text,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `3px solid ${C.border}`, borderTopColor: C.accent,
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ fontSize: 13, color: C.muted }}>Loading PDF...</p>
      </motion.div>
    )
  }

  if (!dataUrl) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: modeConfig.bg, color: modeConfig.text,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
        }}
      >
        <p style={{ fontSize: 14, color: C.muted }}>Failed to load PDF data.</p>
        <button onClick={onClose} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          Go Back
        </button>
      </motion.div>
    )
  }

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
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 8, border: 'none',
          background: 'rgba(255,255,255,0.1)', color: modeConfig.text,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowLeft size={18} />
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{pdf.title}</h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, opacity: 0.6 }}>{pdf.author}</p>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setZoom(zoom - 0.2)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: modeConfig.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ZoomOut size={14} />
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, minWidth: 36, justifyContent: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(zoom + 0.2)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: modeConfig.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ZoomIn size={14} />
          </button>

          {/* Mode Selector */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowModeSelector(!showModeSelector)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: modeConfig.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    borderRadius: 12, padding: 8, zIndex: 100, minWidth: 120,
                  }}
                >
                  {READING_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => { setReadingMode(mode.id); setShowModeSelector(false) }}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: 'none', cursor: 'pointer',
                        background: readingMode === mode.id ? `${C.accent}20` : 'transparent',
                        color: readingMode === mode.id ? C.accent : C.text,
                        fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                      }}
                    >
                      {mode.icon} {mode.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <LeftPanel pdfId={pdf.id} currentPage={currentPage} />
        <PdfViewer
          dataUrl={dataUrl}
          onPageChange={handlePageChange}
          onSelectionChange={handleTextSelection}
        />
      </div>

      {/* Bottom Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 16px', borderTop: `1px solid ${C.border}`,
        background: `${modeConfig.bg}ee`, backdropFilter: 'blur(8px)', gap: 16,
        flexShrink: 0,
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
          {currentPage + 1} / {totalPages || pdf.totalPages}
        </div>
        <button
          onClick={() => handlePageChange(Math.min((totalPages || pdf.totalPages) - 1, currentPage + 1))}
          disabled={currentPage >= (totalPages || pdf.totalPages) - 1}
          style={{
            width: 36, height: 36, borderRadius: 8, border: 'none',
            background: currentPage >= (totalPages || pdf.totalPages) - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            color: currentPage >= (totalPages || pdf.totalPages) - 1 ? 'rgba(255,255,255,0.3)' : modeConfig.text,
            cursor: currentPage >= (totalPages || pdf.totalPages) - 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronRight size={18} />
        </button>
        <div style={{ marginLeft: 16, minWidth: 100 }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${((currentPage + 1) / (totalPages || pdf.totalPages)) * 100}%`,
              background: `linear-gradient(90deg, ${C.accent}, ${C.purple})`,
              borderRadius: 2,
            }} />
          </div>
        </div>
      </div>

      {/* Highlight Toolbar Popup */}
      <AnimatePresence>
        {showHighlightToolbar && (
          <HighlightToolbar
            position={highlightPosition}
            onHighlight={handleAddHighlight}
            onLookup={handleLookupWord}
            onClose={() => { setShowHighlightToolbar(false); setSelectedText('') }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
