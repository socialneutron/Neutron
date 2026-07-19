import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import ImageDropZone from '../ui/ImageDropZone'

const CATEGORIES = ['Electronics', 'Furniture', 'Tools', 'Clothing', 'Home', 'Sports', 'Books', 'Other']
const CONDITIONS = ['new', 'used', 'refurbished'] as const

interface RegisterProductModalProps {
  onClose: () => void
  onSubmit: (product: any) => void
}

export default function RegisterProductModal({ onClose, onSubmit }: RegisterProductModalProps) {
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: 'Electronics',
    condition: 'new' as typeof CONDITIONS[number], location: '',
    stock: '1', images: [] as string[],
  })

  const handleSubmit = () => {
    if (!form.name.trim() || !form.price) return
    onSubmit({
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 1,
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
            borderRadius: 18, width: '100%', maxWidth: 500,
            maxHeight: '90vh', overflow: 'auto',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>List a Product</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>Sell your physical product to the community</p>
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
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Product Name *</label>
              <input placeholder='MacBook Pro 16"' value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Description</label>
              <textarea
                placeholder="Describe your product..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            {/* Price + Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Price ($) *</label>
                <input type="number" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Stock</label>
                <input type="number" placeholder="1" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} style={inputStyle} />
              </div>
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

            {/* Condition */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Condition *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {CONDITIONS.map(cond => (
                  <button
                    key={cond}
                    onClick={() => setForm(f => ({ ...f, condition: cond }))}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: form.condition === cond ? 'rgba(37,99,235,0.2)' : '#0d1220',
                      color: form.condition === cond ? '#2563eb' : '#9ca3af',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cond}
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

            {/* Location */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Location</label>
              <input placeholder="City, Country" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} />
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
              List Product
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
