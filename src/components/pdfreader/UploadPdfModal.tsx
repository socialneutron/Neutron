import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, AlertCircle, Check } from 'lucide-react'
import { usePdfReaderStore } from '../../stores/pdfReaderStore'
import { pdfjsLib } from '../../lib/pdfjs'

const C = {
  bg: '#0f172a',
  card: '#1e293b',
  accent: '#00D2FF',
  accentHov: '#00b8d9',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
  error: '#ef4444',
}

interface UploadPdfModalProps {
  onClose: () => void
  onUploaded?: (pdfId: string) => void
}

export default function UploadPdfModal({ onClose, onUploaded }: UploadPdfModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addPdf = usePdfReaderStore(s => s.addPdf)
  const generateAndCacheThumbnail = usePdfReaderStore(s => s.generateAndCacheThumbnail)

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') return 'Only PDF files are allowed'
    if (file.size > 50 * 1024 * 1024) return 'File size must be less than 50MB'
    return null
  }

  const handleFile = (selectedFile: File) => {
    setError(null)
    const validationError = validateFile(selectedFile)
    if (validationError) { setError(validationError); return }
    setFile(selectedFile)
    if (!title) {
      setTitle(selectedFile.name.replace('.pdf', '').replace(/[-_]/g, ' '))
    }
  }

  const handleSubmit = async () => {
    if (!file || !title.trim()) return
    setIsUploading(true)
    setError(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const id = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

        const loadingTask = pdfjsLib.getDocument({ data: atob(base64.split(',')[1] || base64) })
        const pdf = await loadingTask.promise

        addPdf({
          id,
          title: title.trim(),
          author: author.trim() || 'Unknown',
          fileName: file.name,
          dataUrl: base64,
          totalPages: pdf.numPages,
          uploadedAt: new Date().toISOString(),
          lastReadAt: new Date().toISOString(),
          lastReadPage: 0,
          progress: 0,
        })

        generateAndCacheThumbnail(id, base64)

        setIsUploading(false)
        setSuccess(true)
        setTimeout(() => {
          onClose()
          if (onUploaded) onUploaded(id)
        }, 1200)
      }
      reader.onerror = () => { setError('Failed to read PDF file'); setIsUploading(false) }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Failed to process PDF')
      setIsUploading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: `1px solid ${C.border}`, background: '#0d1220',
    color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }

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
          borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto',
        }}
      >
        <div style={{
          padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>Upload PDF</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>Add a PDF to your reader library</p>
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
          <div
            onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }}
            onDragLeave={e => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget.contains(e.relatedTarget as Node)) return; setIsDragging(false) }}
            onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              cursor: 'pointer', borderRadius: 12, border: `2px dashed ${isDragging ? C.accent : C.border}`,
              padding: '32px 24px', textAlign: 'center',
              background: isDragging ? `${C.accent}10` : '#0d1220', transition: 'all 0.2s',
            }}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={e => { const f = e.target.files; if (f && f.length > 0) handleFile(f[0]); e.target.value = '' }} style={{ display: 'none' }} />
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.green}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} color={C.green} />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{file.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={24} color={C.muted} />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>Drop PDF here or click to browse</p>
                <p style={{ margin: 0, fontSize: 12, color: C.muted }}>PDF files up to 50MB</p>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Title *</label>
            <input placeholder="Enter PDF title" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Author</label>
            <input placeholder="Enter author name" value={author} onChange={e => setAuthor(e.target.value)} style={inputStyle} />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: `${C.error}15`, border: `1px solid ${C.error}30` }}>
              <AlertCircle size={16} color={C.error} />
              <p style={{ margin: 0, fontSize: 12, color: C.error }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: `${C.green}15`, border: `1px solid ${C.green}30` }}>
              <Check size={16} color={C.green} />
              <p style={{ margin: 0, fontSize: 12, color: C.green }}>PDF added to your library!</p>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px 20px', display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || !title.trim() || isUploading || success}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: (!file || !title.trim() || isUploading || success) ? '#374151' : 'linear-gradient(135deg, #00D2FF, #7928CA)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: (!file || !title.trim() || isUploading || success) ? 'not-allowed' : 'pointer',
              opacity: (!file || !title.trim() || isUploading || success) ? 0.5 : 1,
            }}
          >
            {isUploading ? 'Processing...' : success ? 'Added!' : 'Add to Library'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
