import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Send, ChevronDown } from 'lucide-react'

const C = {
  bg: '#0b0f1a',
  card: '#111827',
  cardBdr: '#1f2937',
  accent: '#2563eb',
  accentHov: '#1d4ed8',
  green: '#22c55e',
  cyan: '#06b6d4',
  text: '#f1f5f9',
  muted: '#6b7280',
  subtext: '#9ca3af',
  border: 'rgba(255,255,255,0.07)',
}

const SERVICE_TYPES = ['General Inquiry', 'Project Quote', 'Collaboration', 'Other']
const BUDGET_RANGES = ['Under $500', '$500 - $2k', '$2k - $5k', '$5k+', 'Discuss']
const TIMELINES = ['ASAP', 'This week', 'This month', 'Flexible']

function InquiryModal({ profile, type, onClose, onSubmit }) {
  const isSupplier = type === 'supplier'
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0])
  const [budget, setBudget] = useState(BUDGET_RANGES[0])
  const [timeline, setTimeline] = useState(TIMELINES[2])
  const [message, setMessage] = useState(
    `Hi ${profile.name},\n\nI'm interested in your ${isSupplier ? profile.category : profile.specialty} services. I'd like to discuss a potential project with you.\n\n`
  )

  const handleSubmit = () => {
    const name = profile.name
    const specialty = isSupplier ? profile.category : profile.specialty
    const text = `Hi ${name},\n\nI'm interested in your ${specialty} services.\n\n📋 Service Type: ${serviceType}\n💰 Budget: ${budget}\n⏰ Timeline: ${timeline}\n\n${message}`
    onSubmit(text, profile.handle?.replace('@', '') || profile.name?.toLowerCase().replace(/\s/g, ''))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#111827', border: `1px solid ${C.border}`, borderRadius: 18, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: profile.avatar ? `url(${profile.avatar}) center/cover` : `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {!profile.avatar && profile.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{profile.name}</span>
                {profile.verified && (
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: C.cyan, color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>
                {isSupplier ? profile.category : profile.specialty} {isSupplier ? '' : `· ${profile.rate}`}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Service Type */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Service Type</label>
            <div style={{ position: 'relative' }}>
              <select value={serviceType} onChange={e => setServiceType(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#0d1220', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} color={C.muted} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Budget Range</label>
            <div style={{ position: 'relative' }}>
              <select value={budget} onChange={e => setBudget(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#0d1220', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={14} color={C.muted} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Timeline */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Timeline</label>
            <div style={{ position: 'relative' }}>
              <select value={timeline} onChange={e => setTimeline(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#0d1220', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} color={C.muted} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#0d1220', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ padding: '10px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentHov} onMouseLeave={e => e.currentTarget.style.background = C.accent}>
            <Send size={14} /> Send Inquiry
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default InquiryModal
