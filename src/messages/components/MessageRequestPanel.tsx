import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Check, X, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { useChatStore, MessageRequest } from '../../stores/chatStore'

interface MessageRequestPanelProps {
  onRequestAccepted?: (convId: string) => void
}

export default function MessageRequestPanel({ onRequestAccepted }: MessageRequestPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const { messageRequests, acceptMessageRequest, declineMessageRequest } = useChatStore()

  const pendingRequests = messageRequests.filter(r => r.status === 'pending')
  const handledRequests = messageRequests.filter(r => r.status !== 'pending')
  const hasRequests = pendingRequests.length > 0

  const handleAccept = (reqId: string) => {
    const conv = acceptMessageRequest(reqId)
    if (conv && onRequestAccepted) {
      onRequestAccepted(conv.id)
    }
  }

  if (messageRequests.length === 0) return null

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: '12px 16px', background: 'none', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Shield size={16} color={hasRequests ? '#f59e0b' : '#6b7280'} />
            {hasRequests && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 8, height: 8, borderRadius: '50%',
                background: '#ef4444', border: '2px solid #0d1117',
              }} />
            )}
          </div>
          <span style={{
            fontSize: '12px', fontWeight: 600,
            color: hasRequests ? '#f59e0b' : '#6b7280',
            letterSpacing: '0.02em',
          }}>
            Message Requests
          </span>
          {hasRequests && (
            <span style={{
              background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700,
              padding: '1px 6px', borderRadius: '99px', minWidth: 18, textAlign: 'center',
            }}>
              {pendingRequests.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
      </button>

      {/* Request List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pendingRequests.map(req => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onAccept={() => handleAccept(req.id)}
                  onDecline={() => declineMessageRequest(req.id)}
                />
              ))}

              {handledRequests.length > 0 && (
                <div style={{ padding: '4px 8px', marginTop: 4 }}>
                  <span style={{ fontSize: '10px', color: '#4b5563', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Handled
                  </span>
                </div>
              )}

              {handledRequests.slice(0, 3).map(req => (
                <HandledCard key={req.id} request={req} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RequestCard({ request, onAccept, onDecline }: {
  request: MessageRequest
  onAccept: () => void
  onDecline: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10, height: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 10px', borderRadius: 10, cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={request.senderAvatar}
            alt={request.senderName}
            style={{
              width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
              border: '2px solid rgba(245,158,11,0.3)',
            }}
            referrerPolicy="no-referrer"
          />
          <span style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 10, height: 10, borderRadius: '50%',
            background: '#f59e0b', border: '2px solid #0d1117',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{
              fontSize: '13px', fontWeight: 600, color: '#e5e7eb',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {request.senderName}
            </span>
            {request.isVerified && <Shield size={11} color="#00CFFF" />}
          </div>
          <p style={{
            fontSize: '11px', color: '#6b7280', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {request.preview}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <Clock size={9} color="#4b5563" />
            <span style={{ fontSize: '9px', color: '#4b5563' }}>
              {new Date(request.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); onAccept() }}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 8, border: 'none',
            background: 'rgba(34,197,94,0.15)', color: '#22c55e',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <Check size={12} /> Accept
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); onDecline() }}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 8, border: 'none',
            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <X size={12} /> Decline
        </motion.button>
      </div>
    </motion.div>
  )
}

function HandledCard({ request }: { request: MessageRequest }) {
  const isAccepted = request.status === 'accepted'

  return (
    <div style={{
      padding: '8px 10px', borderRadius: 8,
      opacity: 0.5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img
          src={request.senderAvatar}
          alt={request.senderName}
          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
          referrerPolicy="no-referrer"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
            {request.senderName}
          </span>
        </div>
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: isAccepted ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: isAccepted ? '#22c55e' : '#ef4444',
          textTransform: 'uppercase',
        }}>
          {isAccepted ? 'Accepted' : 'Declined'}
        </span>
      </div>
    </div>
  )
}
