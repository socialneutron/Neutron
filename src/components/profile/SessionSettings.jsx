import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Laptop, Globe, Shield, Trash2, Clock, Monitor, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react'
import { getSessions, revokeSession, revokeAllOtherSessions } from '../../services/authService'

const deviceIcons = { mobile: Smartphone, desktop: Laptop, tablet: Globe }

export default function SessionSettings({ onNavigate }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const data = await getSessions()
      setSessions(data)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
    setLoading(false)
  }

  const handleRevoke = async (sessionId) => {
    setActionLoading(sessionId)
    setMessage({ type: '', text: '' })
    try {
      await revokeSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      setMessage({ type: 'success', text: 'Session revoked successfully' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
    setActionLoading(null)
  }

  const handleRevokeAll = async () => {
    setActionLoading('all')
    setMessage({ type: '', text: '' })
    try {
      await revokeAllOtherSessions()
      setSessions(prev => prev.filter(s => s.isCurrent))
      setMessage({ type: 'success', text: 'All other sessions revoked' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
    setActionLoading(null)
  }

  const formatDate = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#00D2FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050A', padding: '40px 20px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <button onClick={() => onNavigate('login')} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(7,17,36,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,210,255,0.1)', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Active Sessions</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Manage devices and sessions signed into your account</p>
            </div>
            {sessions.length > 1 && (
              <button onClick={handleRevokeAll} disabled={actionLoading === 'all'} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: '13px', fontWeight: 600, cursor: actionLoading === 'all' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} /> {actionLoading === 'all' ? 'Revoking...' : 'Revoke All Others'}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {message.text && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: '1px solid ' + (message.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'), color: message.type === 'error' ? '#fca5a5' : '#86efac' }}>
              {message.type === 'error' ? <Shield size={14} /> : <CheckCircle size={14} />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sessions.map((session, idx) => {
            const Icon = deviceIcons[session.device] || Monitor
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid ' + (session.isCurrent ? 'rgba(0,210,255,0.2)' : 'rgba(255,255,255,0.06)') }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: session.isCurrent ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={session.isCurrent ? '#00D2FF' : '#6b7280'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#e5e7eb' }}>{session.browser} on {session.os}</span>
                      {session.isCurrent && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: 'rgba(0,210,255,0.15)', color: '#00D2FF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                      <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{formatDate(session.lastActive)}</span>
                      <span>{session.ipAddress}</span>
                      <span>{session.location}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(session.id)}
                  disabled={actionLoading === session.id || session.isCurrent}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', background: session.isCurrent ? 'transparent' : 'rgba(239,68,68,0.08)', color: session.isCurrent ? '#4b5563' : '#fca5a5', fontSize: '12px', fontWeight: 600, cursor: session.isCurrent ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                  aria-label={`Revoke session ${session.browser} on ${session.os}`}
                >
                  <Trash2 size={13} /> {actionLoading === session.id ? 'Revoking...' : session.isCurrent ? 'Current' : 'Revoke'}
                </button>
              </motion.div>
            )
          })}
        </div>

        {sessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#4b5563' }}>
            <Monitor size={32} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', margin: 0 }}>No active sessions found</p>
          </div>
        )}
      </div>
    </div>
  )
}
