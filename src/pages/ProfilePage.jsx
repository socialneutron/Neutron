import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Settings, MessageSquare, MapPin, LinkIcon, Calendar, TrendingUp, FileText, MessageCircle, Send, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { userService, followService, postService } from '../services'
import { useProfileStore } from '../stores/profileStore'
import { useChatStore } from '../stores/chatStore'
import { useUserAvatar } from '../stores/userAvatarStore'
import PostCard from '../components/social/PostCard'
import { ASSET_LISTINGS } from '../marketplace/data'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  accent: '#00D2FF', green: '#34D399', cyan: '#00D2FF', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280', border: 'rgba(255,255,255,0.06)',
  amber: '#f59e0b', red: '#ef4444',
}

function catColor(cat) {
  const m = { 'Digital Assets':'#00D2FF','Creative Assets':'#7928CA','Intellectual Property':'#0891b2','Business Marketplace':'#d97706','Financial Opportunities':'#f59e0b','Real Estate':'#059669','Physical Products':'#b45309' }
  return m[cat] || '#4b5563'
}

export default function ProfilePage({ user: propUser, navigate, profileAuthor }) {
  const { user: firebaseUser } = useAuth()
  const { user: supaUser, profile: supaProfile } = useSupabaseAuth()
  const { profile, setProfile, isFollowing, setIsFollowing, toggleFollow } = useProfileStore()
  const { getOrCreateConversation, addMessage } = useChatStore()
  const { avatar: globalAvatar, displayName: globalDisplayName, bio: globalBio } = useUserAvatar()

  const [userPosts, setUserPosts] = useState([])
  const [activeTab, setActiveTab] = useState('assets')
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatSessionId, setChatSessionId] = useState(null)
  const chatEndRef = useRef(null)

  const activeUser = firebaseUser || propUser
  const isViewingOther = !!profileAuthor
  const resolvedUsername = isViewingOther
    ? (profileAuthor.handle?.replace('@', '') || profileAuthor.name?.toLowerCase()?.replace(/\s/g, ''))
    : (supaUser?.user_metadata?.username || activeUser?.username || 'pratham')

  // Load profile from Supabase
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      if (isViewingOther && resolvedUsername) {
        try {
          const profileData = await userService.getProfile(resolvedUsername)
          if (!cancelled && profileData) {
            setProfile(profileData)
            if (supaUser) {
              const following = await followService.isFollowing(supaUser.id, profileData.id)
              if (!cancelled) setIsFollowing(following)
            }
            const posts = await userService.getUserPosts(profileData.id)
            if (!cancelled) setUserPosts(posts || [])
          }
        } catch {
          if (!cancelled) setUserPosts([])
        }
      } else if (supaProfile) {
        setProfile(supaProfile)
        try {
          const posts = await userService.getUserPosts(supaProfile.id)
          if (!cancelled) setUserPosts(posts || [])
        } catch { if (!cancelled) setUserPosts([]) }
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [resolvedUsername, isViewingOther, supaUser, supaProfile, setProfile, setIsFollowing])

  const handleFollow = useCallback(async () => {
    const followerId = supaUser?.id || activeUser?.uid
    if (!followerId || !profile) return
    await toggleFollow(followerId, profile.id)
  }, [supaUser, activeUser, profile, toggleFollow])

  const isOwnProfile = !isViewingOther

  const displayName = isOwnProfile
    ? (globalDisplayName || profile?.display_name || activeUser?.username || 'Pratham')
    : (profile?.display_name || profileAuthor?.name || 'User')
  const handle = isOwnProfile
    ? (profile?.username ? `@${profile.username}` : activeUser?.handle || '@pratham')
    : (profile?.username ? `@${profile.username}` : profileAuthor?.handle || '@user')
  const bio = isOwnProfile
    ? (globalBio || profile?.bio || 'Building high-performance decentralized applications.')
    : (profile?.bio || '')
  const avatar = isOwnProfile
    ? (globalAvatar || profile?.avatar_url || activeUser?.avatar || '')
    : (profile?.avatar_url || profileAuthor?.avatar || '')
  const userAssets = ASSET_LISTINGS.slice(0, 4)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: '90px' }}>
      {/* Cover */}
      <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#090914,#05050A)', backgroundImage: 'radial-gradient(circle at 20% 50%,rgba(0,210,255,0.12) 0%,transparent 60%),radial-gradient(circle at 80% 30%,rgba(121,40,202,0.12) 0%,transparent 60%)' }} />
        <button onClick={() => navigate('home')} style={{ position: 'absolute', top: '50px', left: '16px', width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(7,17,36,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,210,255,0.1)', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <ArrowLeft size={20} />
        </button>
        {isOwnProfile && (
          <button onClick={() => navigate('settings')} style={{ position: 'absolute', top: '50px', right: '16px', width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(7,17,36,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,210,255,0.1)', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginTop: '-36px', marginBottom: '14px' }}>
          <div style={{
            width: '76px', height: '76px', borderRadius: '20px',
            background: avatar ? `url(${avatar}) center/cover` : 'linear-gradient(135deg,#00D2FF,#7928CA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, color: '#fff',
            border: '3px solid #05050A', flexShrink: 0,
          }}>
            {!avatar && displayName[0]?.toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', color: C.text, margin: 0 }}>{displayName}</h1>
            {(profile?.is_verified || profileAuthor?.verified) && <span style={{ background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)', borderRadius: '4px', padding: '2px 6px', fontSize: '9px', fontWeight: 700, color: C.cyan, letterSpacing: '0.06em' }}>VERIFIED</span>}
          </div>
          <p style={{ color: C.muted, fontSize: '14px', margin: 0 }}>{handle}</p>
          {bio && <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.65', margin: 0 }}>{bio}</p>}

          {/* Meta */}
          {(profile?.location || profile?.website || profile?.created_at) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
              {profile.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.muted }}><MapPin size={14} /> {profile.location}</span>}
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.cyan, textDecoration: 'none' }}><LinkIcon size={14} /> {profile.website.replace(/^https?:\/\//, '')}</a>}
              {profile.created_at && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.muted }}><Calendar size={14} /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, padding: '14px 0', borderTop: '1px solid rgba(0,210,255,0.08)', borderBottom: '1px solid rgba(0,210,255,0.08)', marginTop: 8 }}>
            {[
              { val: profile?.posts_count || userPosts.length || 0, label: 'Posts' },
              { val: profile?.followers_count || 0, label: 'Followers' },
              { val: profile?.following_count || 0, label: 'Following' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{s.val.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {isOwnProfile ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('settings')}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${C.cardBdr}`, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', fontSize: 14, fontWeight: 700, transition: 'all 0.2s' }}
              >
                <Settings size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Edit Profile
              </motion.button>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleFollow}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                    background: isFollowing ? 'rgba(0,210,255,0.15)' : 'rgba(5,5,10,0.4)',
                    border: isFollowing ? '1px solid rgba(0,210,255,0.3)' : '1px solid rgba(0,210,255,0.3)',
                    color: isFollowing ? C.cyan : '#e5e7eb', fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
                  }}
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    const peer = {
                      id: profileAuthor?.handle || profile?.username || displayName,
                      username: displayName,
                      avatar: profileAuthor?.avatar || avatar,
                      online: true, isVerified: profileAuthor?.verified || false,
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
        {[
          { id: 'assets', label: 'Assets', icon: <span>📦</span> },
          { id: 'posts', label: 'Posts', icon: <FileText size={14} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 0', background: 'none', border: 'none',
            borderBottom: activeTab === tab.id ? '2px solid #00D2FF' : '2px solid transparent',
            color: activeTab === tab.id ? C.cyan : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'assets' && (
          <motion.div key="assets" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {userAssets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
                <p style={{ margin: 0, fontSize: 14 }}>No assets listed</p>
              </div>
            ) : (
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {userAssets.map(asset => (
                  <div key={asset.id} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 12, background: C.card, border: `1px solid ${C.cardBdr}`, cursor: 'pointer' }}
                    onClick={() => navigate('topic', { topic: asset.category })}>
                    {asset.image && <img src={asset.image} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>{asset.name}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>{asset.category}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: C.cyan }}>${(asset.currentValuation || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
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
      </AnimatePresence>

      {/* Chat Popup */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
              width: 360, maxHeight: 500, background: '#090914', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                  {displayName[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>{displayName}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} /> Online</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 120, maxHeight: 320 }}>
              {chatMessages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', color: '#6b7280', textAlign: 'center' }}>
                  <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>Start a conversation with {displayName}...</p>
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
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Type a message..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && chatMsg.trim()) {
                    const peer = { id: profileAuthor?.handle || displayName, username: displayName, avatar: '', online: true, isVerified: false }
                    const conv = getOrCreateConversation(peer)
                    const newMsg = { id: `msg_${Date.now()}`, role: 'me', text: chatMsg, time: 'now' }
                    setChatMessages(p => [...p, newMsg])
                    addMessage(conv.id, { id: newMsg.id, senderId: 'me', text: chatMsg, timestamp: new Date(), status: 'delivered' })
                    setChatMsg('')
                  }
                }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none' }}
              />
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (chatMsg.trim()) {
                    const peer = { id: profileAuthor?.handle || displayName, username: displayName, avatar: '', online: true, isVerified: false }
                    const conv = getOrCreateConversation(peer)
                    const newMsg = { id: `msg_${Date.now()}`, role: 'me', text: chatMsg, time: 'now' }
                    setChatMessages(p => [...p, newMsg])
                    addMessage(conv.id, { id: newMsg.id, senderId: 'me', text: chatMsg, timestamp: new Date(), status: 'delivered' })
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
    </div>
  )
}
