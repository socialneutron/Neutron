import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Settings, MessageSquare, LinkIcon, Calendar, FileText, Send, X, Grid, Tag, Lock, Check, Bookmark, Heart, MessageCircle, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { userService, followService } from '../services'
import { useProfileStore } from '../stores/profileStore'
import { useChatStore } from '../stores/chatStore'
import { useUserAvatar } from '../stores/userAvatarStore'
import { useHighlightStore } from '../stores/highlightStore'
import PostCard from '../components/social/PostCard'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  accent: '#00D2FF', green: '#34D399', cyan: '#00D2FF', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280', border: 'rgba(255,255,255,0.06)',
  amber: '#f59e0b', red: '#ef4444',
}

export default function ProfilePage({ user: propUser, navigate, profileAuthor }) {
  const { user: firebaseUser } = useAuth()
  const { user: supaUser, profile: supaProfile } = useSupabaseAuth()
  const { profile, setProfile, isFollowing, setIsFollowing, toggleFollow } = useProfileStore()
  const { getOrCreateConversation, addMessage } = useChatStore()
  const { avatar: globalAvatar, displayName: globalDisplayName, bio: globalBio } = useUserAvatar()
  const { highlightsByUser, loadHighlights } = useHighlightStore()

  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [activeTab, setActiveTab] = useState('posts')
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [followersList, setFollowersList] = useState([])
  const [followingList, setFollowingList] = useState([])
  const chatEndRef = useRef(null)

  const activeUser = firebaseUser || propUser
  const isViewingOther = !!profileAuthor

  const currentUser = supaUser || activeUser
  const currentUsername = currentUser?.user_metadata?.username
    || currentUser?.username
    || currentUser?.displayName
    || ''

  const isOwnProfile = !isViewingOther
  const isSelf = isViewingOther
    && currentUsername
    && (currentUsername === profile?.username || currentUsername === profileAuthor?.handle?.replace('@', ''))

  const resolvedUsername = isViewingOther
    ? (profileAuthor.handle?.replace('@', '') || profileAuthor.name?.toLowerCase()?.replace(/\s/g, ''))
    : currentUsername || 'pratham'

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      if (isViewingOther) {
        try {
          const profileData = profileAuthor.id
            ? await userService.getProfileById(profileAuthor.id)
            : await userService.getProfile(resolvedUsername)
          if (!cancelled && profileData) {
            setProfile(profileData)
            const followerId = currentUser?.id || currentUser?.uid
            if (followerId) {
              const following = await followService.isFollowing(followerId, profileData.id)
              if (!cancelled) setIsFollowing(following)
            }
            const posts = await userService.getUserPosts(profileData.id, followerId)
            if (!cancelled) setUserPosts(posts || [])

            const followers = await followService.getFollowers(profileData.id)
            const followingList = await followService.getFollowing(profileData.id)
            if (!cancelled) {
              setFollowersCount(followers.length || profileData.followers_count || 0)
              setFollowingCount(followingList.length || profileData.following_count || 0)
            }
            if (!cancelled) loadHighlights(profileData.id)
          }
        } catch {
          if (!cancelled) setUserPosts([])
        }
      } else if (supaProfile) {
        setProfile(supaProfile)
        try {
          const posts = await userService.getUserPosts(supaProfile.id, currentUser?.id || currentUser?.uid)
          if (!cancelled) setUserPosts(posts || [])

          const followers = await followService.getFollowers(supaProfile.id)
          const followingList = await followService.getFollowing(supaProfile.id)
          if (!cancelled) {
            setFollowersCount(followers.length || supaProfile.followers_count || 0)
            setFollowingCount(followingList.length || supaProfile.following_count || 0)
          }
          if (!cancelled) loadHighlights(supaProfile.id)
        } catch {
          if (!cancelled) setUserPosts([])
        }
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [resolvedUsername, isViewingOther, currentUser, supaProfile, setProfile, setIsFollowing, profileAuthor?.id, loadHighlights])

  const handleFollow = useCallback(async () => {
    const followerId = currentUser?.id || currentUser?.uid
    if (!followerId || !profile) return
    const nowFollowing = await toggleFollow(followerId, profile.id)
    setFollowersCount(prev => nowFollowing ? prev + 1 : prev - 1)
  }, [currentUser, profile, toggleFollow])

  const loadFollowersList = useCallback(async () => {
    if (!profile) return
    const list = await followService.getFollowers(profile.id)
    setFollowersList(list)
  }, [profile])

  const loadFollowingList = useCallback(async () => {
    if (!profile) return
    const list = await followService.getFollowing(profile.id)
    setFollowingList(list)
  }, [profile])

  const displayName = isOwnProfile
    ? (globalDisplayName || profile?.display_name || activeUser?.username || 'Pratham')
    : (profile?.display_name || profileAuthor?.name || 'User')
  const handle = isOwnProfile
    ? (profile?.username ? `@${profile.username}` : activeUser?.handle || '@pratham')
    : (profile?.username ? `@${profile.username}` : profileAuthor?.handle || '@user')
  const bio = isOwnProfile
    ? (globalBio || profile?.bio || '')
    : (profile?.bio || '')
  const avatar = isOwnProfile
    ? (globalAvatar || profile?.avatar_url || activeUser?.avatar || '')
    : (profile?.avatar_url || profileAuthor?.avatar || '')

  const isPrivate = profile?.is_private || false
  const isUnapproved = isPrivate && !isOwnProfile && !isFollowing

  const highlights = profile ? (highlightsByUser[profile.id] || []) : []

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
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginTop: '-36px', marginBottom: '8px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: avatar ? `url(${avatar}) center/cover` : 'linear-gradient(135deg,#00D2FF,#7928CA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 900, color: '#fff',
            border: '3px solid #05050A', flexShrink: 0,
          }}>
            {!avatar && displayName[0]?.toUpperCase()}
          </div>
        </div>

        {/* Display Name & Verified */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 2 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px', color: C.text, margin: 0 }}>{displayName}</h1>
          {(profile?.is_verified || profileAuthor?.verified) && (
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={12} color="#000" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Username & Privacy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: bio ? 8 : 0 }}>
          <p style={{ color: C.muted, fontSize: '14px', margin: 0 }}>{handle}</p>
          {isPrivate && <Lock size={12} color={C.muted} />}
        </div>

        {/* Bio */}
        {bio && <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.65', margin: '0 0 8px' }}>{bio}</p>}

        {/* Link */}
        {(profile?.website) && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.cyan, textDecoration: 'none', marginBottom: 8 }}>
            <LinkIcon size={13} /> {profile.website.replace(/^https?:\/\//, '')}
          </a>
        )}

        {/* Joined date */}
        {profile?.created_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted, marginBottom: 8 }}>
            <Calendar size={12} /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, padding: '12px 0', marginTop: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{userPosts.length.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: C.muted }}>posts</span>
          </div>
          <div onClick={() => { loadFollowersList(); setShowFollowers(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 1, cursor: 'pointer' }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{followersCount.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: C.muted }}>followers</span>
          </div>
          <div onClick={() => { loadFollowingList(); setShowFollowing(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 1, cursor: 'pointer' }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{followingCount.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: C.muted }}>following</span>
          </div>
        </div>

        {/* Action buttons */}
        {!isOwnProfile && !isSelf && (
          <div style={{ display: 'flex', gap: '10px', marginTop: 4 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleFollow}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                background: isFollowing ? 'rgba(0,210,255,0.15)' : C.cyan,
                border: isFollowing ? '1px solid rgba(0,210,255,0.3)' : '1px solid transparent',
                color: isFollowing ? C.cyan : '#000', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => {
                const peer = {
                  id: profileAuthor?.handle || profile?.username || displayName,
                  username: displayName,
                  avatar: profileAuthor?.avatar || avatar,
                  online: true, isVerified: profileAuthor?.verified || false,
                }
                getOrCreateConversation(peer)
                setChatMessages([])
                setShowChat(true)
              }}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${C.cardBdr}`, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <MessageSquare size={14} /> Message
            </motion.button>
          </div>
        )}
        {isOwnProfile && (
          <div style={{ display: 'flex', gap: '10px', marginTop: 4 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('settings')}
              style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid rgba(0,210,255,0.4)`, cursor: 'pointer', background: 'rgba(0,210,255,0.08)', color: C.cyan, fontSize: 13, fontWeight: 700, transition: 'all 0.2s', textAlign: 'center' }}
            >
              Edit Profile
            </motion.button>
          </div>
        )}
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div style={{ padding: '8px 20px 16px', borderBottom: `1px solid ${C.cardBdr}` }}>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {highlights.map(hl => (
              <div key={hl.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', minWidth: 64 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `url(${hl.cover_url}) center/cover`,
                }}>
                  {!hl.cover_url && <Bookmark size={20} color={C.muted} />}
                </div>
                <span style={{ fontSize: 10, color: C.muted, textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hl.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Private profile notice */}
      {isUnapproved && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
          <Lock size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>This account is private</p>
          <p style={{ fontSize: 13, margin: 0 }}>Follow to see their posts</p>
        </div>
      )}

      {/* Tabs */}
      {!isUnapproved && (
        <>
          <div style={{ display: 'flex', borderTop: `1px solid ${C.cardBdr}` }}>
            {[
              { id: 'posts', icon: <Grid size={18} /> },
              { id: 'tagged', icon: <User size={18} /> },
              { id: 'saved', icon: <Bookmark size={18} /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 0', background: 'none', border: 'none',
                borderTop: activeTab === tab.id ? '1px solid #00D2FF' : '1px solid transparent',
                color: activeTab === tab.id ? C.cyan : C.muted, cursor: 'pointer',
              }}>
                {tab.icon}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 'posts' && (
              <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {userPosts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                    <FileText size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                    <p style={{ fontSize: 14, margin: 0 }}>No posts yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                    {userPosts.map((post) => (
                      <motion.div key={post.id} whileHover={{ opacity: 0.85 }} onClick={() => navigate('post', { postId: post.id })}
                        style={{ aspectRatio: '1', background: post.image_url ? `url(${post.image_url}) center/cover` : 'linear-gradient(135deg, rgba(0,210,255,0.08), rgba(121,40,202,0.08))', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                        {!post.image_url && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
                            <span style={{ fontSize: 9, color: C.muted, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{post.title}</span>
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 4, right: 5, display: 'flex', gap: 5 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 1, color: '#fff', fontSize: 9, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}><Heart size={9} fill="#fff" /> {post.likes_count || 0}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 1, color: '#fff', fontSize: 9, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}><MessageCircle size={9} fill="#fff" /> {post.comments_count || 0}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === 'tagged' && (
              <motion.div key="tagged" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                  <Tag size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p style={{ fontSize: 14, margin: 0 }}>No tagged posts yet</p>
                </div>
              </motion.div>
            )}
            {activeTab === 'saved' && (
              <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                  <Bookmark size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p style={{ fontSize: 14, margin: 0 }}>No saved posts yet</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Followers Modal */}
      <AnimatePresence>
        {showFollowers && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowFollowers(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 500, maxHeight: '70vh', background: '#090914', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Followers</span>
                <button onClick={() => setShowFollowers(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {followersList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: C.muted, fontSize: 13 }}>No followers yet</div>
                ) : (
                  followersList.map(f => (
                    <div key={f.id} onClick={() => { setShowFollowers(false); navigate('profile', { author: f }) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: f.avatar_url ? `url(${f.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {!f.avatar_url && f.display_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.display_name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted }}>@{f.username}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Following Modal */}
      <AnimatePresence>
        {showFollowing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowFollowing(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 500, maxHeight: '70vh', background: '#090914', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Following</span>
                <button onClick={() => setShowFollowing(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {followingList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: C.muted, fontSize: 13 }}>Not following anyone yet</div>
                ) : (
                  followingList.map(f => (
                    <div key={f.id} onClick={() => { setShowFollowing(false); navigate('profile', { author: f }) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: f.avatar_url ? `url(${f.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {!f.avatar_url && f.display_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.display_name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted }}>@{f.username}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
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
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
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
