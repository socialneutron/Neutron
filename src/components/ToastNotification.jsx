import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, UserPlus, Repeat2, Bell, X } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'

const iconMap = { like: Heart, comment: MessageCircle, follow: UserPlus, repost: Repeat2, mention: Bell }
const colorMap = { like: '#f87171', comment: '#00D2FF', follow: '#34D399', repost: '#34D399', mention: '#f59e0b' }
const labelMap = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'followed you',
  repost: 'reposted your post',
  mention: 'mentioned you',
}

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children, navigate }) {
  const [toasts, setToasts] = useState([])
  const notifications = useSettingsStore(s => s.notifications)

  const addToast = useCallback((notification) => {
    if (!notifications.toasts) return
    const typeKey = notification.type
    if (typeKey === 'like' && !notifications.likes) return
    if (typeKey === 'comment' && !notifications.comments) return
    if (typeKey === 'follow' && !notifications.follows) return
    if (typeKey === 'repost' && !notifications.comments) return
    if (typeKey === 'mention' && !notifications.mentions) return

    const toast = {
      id: notification.id || `toast-${Date.now()}`,
      type: typeKey,
      actor: notification.actor,
      post_id: notification.post_id,
      created_at: notification.created_at || new Date().toISOString(),
    }

    setToasts(prev => {
      const next = [toast, ...prev]
      return next.slice(0, 3)
    })
  }, [notifications])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleToastClick = useCallback((toast) => {
    removeToast(toast.id)
    if (toast.post_id && navigate) {
      navigate('post', { postId: toast.post_id })
    } else if (toast.actor && navigate) {
      navigate('profile', {
        author: {
          id: toast.actor.id,
          name: toast.actor.display_name,
          handle: `@${toast.actor.username}`,
          avatar: toast.actor.avatar_url,
          verified: toast.actor.is_verified,
        },
      })
    }
  }, [navigate, removeToast])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340, width: '100%', pointerEvents: 'none' }}>
        <AnimatePresence>
          {toasts.map((toast, i) => (
            <ToastItem key={toast.id} toast={toast} index={i} onClick={() => handleToastClick(toast)} onDismiss={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, index, onClick, onDismiss }) {
  const Icon = iconMap[toast.type] || Bell
  const color = colorMap[toast.type] || '#6b7280'
  const name = toast.actor?.display_name || 'Someone'
  const label = labelMap[toast.type] || 'interacted with you'
  const avatarUrl = toast.actor?.avatar_url

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const timeAgo = (() => {
    const diff = Date.now() - new Date(toast.created_at).getTime()
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return 'now'
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  })()

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onClick={onClick}
      style={{
        pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px', borderRadius: 14,
        background: 'rgba(9,15,30,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,210,255,0.05)',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.98)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(9,15,30,0.95)'}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0, position: 'relative',
        background: avatarUrl ? `url(${avatarUrl}) center/cover` : `linear-gradient(135deg, #00D2FF, #7928CA)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff',
      }}>
        {!avatarUrl && (name[0]?.toUpperCase() || '?')}
        <div style={{
          position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%',
          background: `${color}25`, border: '2px solid rgba(9,15,30,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={9} color={color} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#f1f5f9', lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600 }}>{name}</span>{' '}
          <span style={{ color: '#94a3b8' }}>{label}</span>
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>{timeAgo}</p>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onDismiss() }} style={{
        background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}
