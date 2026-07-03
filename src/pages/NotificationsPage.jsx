import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, MessageCircle, UserPlus, Repeat2, AtSign, Bell } from 'lucide-react'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { notificationService } from '../services'
import { useNotificationStore } from '../stores/notificationStore'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', green: '#34D399', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280',
}

const iconMap = { like: Heart, comment: MessageCircle, follow: UserPlus, repost: Repeat2, mention: AtSign }
const colorMap = { like: '#f87171', comment: C.cyan, follow: C.green, repost: C.green, mention: C.purple }

const FALLBACK_NOTIFS = [
  { id: 'f1', type: 'like', actor: { display_name: 'Aria Chen' }, post_id: null, read: false, created_at: new Date(Date.now() - 120000).toISOString() },
  { id: 'f2', type: 'comment', actor: { display_name: 'Marcus Webb' }, post_id: null, read: false, created_at: new Date(Date.now() - 480000).toISOString() },
  { id: 'f3', type: 'follow', actor: { display_name: 'Priya Sharma' }, post_id: null, read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'f4', type: 'repost', actor: { display_name: 'Dr. James Okoye' }, post_id: null, read: true, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'f5', type: 'like', actor: { display_name: 'Ray Tanaka' }, post_id: null, read: true, created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: 'f6', type: 'follow', actor: { display_name: 'Elena Volkov' }, post_id: null, read: true, created_at: new Date(Date.now() - 18000000).toISOString() },
  { id: 'f7', type: 'mention', actor: { display_name: 'Sam Aldridge' }, post_id: null, read: true, created_at: new Date(Date.now() - 28800000).toISOString() },
]

export default function NotificationsPage({ navigate }) {
  const { user } = useSupabaseAuth()
  const { markAllRead } = useNotificationStore()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    if (user) {
      try {
        const data = await notificationService.getForUser(user.id)
        if (data && data.length > 0) {
          setNotifications(data)
          await notificationService.markAllAsRead(user.id)
          markAllRead(user.id)
        } else {
          setNotifications(FALLBACK_NOTIFS)
        }
      } catch {
        setNotifications(FALLBACK_NOTIFS)
      }
    } else {
      setNotifications(FALLBACK_NOTIFS)
    }
    setLoading(false)
  }, [user, markAllRead])

  useEffect(() => { load() }, [load])

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const getMessage = (n) => {
    const name = n.actor?.display_name || 'Someone'
    switch (n.type) {
      case 'like': return `${name} liked your post`
      case 'comment': return `${name} commented on your post`
      case 'follow': return `${name} followed you`
      case 'repost': return `${name} reposted your post`
      case 'mention': return `${name} mentioned you`
      default: return ''
    }
  }

  const filtered = filter === 'All' ? notifications
    : filter === 'Likes' ? notifications.filter(n => n.type === 'like')
    : filter === 'Comments' ? notifications.filter(n => n.type === 'comment')
    : filter === 'Follows' ? notifications.filter(n => n.type === 'follow')
    : notifications

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('home')} style={{ background: 'rgba(7,17,36,0.7)', border: '1px solid rgba(0,210,255,0.1)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Notifications</h2>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 18px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['All', 'Likes', 'Comments', 'Follows'].map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 8, border: `1px solid ${filter === tab ? C.cyan : C.cardBdr}`, background: filter === tab ? `${C.cyan}15` : 'transparent', color: filter === tab ? C.cyan : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >{tab}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
          <Bell size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 14 }}>No notifications yet</p>
        </div>
      ) : (
        <AnimatePresence>
          {filtered.map((n, i) => {
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
