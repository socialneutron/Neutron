import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Clock, CheckCircle, Send, ExternalLink } from 'lucide-react'

interface Inquiry {
  id: string
  recipientName: string
  recipientHandle: string
  recipientAvatar?: string
  message: string
  timestamp: string
  status: 'sent' | 'delivered' | 'replied'
  type: 'supplier' | 'talent'
}

interface InquiryTrackerProps {
  navigate: (page: string, params?: any) => void
}

export default function InquiryTracker({ navigate }: InquiryTrackerProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])

  useEffect(() => {
    // Load inquiries from localStorage
    try {
      const raw = localStorage.getItem('neutron_inquiries')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setInquiries(parsed)
      }
    } catch {}
  }, [])

  const statusConfig = {
    sent: { color: '#f59e0b', icon: <Clock size={12} />, label: 'Sent' },
    delivered: { color: '#2563eb', icon: <Send size={12} />, label: 'Delivered' },
    replied: { color: '#22c55e', icon: <CheckCircle size={12} />, label: 'Replied' },
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>My Inquiries</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
          Track messages sent to suppliers and talent
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 24,
      }}>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} style={{
            flex: 1, padding: '14px 18px', borderRadius: 12,
            background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${config.color}15`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: config.color,
            }}>
              {config.icon}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {inquiries.filter(i => i.status === key).length}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{config.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Inquiry List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {inquiries.map(inquiry => {
          const status = statusConfig[inquiry.status]
          return (
            <motion.div
              key={inquiry.id}
              whileHover={{ borderColor: 'rgba(37,99,235,0.3)' }}
              style={{
                background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 14,
                transition: 'border-color 0.2s', cursor: 'pointer',
              }}
              onClick={() => navigate('chat', { chat: { username: inquiry.recipientHandle.replace('@', ''), id: inquiry.recipientHandle.replace('@', ''), avatar: inquiry.recipientAvatar, displayName: inquiry.recipientName } })}
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: inquiry.type === 'supplier' ? 'rgba(37,99,235,0.15)' : 'rgba(124,58,237,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: inquiry.type === 'supplier' ? '#2563eb' : '#7c3aed', flexShrink: 0,
                fontSize: 14, fontWeight: 700,
              }}>
                {inquiry.recipientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{inquiry.recipientName}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: status.color,
                    background: `${status.color}15`, padding: '2px 8px', borderRadius: 6,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {status.icon} {status.label}
                  </span>
                </div>
                <p style={{
                  margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {inquiry.message}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 11, color: '#6b7280' }}>
                  <span>{new Date(inquiry.timestamp).toLocaleDateString()}</span>
                  <span>•</span>
                  <span style={{
                    padding: '1px 6px', borderRadius: 4, fontSize: 10,
                    background: inquiry.type === 'supplier' ? 'rgba(37,99,235,0.1)' : 'rgba(124,58,237,0.1)',
                    color: inquiry.type === 'supplier' ? '#2563eb' : '#7c3aed',
                  }}>
                    {inquiry.type === 'supplier' ? 'Supplier' : 'Talent'}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                <ExternalLink size={14} />
              </div>
            </motion.div>
          )
        })}
      </div>

      {inquiries.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px', color: '#6b7280',
        }}>
          <MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No inquiries yet</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Send a message to a supplier or talent to get started</p>
        </div>
      )}
    </div>
  )
}
