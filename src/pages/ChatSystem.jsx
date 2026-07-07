import React from 'react'
import { motion } from 'framer-motion'
import ChatApp from '../messages/App'
import { useUserAvatar } from '../stores/userAvatarStore'
import '../messages/index.css'

const C = {
  bg: '#0a0e14', text: '#f1f5f9', muted: '#6b7280',
  cyan: '#00D2FF', purple: '#7928CA',
}

export default function ChatSystem({ recipient, navigate, user }) {
  const { avatar: globalAvatar, displayName: globalDisplayName } = useUserAvatar()
  const userAvatar = globalAvatar || user?.avatar_url || ''
  const userDisplayName = globalDisplayName || user?.display_name || 'User'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0a0e14' }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: C.text, letterSpacing: '2px' }}>neutron</span>
        <span style={{ fontSize: 13, color: C.muted }}>Chat</span>
        <div style={{ flex: 1 }} />
        <motion.div onClick={() => navigate('profile')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ width: 34, height: 34, borderRadius: '50%', background: userAvatar ? `url(${userAvatar}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
          {!userAvatar && userDisplayName[0]?.toUpperCase()}
        </motion.div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatApp recipient={recipient} navigate={navigate} user={user} />
      </div>
    </div>
  )
}
