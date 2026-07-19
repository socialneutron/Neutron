import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const C = {
  bg: '#090914',
  card: '#111827',
  accent: '#2563eb',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
  green: '#22c55e',
}

const CATEGORY_COLORS: Record<string, string> = {
  'Raw Materials': '#2563eb',
  'Logistics & Storage': '#7c3aed',
  'Manufacturing': '#059669',
  'Services': '#d97706',
  'Technology': '#06b6d4',
  Electronics: '#2563eb',
  Furniture: '#7c3aed',
  Tools: '#ea580c',
  Clothing: '#ec4899',
  'Self-Help': '#22c55e',
  Business: '#2563eb',
  Productivity: '#7c3aed',
  Finance: '#f59e0b',
  Fiction: '#ec4899',
  News: '#ef4444',
  Lifestyle: '#f97316',
  Science: '#10b981',
  Entertainment: '#e879f9',
  'Scientific Papers': '#6366f1',
}

interface Props {
  open: boolean
  type: 'company' | 'product' | 'ebook'
  data: any
  onClose: () => void
  onSaved: () => void
}

export default function EditListingModal({ open, type, data, onClose, onSaved }: Props) {
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (data) {
      setForm({ ...data })
    }
  }, [data])

  if (!open || !data) return null

  const set = (key: string, val: any) => setForm((prev: any) => ({ ...prev, [key]: val }))

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: `1px solid ${C.border}`, background: C.card,
    color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: C.muted,
    display: 'block', marginBottom: 6,
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const table = type === 'company' ? 'companies' : type === 'product' ? 'products' : 'ebooks'
      const { error: err } = await supabase.from(table).update(form).eq('id', form.id)
      if (err) throw err
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 500, maxHeight: '85vh', background: C.bg,
            borderRadius: 16, border: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
              Edit {type === 'company' ? 'Supplier' : type === 'product' ? 'Product' : 'Magazine'}
            </h3>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4,
            }}>
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {type === 'company' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Company Name</label>
                  <input value={form.name || ''} onChange={e => set('name', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Category</label>
                  <select value={form.category || ''} onChange={e => set('category', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Location</label>
                  <input value={form.location || ''} onChange={e => set('location', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Website</label>
                  <input value={form.website || ''} onChange={e => set('website', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, marginBottom: 14 }}>
                    <label style={labelStyle}>Email</label>
                    <input value={form.email || ''} onChange={e => set('email', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1, marginBottom: 14 }}>
                    <label style={labelStyle}>Phone</label>
                    <input value={form.phone || ''} onChange={e => set('phone', e.target.value)} style={inputStyle} />
                  </div>
                </div>
              </>
            )}

            {type === 'product' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Product Name</label>
                  <input value={form.name || ''} onChange={e => set('name', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Category</label>
                    <select value={form.category || ''} onChange={e => set('category', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Condition</label>
                    <select value={form.condition || 'new'} onChange={e => set('condition', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Price ($)</label>
                    <input type="number" value={form.price || ''} onChange={e => set('price', Number(e.target.value))} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Stock</label>
                    <input type="number" value={form.stock || ''} onChange={e => set('stock', Number(e.target.value))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Location</label>
                  <input value={form.location || ''} onChange={e => set('location', e.target.value)} style={inputStyle} />
                </div>
              </>
            )}

            {type === 'ebook' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Title</label>
                  <input value={form.title || ''} onChange={e => set('title', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Author</label>
                  <input value={form.author || ''} onChange={e => set('author', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Category</label>
                  <select value={form.category || ''} onChange={e => set('category', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, marginBottom: 14 }}>
                    <label style={labelStyle}>Price ($)</label>
                    <input type="number" value={form.price || ''} onChange={e => set('price', Number(e.target.value))} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1, marginBottom: 14 }}>
                    <label style={labelStyle}>Pages</label>
                    <input type="number" value={form.pages || ''} onChange={e => set('pages', Number(e.target.value))} style={inputStyle} />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444', fontSize: 12, marginBottom: 14,
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 20px', borderTop: `1px solid ${C.border}`,
            display: 'flex', gap: 10, justifyContent: 'flex-end',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: C.green, color: '#fff', fontSize: 13,
                fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
