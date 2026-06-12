import { useState } from 'react'
import { ArrowLeft, Bell, Heart, MessageCircle, UserPlus, Zap, Globe } from 'lucide-react'
import './NotificationsPage.css'

const NOTIFS = [
  { id: 1, type: 'like', icon: '❤️', color: '#ff6b8a', user: 'Aria Chen', action: 'liked your post', target: '"Why AGI safety should be a government priority"', time: '2m ago', unread: true },
  { id: 2, type: 'reply', icon: '💬', color: '#00d2ff', user: 'Marcus Webb', action: 'replied to your thread', target: '"The Macro case for Bitcoin..."', time: '8m ago', unread: true },
  { id: 3, type: 'breaking', icon: '🔴', color: '#ff6b6b', user: 'Neutron News', action: 'Breaking Alert:', target: 'Fed raises rates by 50bps — markets react', time: '12m ago', unread: true },
  { id: 4, type: 'follow', icon: '👤', color: '#a855f7', user: 'Priya Sharma', action: 'started following you', target: '', time: '1h ago', unread: false },
  { id: 5, type: 'mention', icon: '@', color: '#00d2ff', user: 'Dr. James Okoye', action: 'mentioned you in', target: '"CRISPR Alzheimer\'s mega-thread"', time: '2h ago', unread: false },
  { id: 6, type: 'ai', icon: '🤖', color: '#4ade80', user: 'Neutron AI', action: 'fact-checked your post:', target: '✅ Verified — High credibility sources confirmed', time: '3h ago', unread: false },
  { id: 7, type: 'like', icon: '❤️', color: '#ff6b8a', user: 'Ray Tanaka', action: 'liked your post', target: '"Thread: 10 startups I believe will hit $1B..."', time: '4h ago', unread: false },
  { id: 8, type: 'follow', icon: '👤', color: '#a855f7', user: 'Elena Volkov', action: 'started following you', target: '', time: '5h ago', unread: false },
  { id: 9, type: 'breaking', icon: '🌍', color: '#fbbf24', user: 'World News', action: 'New Alert:', target: 'SpaceX Starship completes Mars terrain simulation landing', time: '6h ago', unread: false },
  { id: 10, type: 'reply', icon: '💬', color: '#00d2ff', user: 'Sam Aldridge', action: 'replied to your comment in', target: 'AI Hub discussion', time: '8h ago', unread: false },
]

const FILTER_TABS = ['All', 'Mentions', 'Likes', 'Follows', 'Alerts']

export default function NotificationsPage({ navigate }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [notifications, setNotifications] = useState(NOTIFS)

  const filtered = notifications.filter(n => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Mentions') return n.type === 'mention' || n.type === 'reply'
    if (activeFilter === 'Likes') return n.type === 'like'
    if (activeFilter === 'Follows') return n.type === 'follow'
    if (activeFilter === 'Alerts') return n.type === 'breaking' || n.type === 'ai'
    return true
  })

  const unreadCount = notifications.filter(n => n.unread).length

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notif-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="icon-btn-sm" onClick={() => navigate('home')} id="notif-back-btn">
            <ArrowLeft size={18}/>
          </button>
          <div>
            <h2 className="notif-title">Notifications</h2>
            {unreadCount > 0 && <span className="notif-unread-count">{unreadCount} new</span>}
          </div>
        </div>
        <button className="mark-read-btn" onClick={markAllRead} id="mark-all-read-btn">
          Mark all read
        </button>
      </div>

      {/* Filter tabs */}
      <div className="notif-tabs">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            className={`notif-tab ${activeFilter === tab ? 'notif-tab-active' : ''}`}
            onClick={() => setActiveFilter(tab)}
            id={`notif-filter-${tab.toLowerCase()}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Breaking Alert Banner */}
      {activeFilter === 'All' && (
        <div className="breaking-banner">
          <div className="breaking-pulse"/>
          <div>
            <span className="breaking-label">LIVE ALERTS</span>
            <p className="breaking-text">3 breaking news items in your interest areas</p>
          </div>
          <button className="breaking-view-btn">View →</button>
        </div>
      )}

      {/* Notification list */}
      <div className="notif-list">
        {filtered.map(notif => (
          <div
            key={notif.id}
            className={`notif-item ${notif.unread ? 'notif-unread' : ''}`}
            id={`notif-${notif.id}`}
          >
            <div className="notif-icon-wrap" style={{ background: notif.color + '20', border: `1px solid ${notif.color}30` }}>
              <span style={{ fontSize: notif.type === 'mention' ? '13px' : '16px', fontWeight: notif.type === 'mention' ? 800 : 400, color: notif.color }}>
                {notif.icon}
              </span>
            </div>
            <div className="notif-content">
              <p className="notif-text">
                <strong>{notif.user}</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{notif.action}</span>
                {notif.target && <span> <em style={{ color: 'var(--text-primary)' }}>{notif.target}</em></span>}
              </p>
              <span className="notif-time">{notif.time}</span>
            </div>
            {notif.unread && <span className="unread-dot"/>}
          </div>
        ))}
      </div>
    </div>
  )
}
