import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'
import ImageDropZone from '../ui/ImageDropZone'

const CATEGORIES = ['Raw Materials', 'Logistics & Storage', 'Manufacturing', 'Technology', 'Services', 'Buildings & Construction', 'Agriculture', 'Energy & Utilities', 'Real Estate']

interface RegisterCompanyModalProps {
  onClose: () => void
  onSubmit: (company: any) => void
}

export default function RegisterCompanyModal({ onClose, onSubmit }: RegisterCompanyModalProps) {
  const [form, setForm] = useState({
    name: '', handle: '', description: '', category: 'Raw Materials',
    email: '', phone: '', location: '', website: '',
    images: [] as string[],
    commodities: [] as { item: string; price: string }[],
  })
  const [newCommodity, setNewCommodity] = useState({ item: '', price: '' })

  const addCommodity = () => {
    if (newCommodity.item.trim() && newCommodity.price.trim()) {
      setForm(f => ({ ...f, commodities: [...f.commodities, { ...newCommodity }] }))
      setNewCommodity({ item: '', price: '' })
    }
  }

  const removeCommodity = (idx: number) => {
    setForm(f => ({ ...f, commodities: f.commodities.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = () => {
    if (!form.name.trim() || !form.handle.trim()) return
    onSubmit({
      ...form,
      handle: form.handle.startsWith('@') ? form.handle : `@${form.handle}`,
      logo: form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      rating: 0,
    })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.07)', background: '#0d1220',
    color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <AnimatePresence>
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
            background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18, width: '100%', maxWidth: 520,
            maxHeight: '90vh', overflow: 'auto',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>Register Company</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>List your business in the supplier directory</p>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.05)', color: '#6b7280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name + Handle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Company Name *</label>
                <input placeholder="Nexus Steel Corp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Handle *</label>
                <input placeholder="@nexus_steel" value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Description</label>
              <textarea
                placeholder="Brief description of your company and services..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Category *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: form.category === cat ? 'rgba(37,99,235,0.2)' : '#0d1220',
                      color: form.category === cat ? '#2563eb' : '#9ca3af',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>
                Product Images ({form.images.length}/6)
              </label>
              <ImageDropZone
                images={form.images}
                onImagesChange={(images) => setForm(f => ({ ...f, images }))}
                maxImages={6}
                maxFileSize={5 * 1024 * 1024}
              />
            </div>

            {/* Commodities */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Products / Services</label>
              {form.commodities.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 8, background: '#0d1220', marginBottom: 6,
                }}>
                  <span style={{ flex: 1, fontSize: 12, color: '#9ca3af' }}>{c.item}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{c.price}</span>
                  <button onClick={() => removeCommodity(i)} style={{
                    border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 2,
                  }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Product name"
                  value={newCommodity.item}
                  onChange={e => setNewCommodity(c => ({ ...c, item: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  placeholder="Price (e.g. $580/ton)"
                  value={newCommodity.price}
                  onChange={e => setNewCommodity(c => ({ ...c, price: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addCommodity()}
                  style={{ ...inputStyle, width: 140 }}
                />
                <button onClick={addCommodity} style={{
                  padding: '10px 12px', borderRadius: 10, border: 'none',
                  background: '#0d1220', color: '#9ca3af', cursor: 'pointer',
                }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Email</label>
                <input type="email" placeholder="sales@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Phone</label>
                <input placeholder="+1 (800) 555-0101" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Location</label>
                <input placeholder="City, State" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Website</label>
                <input placeholder="https://company.com" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px 20px', display: 'flex', gap: 12, justifyContent: 'flex-end',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <button onClick={onClose} style={{
              padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
              background: 'transparent', color: '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button onClick={handleSubmit} style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              Register Company
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
