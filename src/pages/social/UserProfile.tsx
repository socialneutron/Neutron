import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Settings, MessageSquare, MapPin, LinkIcon, Calendar, TrendingUp, FileText, MessageCircle, Send, X } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { userService, followService, postService } from '../../services'
import { useProfileStore } from '../../stores/profileStore'
import { useChatStore } from '../../stores/chatStore'
import type { User, PostWithAuthor } from '../../types/database'
import PostCard from '../../components/social/PostCard'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', green: '#34D399', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280',
}

interface ProfilePageProps {
  username?: string
  profileAuthor?: { name: string; handle: string; avatar?: string; verified?: boolean }
  navigate: (page: string, params?: any) => void
}

export default function ProfilePage({ username, profileAuthor, navigate }: ProfilePageProps) {
  const { user } = useSupabaseAuth()
  const { profile, setProfile, isFollowing, setIsFollowing, toggleFollow } = useProfileStore()
  const [userPosts, setUserPosts] = useState<PostWithAuthor[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'stats'>('posts')
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { getOrCreateConversation, addMessage } = useChatStore()

  // Resolve username from props
  const resolvedUsername = username || profileAuthor?.handle?.replace('@', '')

  const loadProfile = useCallback(async () => {
    if (!resolvedUsername) return
    setLoading(true)
    try {
      const profileData = await userService.getProfile(resolvedUsername)
      if (profileData) {
        setProfile(profileData)
        if (user) {
          const following = await followService.isFollowing(user.id, profileData.id)
          setIsFollowing(following)
        }
        const posts = await userService.getUserPosts(profileData.id)
        setUserPosts(posts as any)
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    }
    setLoading(false)
  }, [resolvedUsername, user, setProfile, setIsFollowing])

  useEffect(() => { loadProfile().catch(() => {}) }, [loadProfile])

  const handleFollow = useCallback(async () => {
    if (!user || !profile) return
    await toggleFollow(user.id, profile.id)
  }, [user, profile, toggleFollow])

  const isOwnProfile = user?.id === profile?.id

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
    </div>
  )

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <p style={{ color: C.muted, fontSize: 14 }}>User not found</p>
      <button onClick={() => navigate('home')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'rgba(0,210,255,0.15)', color: C.cyan, cursor: 'pointer', fontSize: 13 }}>Go Home</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      {/* Banner */}
      <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: profile.banner_url ? `url(${profile.banner_url}) center/cover` : 'linear-gradient(135deg, #090914, #05050A)', backgroundImage: profile.banner_url ? undefined : 'radial-gradient(circle at 20% 50%, rgba(0,210,255,0.12) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(121,40,202,0.12) 0%, transparent 60%)' }} />
        <button onClick={() => navigate('home')} style={{ position: 'absolute', top: 50, left: 16, width: 38, height: 38, borderRadius: 10, background: 'rgba(7,17,36,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,210,255,0.1)', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <ArrowLeft size={20} />
        </button>
        {isOwnProfile && (
          <button onClick={() => navigate('settings')} style={{ position: 'absolute', top: 50, right: 16, width: 38, height: 38, borderRadius: 10, background: 'rgba(7,17,36,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,210,255,0.1)', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: -40, marginBottom: 14 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
            border: '3px solid #05050A', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff',
          }}>
            {!profile.avatar_url && profile.display_name?.[0]?.toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', color: C.text, margin: 0 }}>{profile.display_name}</h1>
            {profile.is_verified && <span style={{ background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 700, color: C.cyan, letterSpacing: '0.06em' }}>VERIFIED</span>}
          </div>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>@{profile.username}</p>
          {profile.bio && <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{profile.bio}</p>}

          {/* Meta */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
            {profile.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.muted }}><MapPin size={14} /> {profile.location}</span>}
            {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.cyan, textDecoration: 'none' }}><LinkIcon size={14} /> {profile.website.replace(/^https?:\/\//, '')}</a>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.muted }}><Calendar size={14} /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, padding: '14px 0', borderTop: '1px solid rgba(0,210,255,0.08)', borderBottom: '1px solid rgba(0,210,255,0.08)', marginTop: 8 }}>
            {[
              { val: profile.posts_count, label: 'Posts' },
              { val: profile.followers_count, label: 'Followers' },
              { val: profile.following_count, label: 'Following' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{s.val.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {!isOwnProfile && user && (
              <>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleFollow}
                  style={{
                    flex: 1, padding: 12, borderRadius: 10, cursor: 'pointer',
                    background: isFollowing ? 'rgba(0,210,255,0.15)' : 'rgba(5,5,10,0.4)',
                    border: isFollowing ? '1px solid rgba(0,210,255,0.3)' : '1px solid rgba(0,210,255,0.3)',
                    color: isFollowing ? C.cyan : '#e5e7eb', fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
                  }}
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02, background: 'linear-gradient(135deg, #3b82f6, #9333ea)' }} whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    const displayName = profile.display_name || profileAuthor?.name || 'User'
                    const peer = {
                      id: profileAuthor?.handle || displayName,
                      username: displayName,
                      avatar: profileAuthor?.avatar || profile.avatar_url || '',
                      online: true,
                      isVerified: profileAuthor?.verified || false,
                    }
                    const conv = getOrCreateConversation(peer)
                    setChatMessages([])
                    setChatSessionId(conv.sessionId)
                    setShowChat(true)
                  }}
                  style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <MessageSquare size={15} /> Message
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,210,255,0.08)' }}>
        {(['posts', 'comments', 'stats'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 0', background: 'none', border: 'none',
            borderBottom: activeTab === tab ? '2px solid #00D2FF' : '2px solid transparent',
            color: activeTab === tab ? C.cyan : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
          }}>
            {tab === 'posts' && <FileText size={14} />} {tab === 'comments' && <MessageCircle size={14} />} {tab === 'stats' && <TrendingUp size={14} />}
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'posts' && (
          <motion.div key="posts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {userPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
                <FileText size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p style={{ margin: 0, fontSize: 14 }}>No posts yet</p>
              </div>
            ) : (
              userPosts.map((post, i) => <PostCard key={post.id} post={post} navigate={navigate} delay={i * 0.05} />)
            )}
          </motion.div>
        )}
        {activeTab === 'comments' && (
          <motion.div key="comments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
              <MessageCircle size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14 }}>Comments coming soon</p>
            </div>
          </motion.div>
        )}
        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Total Posts', value: profile.posts_count, color: C.cyan },
                { label: 'Followers', value: profile.followers_count, color: C.purple },
                { label: 'Following', value: profile.following_count, color: C.green },
                { label: 'Member Since', value: new Date(profile.created_at).getFullYear(), color: '#f59e0b' },
              ].map((stat, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.cardBdr}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value.toLocaleString()}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Popup — Fixed bottom-right card */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="chat-popup-card"
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
              width: 360, maxHeight: 500, height: 'auto',
              background: '#090914', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              backdropFilter: 'blur(12px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                  {profile.display_name[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>{profile.display_name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} /> Online</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {chatSessionId && (
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#6b7280', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {chatSessionId}
                  </span>
                )}
                <button onClick={() => setShowChat(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 120, maxHeight: 320 }}>
              {chatMessages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', color: '#6b7280', textAlign: 'center' }}>
                  <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>Start a new secure transmission with {profile.display_name}...</p>
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'me' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.5, background: msg.role === 'me' ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(255,255,255,0.05)', border: msg.role === 'me' ? 'none' : '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
                      {msg.text}
                      <p style={{ margin: '4px 0 0', fontSize: 9, color: msg.role === 'me' ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>{msg.time || 'now'}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}>
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Type a secure message..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && chatMsg.trim()) {
                    const displayName = profile.display_name || profileAuthor?.name || 'User'
                    const peer = { id: profileAuthor?.handle || displayName, username: displayName, avatar: '', online: true, isVerified: false }
                    const conv = getOrCreateConversation(peer)
                    const newMsg = { id: `msg_${Date.now()}`, role: 'me', text: chatMsg, time: 'now' }
                    setChatMessages(p => [...p, newMsg])
                    addMessage(conv.id, { id: newMsg.id, senderId: 'me', text: chatMsg, timestamp: new Date(), status: 'sent' })
                    setChatMsg('')
                  }
                }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none' }}
              />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (chatMsg.trim()) {
                    const displayName = profile.display_name || profileAuthor?.name || 'User'
                    const peer = { id: profileAuthor?.handle || displayName, username: displayName, avatar: '', online: true, isVerified: false }
                    const conv = getOrCreateConversation(peer)
                    const newMsg = { id: `msg_${Date.now()}`, role: 'me', text: chatMsg, time: 'now' }
                    setChatMessages(p => [...p, newMsg])
                    addMessage(conv.id, { id: newMsg.id, senderId: 'me', text: chatMsg, timestamp: new Date(), status: 'sent' })
                    setChatMsg('')
                  }
                }}
                style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 480px) {
          .chat-popup-card {
            right: 8px !important;
            bottom: 8px !important;
            width: calc(100vw - 16px) !important;
            max-height: 60vh !important;
          }
        }
      `}</style>
    </div>
  )
}
