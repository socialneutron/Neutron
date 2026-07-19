import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Search, Trash2, Clock, BookOpen } from 'lucide-react'
import { usePdfReaderStore, type UploadedPdfMeta } from '../../stores/pdfReaderStore'
import UploadPdfModal from './UploadPdfModal'
import PdfThumbnail from './PdfThumbnail'

const C = {
  bg: '#020617',
  card: '#0f172a',
  accent: '#00D2FF',
  accentHov: '#00b8d9',
  green: '#22c55e',
  purple: '#7c3aed',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
  error: '#ef4444',
}

interface PdfLibraryViewProps {
  onOpenReader: (pdf: UploadedPdfMeta) => void
}

export default function PdfLibraryView({ onOpenReader }: PdfLibraryViewProps) {
  const { uploadedPdfs, removePdf } = usePdfReaderStore()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const filtered = uploadedPdfs.filter(pdf => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return pdf.title.toLowerCase().includes(q) || pdf.author.toLowerCase().includes(q) || pdf.fileName.toLowerCase().includes(q)
  })

  const currentlyReading = uploadedPdfs
    .filter(p => p.progress > 0 && p.progress < 100)
    .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>PDF Reader</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
            {uploadedPdfs.length} {uploadedPdfs.length === 1 ? 'PDF' : 'PDFs'} · {currentlyReading.length} reading
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
            borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #00D2FF, #7928CA)',
            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            transition: 'opacity 0.15s', whiteSpace: 'nowrap',
          }}
        >
          <Upload size={14} /> Upload PDF
        </button>
      </div>

      {/* Currently Reading */}
      {currentlyReading.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#fff' }}>Continue Reading</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentlyReading.map(pdf => (
              <motion.div
                key={pdf.id}
                whileHover={{ borderColor: `${C.accent}40` }}
                onClick={() => onOpenReader(pdf)}
                style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 16, padding: '16px 20px',
                  display: 'flex', gap: 16, alignItems: 'center',
                  cursor: 'pointer', transition: 'border-color 0.2s',
                }}
              >
                <div style={{
                  width: 64, height: 80, borderRadius: 8, overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  <PdfThumbnail pdfId={pdf.id} size={64} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pdf.title}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>{pdf.author}</p>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>Progress</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>{pdf.progress}%</span>
                    </div>
                    <div style={{ height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pdf.progress}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{ height: '100%', background: `linear-gradient(90deg, ${C.accent}, #7928CA)`, borderRadius: 2 }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Clock size={10} color={C.muted} />
                    <span style={{ fontSize: 10, color: C.muted }}>Last read {formatDate(pdf.lastReadAt)}</span>
                  </div>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `linear-gradient(135deg, ${C.accent}, #7928CA)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <BookOpen size={18} color="#fff" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {uploadedPdfs.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={16} color={C.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search your PDFs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px 11px 38px', borderRadius: 10,
              border: `1px solid ${C.border}`, background: '#0d1220',
              color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
      )}

      {/* All PDFs */}
      <div>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#fff' }}>All PDFs</h3>
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {filtered.map(pdf => (
              <motion.div
                key={pdf.id}
                whileHover={{ y: -4, borderColor: `${C.accent}40` }}
                style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                  transition: 'border-color 0.2s', position: 'relative',
                }}
                onClick={() => onOpenReader(pdf)}
              >
                <div style={{ position: 'relative', paddingTop: '130%', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                    <PdfThumbnail pdfId={pdf.id} />
                  </div>
                  <span style={{
                    position: 'absolute', bottom: 8, left: 8,
                    fontSize: 10, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  }}>
                    {pdf.totalPages} pages
                  </span>
                  {pdf.progress > 0 && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: pdf.progress >= 100 ? C.green : 'rgba(0,0,0,0.7)',
                      borderRadius: 6, padding: '3px 6px',
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
                        {pdf.progress >= 100 ? 'Done' : `${pdf.progress}%`}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <h4 style={{
                    margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {pdf.title}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted }}>{pdf.author}</p>
                  {pdf.progress > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 3, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pdf.progress}%`,
                          background: `linear-gradient(90deg, ${C.accent}, #7928CA)`, borderRadius: 2,
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); setShowDeleteConfirm(pdf.id) }}
                  style={{
                    position: 'absolute', top: 8, left: 8,
                    width: 24, height: 24, borderRadius: 6, border: 'none',
                    background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: C.muted }}>
            <BookOpen size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No PDFs yet</p>
            <p style={{ fontSize: 13, marginBottom: 20 }}>Upload a PDF to start reading</p>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #00D2FF, #7928CA)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', margin: '0 auto',
              }}
            >
              <Upload size={16} /> Upload PDF
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: 24, maxWidth: 360, width: '100%',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Delete PDF?</h3>
              <p style={{ margin: 0, fontSize: 13, color: C.muted, marginBottom: 20 }}>
                This will permanently remove the PDF and all its highlights and notes.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={() => { if (showDeleteConfirm) { removePdf(showDeleteConfirm).then(() => setShowDeleteConfirm(null)) } }}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: C.error, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadPdfModal onClose={() => setShowUploadModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
