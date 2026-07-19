import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, FileText, AlertCircle, Check, Image, Trash2 } from 'lucide-react'
import { useEbookStore } from '../../stores/ebookStore'
import { pdfjsLib } from '../../lib/pdfjs'
import type { Ebook } from '../../types/database'

const C = {
  bg: '#0f172a',
  card: '#1e293b',
  accent: '#2563eb',
  accentHov: '#1d4ed8',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
  error: '#ef4444',
}

const CATEGORIES = ['News', 'Business', 'Technology', 'Lifestyle', 'Science', 'Entertainment', 'Scientific Papers']

interface PublishModalProps {
  onClose: () => void
}

export default function PublishModal({ onClose }: PublishModalProps) {
  const addPublishedEbook = useEbookStore(s => s.addPublishedEbook)

  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('Technology')
  const [description, setDescription] = useState('')
  const [pageCount, setPageCount] = useState(0)
  const [isFree, setIsFree] = useState(true)
  const [coverMode, setCoverMode] = useState<'auto' | 'custom'>('auto')
  const [customCover, setCustomCover] = useState<string | null>(null)
  const [autoCover, setAutoCover] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handlePdfFile = async (file: File) => {
    setError(null)
    if (file.type !== 'application/pdf') { setError('Only PDF files are allowed'); return }
    if (file.size > 50 * 1024 * 1024) { setError('File size must be less than 50MB'); return }

    setPdfFile(file)
    if (!title) setTitle(file.name.replace('.pdf', '').replace(/[-_]/g, ' '))

    // Auto-detect page count + generate cover from page 1
    try {
      const arrayBuffer = await file.arrayBuffer()
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      setPageCount(doc.numPages)

      const page = await doc.getPage(1)
      const viewport = page.getViewport({ scale: 0.5 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvasContext: ctx, viewport }).promise
      setAutoCover(canvas.toDataURL('image/jpeg', 0.8))
      doc.destroy()
    } catch {
      // silently ignore — user can still upload a custom cover
    }
  }

  const handleCoverUpload = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Cover must be an image file'); return }
    const reader = new FileReader()
    reader.onload = (e) => setCustomCover(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!pdfFile || !title.trim()) return
    setIsProcessing(true)
    setError(null)

    const coverUrl = coverMode === 'custom' && customCover ? customCover : autoCover || ''

    const newEbook: Ebook = {
      id: `pub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      author: author.trim() || 'Unknown',
      description: description.trim() || 'No description provided.',
      cover_url: coverUrl,
      price: isFree ? 0 : 4.99,
      category,
      pages: pageCount,
      file_url: '',
      sample_url: '',
      rating: 0,
      sales_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    addPublishedEbook(newEbook)
    setIsProcessing(false)
    setSuccess(true)
    setTimeout(() => onClose(), 1200)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: `1px solid ${C.border}`, background: '#0d1220',
    color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }

  const activeCover = coverMode === 'custom' ? customCover : autoCover

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>Publish Magazine</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>Share your content with the community</p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* PDF Upload */}
          <div
            onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }}
            onDragLeave={e => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget.contains(e.relatedTarget as Node)) return; setIsDragging(false) }}
            onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files.length > 0) handlePdfFile(e.dataTransfer.files[0]) }}
            onClick={() => pdfInputRef.current?.click()}
            style={{
              cursor: 'pointer', borderRadius: 12, border: `2px dashed ${isDragging ? C.accent : C.border}`,
              padding: '24px 20px', textAlign: 'center',
              background: isDragging ? `${C.accent}10` : '#0d1220', transition: 'all 0.2s',
            }}
          >
            <input ref={pdfInputRef} type="file" accept=".pdf" onChange={e => { const f = e.target.files; if (f && f.length > 0) handlePdfFile(f[0]); e.target.value = '' }} style={{ display: 'none' }} />
            {pdfFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <FileText size={24} color={C.green} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>{pdfFile.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
                  {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB · {pageCount} pages
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Upload size={24} color={C.muted} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>Drop PDF here or click to browse</p>
                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>PDF files up to 50MB</p>
              </div>
            )}
          </div>

          {/* Cover Image */}
          {pdfFile && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Cover Image</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button
                  onClick={() => setCoverMode('auto')}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${coverMode === 'auto' ? C.accent : C.border}`,
                    background: coverMode === 'auto' ? `${C.accent}15` : 'transparent',
                    color: coverMode === 'auto' ? C.accent : C.muted,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <FileText size={12} /> Auto from PDF
                </button>
                <button
                  onClick={() => setCoverMode('custom')}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${coverMode === 'custom' ? C.accent : C.border}`,
                    background: coverMode === 'custom' ? `${C.accent}15` : 'transparent',
                    color: coverMode === 'custom' ? C.accent : C.muted,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Image size={12} /> Upload Custom
                </button>
              </div>

              {coverMode === 'custom' && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    style={{
                      width: 80, height: 106, borderRadius: 8, border: `2px dashed ${C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', background: '#0d1220', flexShrink: 0, overflow: 'hidden',
                    }}
                  >
                    <input ref={coverInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files; if (f && f.length > 0) handleCoverUpload(f[0]); e.target.value = '' }} style={{ display: 'none' }} />
                    {customCover ? (
                      <img src={customCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Image size={16} color={C.muted} />
                        <p style={{ margin: '4px 0 0', fontSize: 9, color: C.muted }}>Upload</p>
                      </div>
                    )}
                  </div>
                  {customCover && (
                    <button
                      onClick={() => setCustomCover(null)}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: 'none',
                        background: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4,
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}

              {coverMode === 'auto' && activeCover && (
                <div style={{ width: 80, height: 106, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                  <img src={activeCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Title *</label>
            <input placeholder="Enter magazine title" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </div>

          {/* Author */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Author / Publisher</label>
            <input placeholder="Enter author or publisher name" value={author} onChange={e => setAuthor(e.target.value)} style={inputStyle} />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Category</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '6px 12px', borderRadius: 16, border: 'none',
                    background: category === cat ? C.accent : 'rgba(255,255,255,0.05)',
                    color: category === cat ? '#fff' : C.muted,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Description (optional)</label>
            <textarea
              placeholder="Brief summary of the magazine or paper..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{
                ...inputStyle, resize: 'none', minHeight: 70,
              }}
            />
          </div>

          {/* Price toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>Pricing</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>
                {isFree ? 'This magazine will be free to read' : 'Readers will pay $4.99'}
              </p>
            </div>
            <button
              onClick={() => setIsFree(!isFree)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: isFree ? C.green : 'rgba(255,255,255,0.15)',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: isFree ? 3 : 23,
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: `${C.error}15`, border: `1px solid ${C.error}30` }}>
              <AlertCircle size={16} color={C.error} />
              <p style={{ margin: 0, fontSize: 12, color: C.error }}>{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: `${C.green}15`, border: `1px solid ${C.green}30` }}>
              <Check size={16} color={C.green} />
              <p style={{ margin: 0, fontSize: 12, color: C.green }}>Magazine published successfully!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px 20px', display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!pdfFile || !title.trim() || isProcessing || success}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: (!pdfFile || !title.trim() || isProcessing || success) ? '#374151' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: (!pdfFile || !title.trim() || isProcessing || success) ? 'not-allowed' : 'pointer',
              opacity: (!pdfFile || !title.trim() || isProcessing || success) ? 0.5 : 1,
            }}
          >
            {isProcessing ? 'Publishing...' : success ? 'Published!' : 'Publish'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
