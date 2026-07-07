import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Send, MessageCircle } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import type { PostWithAuthor } from '../../types/database'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', green: '#34D399', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280', border: 'rgba(255,255,255,0.06)',
}

interface ShareToChatModalProps {
  post: PostWithAuthor
  onClose: () => void
  navigate: (page: string, params?: any) => void
}

export default function ShareToChatModal({ post, onClose, navigate }: ShareToChatModalProps) {
  const { user, profile } = useSupabaseAuth()
  const { conversations, getOrCreateConversation, addMessage } = useChatStore()
  const [search, setSearch] = useState('')
  const [sharing, setSharing] = useState<string | null>(null)

  const filtered = conversations.filter(c =>
    c.participant.username.toLowerCase().includes(search.toLowerCase()) ||
    c.participant.id.toLowerCase().includes(search.toLowerCase())
  )

  const currentUserId = user?.id || 'demo-user-id'
  const currentName = profile?.display_name || user?.user_metadata?.display_name || 'User'

  const handleShare = async (convId: string, participantUsername: string) => {
    setSharing(convId)
    const link = `${window.location.origin}/post/${post.id}`
    const msg = {
      id: `msg_${Math.random().toString(36).substring(2, 9)}`,
      senderId: currentUserId,
      text: `📫 ${currentName} shared a post: "${post.title}" — ${link}`,
      timestamp: new Date(),
      status: 'sending' as const,
    }
    addMessage(convId, msg)
    setTimeout(() => {
      navigate('chat', { chat: { username: participantUsername } })
    }, 200)
  }

  const handleNewChat = () => {
    if (!search.trim()) return
    const participant = {
      id: search.trim().toLowerCase().replace(/\s+/g, '_'),
      username: search.trim(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      online: false,
      isVerified: false,
    }
    const conv = getOrCreateConversation(participant)
    const link = `${window.location.origin}/post/${post.id}`
    const msg = {
      id: `msg_${Math.random().toString(36).substring(2, 9)}`,
      senderId: currentUserId,
      text: `📫 ${currentName} shared a post: "${post.title}" — ${link}`,
      timestamp: new Date(),
      status: 'sending' as const,
    }
    addMessage(conv.id, msg)
    navigate('chat', { chat: { username: participant.username } })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#0d1117', border: `1px solid ${C.border}`, borderRadius: 16,
            width: '100%', maxWidth: 420, padding: 0, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Share to Chat</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '10px 18px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px' }}>
              <Search size={14} color={C.muted} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations or start new..."
                onKeyDown={e => e.key === 'Enter' && handleNewChat()}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13 }}
              />
              {search.trim() && (
                <button onClick={handleNewChat} style={{ background: 'none', border: 'none', color: C.cyan, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  New Chat
                </button>
              )}
            </div>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto', padding: '4px 0' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 18px', color: C.muted, fontSize: 13 }}>
                {search.trim() ? 'Press "New Chat" to start a conversation' : 'No conversations yet'}
              </div>
            ) : (
              filtered.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => handleShare(conv.id, conv.participant.username)}
                  disabled={sharing === conv.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 18px', background: 'none', border: 'none',
                    color: C.text, fontSize: 13, cursor: sharing === conv.id ? 'not-allowed' : 'pointer',
                    textAlign: 'left', transition: 'background 0.15s', opacity: sharing === conv.id ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (sharing !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: conv.participant.avatar ? `url(${conv.participant.avatar}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff',
                  }}>
                    {!conv.participant.avatar && conv.participant.username[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{conv.participant.username}</div>
                    {conv.lastMessage && (
                      <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessage}</div>
                    )}
                  </div>
                  {sharing === conv.id ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%', flexShrink: 0 }} />
                  ) : (
                    <Send size={14} color={C.muted} style={{ flexShrink: 0 }} />
                  )}
                </button>
              ))
            )}
          </div>

          <div style={{ padding: '10px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={14} color={C.muted} />
            <span style={{ fontSize: 11, color: C.muted }}>Share "{post.title}" with a friend</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
