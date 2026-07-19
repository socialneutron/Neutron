import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flag, X, ChevronDown, Check } from 'lucide-react'

const C = {
  bg: '#090914',
  card: '#111827',
  accent: '#2563eb',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
  amber: '#f59e0b',
}

const REASONS = [
  'Spam',
  'Misleading',
  'Inappropriate content',
  'Scam or fraud',
  'Other',
]

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (reason: string, details: string) => void
}

export default function ReportModal({ open, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleSubmit = () => {
    if (!reason) return
    onSubmit(reason, details)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setReason('')
      setDetails('')
      onClose()
    }, 2000)
  }

  const handleClose = () => {
    setReason('')
    setDetails('')
    setSubmitted(false)
    setDropdownOpen(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
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
              width: '100%', maxWidth: 420, background: C.bg,
              borderRadius: 16, border: `1px solid ${C.border}`,
              padding: 24,
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: 'rgba(34,197,94,0.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Check size={28} color="#22c55e" />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: C.text }}>Report Submitted</h3>
                <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Thanks, we'll review this listing.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Flag size={18} color={C.amber} />
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Report Listing</h3>
                  </div>
                  <button onClick={handleClose} style={{
                    background: 'none', border: 'none', color: C.muted,
                    cursor: 'pointer', padding: 4,
                  }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Reason dropdown */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>Reason</label>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: `1px solid ${C.border}`, background: C.card,
                        color: reason || C.muted, fontSize: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {reason || 'Select a reason'}
                      <ChevronDown size={14} color={C.muted} style={{
                        transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.15s',
                      }} />
                    </button>
                    {dropdownOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: C.card, border: `1px solid ${C.border}`,
                        borderRadius: 10, marginTop: 4, overflow: 'hidden', zIndex: 10,
                      }}>
                        {REASONS.map(r => (
                          <button
                            key={r}
                            onClick={() => { setReason(r); setDropdownOpen(false) }}
                            style={{
                              width: '100%', padding: '10px 14px', border: 'none',
                              background: reason === r ? 'rgba(37,99,235,0.12)' : 'transparent',
                              color: reason === r ? C.accent : C.text,
                              fontSize: 13, cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>Additional details (optional)</label>
                  <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Provide more context..."
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: `1px solid ${C.border}`, background: C.card,
                      color: C.text, fontSize: 13, resize: 'none',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleClose}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 10,
                      border: `1px solid ${C.border}`, background: 'transparent',
                      color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!reason}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 10,
                      border: 'none', background: reason ? C.amber : '#374151',
                      color: '#fff', fontSize: 13, fontWeight: 700,
                      cursor: reason ? 'pointer' : 'not-allowed',
                      opacity: reason ? 1 : 0.5,
                    }}
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
