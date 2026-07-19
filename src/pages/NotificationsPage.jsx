import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, MessageCircle, UserPlus, Repeat2, Bell, Check } from 'lucide-react'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { notificationService } from '../services'
import { useNotificationStore } from '../stores/notificationStore'
import { timeAgo } from '@/lib/timeAgo'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', green: '#34D399', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280',
}

const iconMap = { like: Heart, comment: MessageCircle, follow: UserPlus, repost: Repeat2 }
const colorMap = { like: '#f87171', comment: C.cyan, follow: C.green, repost: C.green }
const labelMap = { like: 'liked your post', comment: 'commented on your post', follow: 'followed you', repost: 'reposted your post' }

export default function NotificationsPage({ navigate }) {
  const { user } = useSupabaseAuth()
  const { markAllRead, setUnreadCount } = useNotificationStore()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    if (user) {
      try {
        const data = await notificationService.getForUser(user.id)
        setNotifications(data || [])
        await notificationService.markAllAsRead(user.id)
        markAllRead(user.id)
      } catch {
        setNotifications([])
      }
    } else {
      setNotifications([])
    }
    setLoading(false)
  }, [user, markAllRead])

  useEffect(() => { load() }, [load])

  const getMessage = (n) => {
    const name = n.actor?.display_name || 'Someone'
    return `${name} ${labelMap[n.type] || 'interacted with you'}`
  }

  const handleClick = (n) => {
    if (n.post_id) {
      navigate('post', { postId: n.post_id })
    } else if (n.actor_id) {
      const actor = n.actor
      if (actor) navigate('profile', { author: { id: n.actor_id, name: actor.display_name, handle: `@${actor.username}`, avatar: actor.avatar_url, verified: actor.is_verified } })
    }
  }

  const filtered = filter === 'All' ? notifications
    : filter === 'Likes' ? notifications.filter(n => n.type === 'like')
    : filter === 'Comments' ? notifications.filter(n => n.type === 'comment')
    : filter === 'Follows' ? notifications.filter(n => n.type === 'follow')
    : notifications

  const formatCount = notifications.length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('home')} style={{ background: 'rgba(7,17,36,0.7)', border: '1px solid rgba(0,210,255,0.1)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Notifications</h2>
        {formatCount > 0 && <span style={{ fontSize: 12, color: C.muted }}>({formatCount})</span>}
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
          <p style={{ margin: 0, fontSize: 14 }}>
            {filter === 'All' ? 'No notifications yet — interact with posts to see activity here' : `No ${filter.toLowerCase()} notifications`}
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {filtered.map((n, i) => {
            const Icon = iconMap[n.type] || Heart
            const color = colorMap[n.type] || C.muted
            const avatarUrl = n.actor?.avatar_url || ''
            const displayName = n.actor?.display_name || ''
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                onClick={() => handleClick(n)}
                style={{ display: 'flex', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${C.cardBdr}`, cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(0,210,255,0.03)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(0,210,255,0.03)'}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarUrl ? `url(${avatarUrl}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0, position: 'relative' }}>
                  {!avatarUrl && (displayName[0]?.toUpperCase() || <Bell size={14} />)}
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: `${color}20`, border: `2px solid ${C.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={9} color={color} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{getMessage(n)}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted }}>{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.cyan, flexShrink: 0, marginTop: 16 }} />}
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </div>
  )
}
