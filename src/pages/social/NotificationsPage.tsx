import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, MessageCircle, UserPlus, Repeat2, AtSign } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { notificationService } from '../../services'
import { useNotificationStore } from '../../stores/notificationStore'
import type { Notification } from '../../types/database'
import { timeAgo } from '@/lib/timeAgo'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', green: '#34D399', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280',
}

const iconMap: Record<string, any> = {
  like: Heart, comment: MessageCircle, follow: UserPlus, repost: Repeat2, mention: AtSign,
}

const colorMap: Record<string, string> = {
  like: '#f87171', comment: C.cyan, follow: C.green, repost: C.green, mention: C.purple,
}

interface NotificationsPageProps {
  navigate: (page: string, params?: any) => void
}

export default function NotificationsPage({ navigate }: NotificationsPageProps) {
  const { user } = useSupabaseAuth()
  const { markAllRead } = useNotificationStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await notificationService.getForUser(user.id)
      setNotifications(data)
      await notificationService.markAllAsRead(user.id)
      markAllRead(user.id)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
    setLoading(false)
  }, [user, markAllRead])

  useEffect(() => { load().catch(() => {}) }, [load])

  const getMessage = (n: Notification) => {
    const name = (n.actor as any)?.display_name || 'Someone'
    switch (n.type) {
      case 'like': return `${name} liked your post`
      case 'comment': return `${name} commented on your post`
      case 'follow': return `${name} followed you`
      case 'repost': return `${name} reposted your post`
      case 'mention': return `${name} mentioned you`
      default: return ''
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('home')} style={{ background: 'rgba(7,17,36,0.7)', border: '1px solid rgba(0,210,255,0.1)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Notifications</h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
          <Bell size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 14 }}>No notifications yet</p>
        </div>
      ) : (
        <AnimatePresence>
          {notifications.map((n, i) => {
            const Icon = iconMap[n.type] || Heart
            const color = colorMap[n.type] || C.muted
            return (
              <motion.div key={n.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                style={{ display: 'flex', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${C.cardBdr}`, cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(0,210,255,0.02)' }}
                onClick={() => { if (n.post_id) navigate('post', { postId: n.post_id }) }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{getMessage(n)}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted }}>{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.cyan, flexShrink: 0, marginTop: 4 }} />}
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </div>
  )
}

function Bell({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
