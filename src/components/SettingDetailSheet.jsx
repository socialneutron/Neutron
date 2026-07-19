import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

const C = {
  card: '#090914',
  border: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9',
  muted: '#6b7280',
  accent: '#00D2FF',
  amber: '#f59e0b',
}

export default function SettingDetailSheet({ open, onClose, title, description, warning, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 520, maxHeight: '70vh',
              background: '#090914',
              borderTopLeftRadius: 18, borderTopRightRadius: 18,
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
            }}>
              <button onClick={onClose} style={{
                background: 'none', border: 'none', color: C.muted,
                cursor: 'pointer', padding: 4, display: 'flex',
              }}>
                <ArrowLeft size={18} />
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</span>
              <button onClick={onClose} style={{
                background: 'none', border: 'none', color: C.accent,
                cursor: 'pointer', padding: 4, fontSize: 13, fontWeight: 700,
              }}>
                Done
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>
              {/* Description */}
              <p style={{
                fontSize: 14, color: '#9ca3af', lineHeight: 1.65, margin: '0 0 18px',
              }}>
                {description}
              </p>

              {/* Warning block */}
              {warning && (
                <div style={{
                  padding: '14px 16px', borderRadius: 12, marginBottom: 18,
                  border: `1px solid ${C.amber}30`,
                  background: `${C.amber}08`,
                }}>
                  <p style={{ fontSize: 12, color: C.amber, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
                    {warning}
                  </p>
                </div>
              )}

              {/* Control */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.border}`,
                borderRadius: 14, overflow: 'hidden',
              }}>
                <div style={{ padding: '16px 18px' }}>
                  {children}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
