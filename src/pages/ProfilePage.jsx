import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Settings, MessageSquare, LinkIcon, Calendar, FileText, X, Grid, Tag, Lock, Check, Bookmark, Heart, MessageCircle, User, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { userService, followService, bookmarkService } from '../services'
import { useProfileStore } from '../stores/profileStore'
import { useChatStore } from '../stores/chatStore'
import { useUserAvatar } from '../stores/userAvatarStore'
import { useHighlightStore } from '../stores/highlightStore'
import { timeAgo } from '@/lib/timeAgo'
import ProfileBanner from '../components/ProfileBanner'
import ScopedErrorBoundary from '../components/ScopedErrorBoundary'
import PostCard from '../components/social/PostCard'

const C = {
  bg: '#020617', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  accent: '#00D2FF', green: '#34D399', cyan: '#00D2FF', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280', border: 'rgba(255,255,255,0.06)',
  amber: '#f59e0b', red: '#ef4444',
}

const POSTS_PER_PAGE = 20

function normalizeAuthor(raw) {
  if (!raw) return null
  if (raw.username && raw.display_name) {
    return { id: raw.id, name: raw.display_name, handle: `@${raw.username}`, avatar: raw.avatar_url, verified: raw.is_verified }
  }
  if (raw.handle || raw.name) {
    return {
      id: raw.id || null,
      name: raw.name || raw.display_name || 'User',
      handle: raw.handle || (raw.username ? `@${raw.username}` : '@user'),
      avatar: raw.avatar || raw.avatar_url || '',
      verified: raw.verified ?? raw.is_verified ?? false,
    }
  }
  return { id: raw.id || null, name: 'User', handle: '@user', avatar: '', verified: false }
}

function SectionFallback({ label }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '28px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>Couldn't load {label}</p>
      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Something went wrong loading this section.</p>
    </div>
  )
}

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
  </div>
)

export default function ProfilePage({ user: propUser, navigate, profileAuthor }) {
  const { user: firebaseUser } = useAuth()
  const { user: supaUser, profile: supaProfile } = useSupabaseAuth()
  const { profile, setProfile, isFollowing, setIsFollowing, toggleFollow } = useProfileStore()
  const { getOrCreateConversation } = useChatStore()
  const { avatar: globalAvatar, banner: globalBanner, displayName: globalDisplayName, bio: globalBio } = useUserAvatar()
  const { highlightsByUser, loadHighlights } = useHighlightStore()

  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [activeTab, setActiveTab] = useState('posts')
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [followersList, setFollowersList] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [savedPosts, setSavedPosts] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [postsPage, setPostsPage] = useState(0)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [loadingMorePosts, setLoadingMorePosts] = useState(false)
  const [postFilter, setPostFilter] = useState('all')
  const [profileListings, setProfileListings] = useState({ companies: [], products: [], ebooks: [] })
  const [listingsCategoryTab, setListingsCategoryTab] = useState('all')

  const activeUser = firebaseUser || propUser
  const currentUser = supaUser || activeUser
  const userId = currentUser?.id || currentUser?.uid || ''

  const normalizedAuthor = useMemo(() => normalizeAuthor(profileAuthor), [profileAuthor?.id, profileAuthor?.handle, profileAuthor?.name, profileAuthor?.username])

  const currentUsername = currentUser?.user_metadata?.username
    || currentUser?.username
    || currentUser?.displayName
    || ''

  const isOwnProfile = !normalizedAuthor || !normalizedAuthor.id || (currentUsername
    && (currentUsername === profile?.username || currentUsername === normalizedAuthor.handle?.replace('@', '')))

  const filteredPosts = useMemo(() => {
    if (postFilter === 'text') return userPosts.filter(p => !p.image_url && (!p.images || p.images.length === 0))
    if (postFilter === 'photos') return userPosts.filter(p => p.image_url || (p.images && p.images.length > 0))
    return userPosts
  }, [userPosts, postFilter])

  const postCounts = useMemo(() => ({
    all: userPosts.length,
    text: userPosts.filter(p => !p.image_url && (!p.images || p.images.length === 0)).length,
    photos: userPosts.filter(p => p.image_url || (p.images && p.images.length > 0)).length,
  }), [userPosts])

  const resolvedUsername = normalizedAuthor
    ? (normalizedAuthor.handle?.replace('@', '') || normalizedAuthor.name?.toLowerCase()?.replace(/\s/g, ''))
    : currentUsername || 'user'

  // Load profile data
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      if (normalizedAuthor) {
        try {
          let profileData = normalizedAuthor.id
            ? await userService.getProfileById(normalizedAuthor.id)
            : await userService.getProfile(resolvedUsername)
          if (!cancelled) {
            if (!profileData && normalizedAuthor.id) {
              profileData = {
                id: normalizedAuthor.id,
                username: normalizedAuthor.handle?.replace('@', '') || 'user',
                display_name: normalizedAuthor.name || 'User',
                avatar_url: normalizedAuthor.avatar || '',
                banner_url: '',
                bio: '', website: '', location: '',
                is_verified: normalizedAuthor.verified || false,
                followers_count: 0, following_count: 0, posts_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            }
            if (!profileData) { setProfile(null); setLoading(false); return }
            setProfile(profileData)
            if (!cancelled) setLoading(false)
            const followerId = currentUser?.id || currentUser?.uid
            const [following, posts, followers, followingData] = await Promise.all([
              followerId ? followService.isFollowing(followerId, profileData.id).catch(() => false) : Promise.resolve(false),
              userService.getUserPosts(profileData.id, followerId, 0, POSTS_PER_PAGE).catch(() => []),
              followService.getFollowers(profileData.id).catch(() => []),
              followService.getFollowing(profileData.id).catch(() => []),
            ])
            if (!cancelled) {
              setIsFollowing(following)
              setUserPosts(posts || [])
              setHasMorePosts((posts || []).length >= POSTS_PER_PAGE)
              setPostsPage(0)
              setFollowersList(followers || [])
              setFollowingList(followingData || [])
              setFollowersCount(profileData.followers_count || (followers || []).length || 0)
              setFollowingCount(profileData.following_count || (followingData || []).length || 0)
              loadHighlights(profileData.id)
            }
          }
        } catch {
          if (!cancelled) { setError('Failed to load profile'); setUserPosts([]) }
        }
      } else {
        setIsFollowing(false)
        setUserPosts([])
        setFollowersCount(0)
        setFollowingCount(0)
        setFollowersList([])
        setFollowingList([])
        const ownProfile = supaProfile || {
          id: currentUser?.id || currentUser?.uid || 'demo-user-id',
          username: currentUser?.user_metadata?.username || currentUser?.username || currentUser?.displayName || globalDisplayName?.toLowerCase().replace(/\s/g, '_') || 'user',
          display_name: globalDisplayName || currentUser?.user_metadata?.display_name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
          avatar_url: globalAvatar || currentUser?.user_metadata?.avatar_url || currentUser?.photoURL || '',
          banner_url: '',
          bio: globalBio || '',
          website: '', location: '',
          is_verified: false,
          followers_count: 0, following_count: 0, posts_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setProfile(ownProfile)
        if (!cancelled) setLoading(false)
        const ownUserId = currentUser?.id || currentUser?.uid
        const [posts, followers, followingData] = await Promise.all([
          userService.getUserPosts(ownProfile.id, ownUserId, 0, POSTS_PER_PAGE).catch(() => []),
          followService.getFollowers(ownProfile.id).catch(() => []),
          followService.getFollowing(ownProfile.id).catch(() => []),
        ])
        if (!cancelled) {
          setUserPosts(posts || [])
          setHasMorePosts((posts || []).length >= POSTS_PER_PAGE)
          setPostsPage(0)
          setFollowersList(followers || [])
          setFollowingList(followingData || [])
          setFollowersCount(ownProfile.followers_count || (followers || []).length || 0)
          setFollowingCount(ownProfile.following_count || (followingData || []).length || 0)
          loadHighlights(ownProfile.id)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [resolvedUsername, normalizedAuthor?.id, userId])

  // Lazy-load followers list when modal opens
  useEffect(() => {
    if (!showFollowers || followersList.length > 0 || !profile?.id) return
    let cancelled = false
    setFollowersLoading(true)
    followService.getFollowers(profile.id).then(data => {
      if (!cancelled) { setFollowersList(data || []); setFollowersLoading(false) }
    }).catch(() => { if (!cancelled) setFollowersLoading(false) })
    return () => { cancelled = true }
  }, [showFollowers, profile?.id])

  // Lazy-load following list when modal opens
  useEffect(() => {
    if (!showFollowing || followingList.length > 0 || !profile?.id) return
    let cancelled = false
    setFollowingLoading(true)
    followService.getFollowing(profile.id).then(data => {
      if (!cancelled) { setFollowingList(data || []); setFollowingLoading(false) }
    }).catch(() => { if (!cancelled) setFollowingLoading(false) })
    return () => { cancelled = true }
  }, [showFollowing, profile?.id])

  const loadMorePosts = useCallback(async () => {
    if (!profile || loadingMorePosts) return
    setLoadingMorePosts(true)
    try {
      const nextPage = postsPage + 1
      const followerId = currentUser?.id || currentUser?.uid
      const posts = await userService.getUserPosts(profile.id, followerId, nextPage, POSTS_PER_PAGE)
      if (posts && posts.length > 0) { setUserPosts(prev => [...prev, ...posts]); setPostsPage(nextPage); setHasMorePosts(posts.length >= POSTS_PER_PAGE) }
      else setHasMorePosts(false)
    } catch (err) { console.error('Failed to load more posts:', err) }
    setLoadingMorePosts(false)
  }, [profile, postsPage, loadingMorePosts, currentUser])

  const handleFollow = useCallback(async () => {
    const followerId = currentUser?.id || currentUser?.uid
    if (!followerId || !profile) return
    const nowFollowing = await toggleFollow(followerId, profile.id)
    setFollowersCount(prev => nowFollowing ? prev + 1 : prev - 1)
  }, [currentUser, profile, toggleFollow])

  const loadSavedPosts = useCallback(async () => {
    const uid = currentUser?.id || currentUser?.uid
    if (!uid) return
    setSavedLoading(true)
    try { const data = await bookmarkService.getUserBookmarks(uid); setSavedPosts(data || []) }
    catch (err) { console.error('Failed to load saved posts:', err) }
    setSavedLoading(false)
  }, [currentUser])

  useEffect(() => { if (activeTab === 'saved' && isOwnProfile) loadSavedPosts() }, [activeTab, isOwnProfile, loadSavedPosts])

  // Load listings for profile tab
  useEffect(() => {
    if (activeTab !== 'listings' || !profile?.id) return
    let cancelled = false
    const load = async () => {
      try {
        const { supabase } = await import('../lib/supabase')
        const [compRes, prodRes, ebookRes] = await Promise.all([
          supabase.from('companies').select('*').eq('registered_by', profile.id),
          supabase.from('products').select('*').eq('seller_id', profile.id),
          supabase.from('ebooks').select('*').eq('published_by', profile.id),
        ])
        if (!cancelled) {
          setProfileListings({
            companies: compRes.data || [],
            products: prodRes.data || [],
            ebooks: ebookRes.data || [],
          })
        }
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [activeTab, profile?.id])

  const displayName = isOwnProfile
    ? (globalDisplayName || profile?.display_name || activeUser?.username || 'User')
    : (profile?.display_name || normalizedAuthor?.name || 'User')
  const handle = isOwnProfile
    ? (profile?.username ? `@${profile.username}` : activeUser?.handle || '@user')
    : (profile?.username ? `@${profile.username}` : normalizedAuthor?.handle || '@user')
  const bio = isOwnProfile ? (globalBio || profile?.bio || '') : (profile?.bio || '')
  const avatar = isOwnProfile
    ? (globalAvatar || profile?.avatar_url || activeUser?.avatar || '')
    : (profile?.avatar_url || normalizedAuthor?.avatar || '')
  const bannerUrl = isOwnProfile
    ? (globalBanner || profile?.banner_url || '')
    : (profile?.banner_url || '')
  const isPrivate = profile?.is_private || false
  const isUnapproved = isPrivate && !isOwnProfile && !isFollowing
  const highlights = profile ? (highlightsByUser[profile.id] || []) : []

  const TABS = [
    { id: 'posts', icon: <Grid size={16} />, label: 'Posts' },
    ...(isOwnProfile ? [{ id: 'saved', icon: <Bookmark size={16} />, label: 'Saved' }] : []),
    { id: 'listings', icon: <Building2 size={16} />, label: 'Listings' },
    { id: 'tagged', icon: <User size={16} />, label: 'Tagged' },
  ]

  const renderUserRow = (f, onNavigate) => {
    if (!f) return null
    return (
      <div key={f.id || Math.random()} onClick={() => {
        onNavigate()
        navigate('profile', { author: { id: f.id, name: f.display_name, handle: f.username ? `@${f.username}` : undefined, avatar: f.avatar_url, verified: f.is_verified } })
      }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: f.avatar_url ? `url(${f.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff',
        }}>
          {!f.avatar_url && (f.display_name?.[0]?.toUpperCase() || '?')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.display_name || 'User'}</p>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>@{f.username || 'user'}</p>
        </div>
      </div>
    )
  }

  // ── Loading state ──
  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '0 20px' }}>
      <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#020617',
          backgroundImage: 'radial-gradient(circle at 25% 40%, rgba(0,210,255,0.08) 0%, transparent 55%), radial-gradient(circle at 75% 60%, rgba(123,97,255,0.08) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)', animation: 'pulse 2s infinite' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: -36, marginBottom: 12 }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: C.card, border: `3px solid ${C.bg}`, flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', animation: 'pulse 2s infinite' }} />
        </div>
      </div>
      {[140, 100].map((w, i) => (
        <div key={i} style={{ width: w, height: 16, borderRadius: 4, background: C.card, marginBottom: 6, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)', animation: 'pulse 2s infinite' }} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 56, borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)', animation: 'pulse 2s infinite' }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <FileText size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
      <p style={{ color: C.red, fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Something went wrong</p>
      <p style={{ color: C.muted, fontSize: 13, margin: '0 0 20px' }}>{error}</p>
      <button onClick={() => navigate('home')} style={{ padding: '10px 24px', borderRadius: 8, background: C.cyan, border: 'none', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Go Home</button>
    </div>
  )

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <User size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
      <p style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>User not found</p>
      <p style={{ color: C.muted, fontSize: 13, margin: '0 0 20px' }}>This account doesn't exist or has been removed.</p>
      <button onClick={() => navigate('home')} style={{ padding: '10px 24px', borderRadius: 8, background: C.cyan, border: 'none', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Go Home</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: '90px', position: 'relative' }}>
      {/* ── Banner ── */}
      <ProfileBanner
        bannerUrl={bannerUrl}
        isOwn={isOwnProfile}
        onEdit={() => navigate('settings')}
      />

      {/* ── Back / Settings buttons ── */}
      <button onClick={() => navigate('home')} style={{ position: 'absolute', top: 50, left: 16, width: 36, height: 36, borderRadius: 10, background: 'rgba(7,17,36,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
        <ArrowLeft size={18} />
      </button>
      <button onClick={() => navigate('settings')} style={{ position: 'absolute', top: 50, right: 16, width: 36, height: 36, borderRadius: 10, background: 'rgba(7,17,36,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
        <Settings size={18} />
      </button>

      {/* ── Profile Info ── */}
      <div style={{ padding: '0 20px 20px', position: 'relative', zIndex: 1 }}>
        {/* Avatar overlapping banner */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: -40, marginBottom: 12 }}>
          <div style={{
            width: 84, height: 84, borderRadius: '50%',
            background: avatar ? `url(${avatar}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff',
            border: `3px solid ${C.bg}`, flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            {!avatar && displayName[0]?.toUpperCase()}
          </div>
        </div>

        {/* Name + verified */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', color: C.text, margin: 0 }}>{displayName}</h1>
          {(profile?.is_verified || normalizedAuthor?.verified) && (
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={12} color="#000" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Handle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: bio ? 10 : 0 }}>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>{handle}</p>
          {isPrivate && <Lock size={12} color={C.muted} />}
        </div>

        {/* Bio */}
        {bio && <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: '1.65', margin: '0 0 10px' }}>{bio}</p>}

        {/* Website */}
        {profile?.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.cyan, textDecoration: 'none', marginBottom: 10 }}>
            <LinkIcon size={13} /> {profile.website.replace(/^https?:\/\//, '')}
          </a>
        )}

        {/* Location + Joined */}
        {(profile?.location || profile?.created_at) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted, marginBottom: 12, flexWrap: 'wrap' }}>
            {profile.location && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>{profile.location}</span>}
            {profile.created_at && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={12} /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        )}

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'posts', count: profile?.posts_count ?? userPosts.length },
            { label: 'followers', count: followersCount, action: () => setShowFollowers(true) },
            { label: 'following', count: followingCount, action: () => setShowFollowing(true) },
          ].map(s => (
            <motion.button key={s.label} whileTap={{ scale: 0.95 }} onClick={s.action} style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              background: C.card, border: `1px solid ${C.cardBdr}`,
              cursor: 'pointer', textAlign: 'center',
            }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{s.count.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{s.label}</div>
            </motion.button>
          ))}
        </div>

        {/* ── Action row ── */}
        {!isOwnProfile ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleFollow} style={{
              flex: 1, padding: 11, borderRadius: 10, cursor: 'pointer',
              background: isFollowing ? 'rgba(0,210,255,0.15)' : C.cyan,
              border: isFollowing ? '1px solid rgba(0,210,255,0.3)' : '1px solid transparent',
              color: isFollowing ? C.cyan : '#000', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
            }}>
              {isFollowing ? 'Following' : 'Follow'}
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => {
                const username = normalizedAuthor?.handle?.replace('@', '') || profile?.username || displayName
                const id = normalizedAuthor?.id || profile?.id || ''
                const avatarUrl = normalizedAuthor?.avatar || profile?.avatar_url || ''
                navigate('chat', { chat: { username, id, avatar: avatarUrl, displayName } })
              }}
              style={{
                flex: 1, padding: 11, borderRadius: 10,
                border: `1px solid ${C.cardBdr}`, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', color: '#e5e7eb',
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
              <MessageSquare size={14} /> Message
            </motion.button>
          </div>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('settings')}
            style={{
              width: '100%', padding: 11, borderRadius: 10,
              border: `1px solid ${C.accent}`, cursor: 'pointer',
              background: 'rgba(0,210,255,0.08)', color: C.cyan,
              fontSize: 13, fontWeight: 700, transition: 'all 0.2s', textAlign: 'center',
            }}>
            Edit Profile
          </motion.button>
        )}
      </div>

      {/* ── Highlights ── */}
      {highlights.length > 0 && (
        <ScopedErrorBoundary fallback={<SectionFallback label="highlights" />}>
          <div style={{ padding: '8px 20px 16px', borderBottom: `1px solid ${C.cardBdr}`, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {highlights.map(hl => (
                <div key={hl.id} onClick={() => alert('Highlight detail coming soon')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', minWidth: 64 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: hl.cover_url ? `url(${hl.cover_url}) center/cover` : C.card,
                  }}>
                    {!hl.cover_url && <Bookmark size={20} color={C.muted} />}
                  </div>
                  <span style={{ fontSize: 10, color: C.muted, textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hl.title}</span>
                </div>
              ))}
            </div>
          </div>
        </ScopedErrorBoundary>
      )}

      {isUnapproved && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, position: 'relative', zIndex: 1 }}>
          <Lock size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>This account is private</p>
          <p style={{ fontSize: 13, margin: 0 }}>Follow to see their posts</p>
        </div>
      )}

      {!isUnapproved && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ── Tab bar with labels ── */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderBottom: `1px solid ${C.cardBdr}` }}>
            {TABS.map(tab => (
              <motion.button key={tab.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? 'rgba(0,210,255,0.12)' : 'transparent',
                color: activeTab === tab.id ? C.cyan : C.muted,
                transition: 'all 0.2s',
              }}>
                {tab.icon}
                <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>
              </motion.button>
            ))}
          </div>

          {/* ── Filter chips ── */}
          {activeTab === 'posts' && userPosts.length > 0 && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${C.cardBdr}` }}>
              {[
                { id: 'all', label: 'All', count: postCounts.all },
                { id: 'text', label: 'Text', count: postCounts.text },
                { id: 'photos', label: 'Photos', count: postCounts.photos },
              ].map(f => (
                <button key={f.id} onClick={() => setPostFilter(f.id)} style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${postFilter === f.id ? C.accent : 'rgba(255,255,255,0.08)'}`,
                  background: postFilter === f.id ? 'rgba(0,210,255,0.12)' : 'rgba(255,255,255,0.03)',
                  color: postFilter === f.id ? C.cyan : C.muted,
                  transition: 'all 0.2s',
                }}>
                  {f.label} <span style={{ opacity: 0.5, marginLeft: 2, fontSize: 11 }}>{f.count}</span>
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── Posts tab ── */}
            {activeTab === 'posts' && (
              <ScopedErrorBoundary key="posts-boundary" fallback={<SectionFallback label="posts" />}>
                <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {userPosts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                      <FileText size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                      <p style={{ fontSize: 14, margin: 0 }}>No posts yet</p>
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                      <FileText size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                      <p style={{ fontSize: 14, margin: 0 }}>No {postFilter === 'text' ? 'text' : 'photo'} posts yet</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        {filteredPosts.map((post, i) => (
                          <PostCard key={post.id} post={post} navigate={navigate} delay={i * 0.03} />
                        ))}
                      </div>
                      {hasMorePosts && (
                        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center' }}>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={loadMorePosts} disabled={loadingMorePosts}
                            style={{ padding: '10px 28px', borderRadius: 8, border: `1px solid ${C.cardBdr}`, background: 'rgba(255,255,255,0.04)', color: C.text, fontSize: 13, fontWeight: 600, cursor: loadingMorePosts ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {loadingMorePosts && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />}
                            {loadingMorePosts ? 'Loading...' : 'Load More'}
                          </motion.button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </ScopedErrorBoundary>
            )}

            {/* ── Saved tab ── */}
            {activeTab === 'saved' && isOwnProfile && (
              <ScopedErrorBoundary key="saved-boundary" fallback={<SectionFallback label="saved posts" />}>
                <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {savedLoading ? (
                    <Spinner />
                  ) : savedPosts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                      <Bookmark size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                      <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>No saved posts yet</p>
                      <p style={{ fontSize: 13, margin: 0 }}>Save posts to read later</p>
                    </div>
                  ) : (
                    <div>
                      {savedPosts.map((bookmark, i) => {
                        const post = bookmark.post
                        if (!post) return null
                        if (!post.author && post.author_username) {
                          post.author = { id: post.author_id, display_name: post.author_display_name, username: post.author_username, avatar_url: post.author_avatar, banner_url: '', bio: '', website: '', location: '', is_verified: false, followers_count: 0, following_count: 0, posts_count: 0, created_at: post.created_at, updated_at: post.updated_at }
                        }
                        return <PostCard key={bookmark.id} post={post} navigate={navigate} delay={i * 0.03} />
                      })}
                    </div>
                  )}
                </motion.div>
              </ScopedErrorBoundary>
            )}

            {/* ── Tagged tab ── */}
            {activeTab === 'tagged' && (
              <ScopedErrorBoundary key="tagged-boundary" fallback={<SectionFallback label="tagged posts" />}>
                <motion.div key="tagged" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                    <Tag size={40} style={{ opacity: 0.2, marginBottom: 10 }} />
                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>Tagged posts</p>
                    <p style={{ fontSize: 13, margin: 0 }}>Posts you're tagged in will appear here</p>
                  </div>
                </motion.div>
              </ScopedErrorBoundary>
            )}

            {/* ── Listings tab ── */}
            {activeTab === 'listings' && (
              <ScopedErrorBoundary key="listings-boundary" fallback={<SectionFallback label="listings" />}>
                <motion.div key="listings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${C.cardBdr}` }}>
                    {[
                      { id: 'all', label: 'All', count: profileListings.companies.length + profileListings.products.length + profileListings.ebooks.length },
                      { id: 'suppliers', label: 'Suppliers', count: profileListings.companies.length },
                      { id: 'products', label: 'Products', count: profileListings.products.length },
                      { id: 'magazines', label: 'Magazines', count: profileListings.ebooks.length },
                    ].map(f => (
                      <button key={f.id} onClick={() => setListingsCategoryTab(f.id)} style={{
                        padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${listingsCategoryTab === f.id ? C.accent : 'rgba(255,255,255,0.08)'}`,
                        background: listingsCategoryTab === f.id ? 'rgba(0,210,255,0.12)' : 'rgba(255,255,255,0.03)',
                        color: listingsCategoryTab === f.id ? C.cyan : C.muted,
                        transition: 'all 0.2s',
                      }}>
                        {f.label} <span style={{ opacity: 0.5, marginLeft: 2, fontSize: 11 }}>{f.count}</span>
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const allItems = [
                      ...profileListings.companies.map(c => ({ ...c, _type: 'company' })),
                      ...profileListings.products.map(p => ({ ...p, _type: 'product' })),
                      ...profileListings.ebooks.map(e => ({ ...e, _type: 'ebook' })),
                    ]
                    const filtered = listingsCategoryTab === 'all' ? allItems : allItems.filter(i => {
                      if (listingsCategoryTab === 'suppliers') return i._type === 'company'
                      if (listingsCategoryTab === 'products') return i._type === 'product'
                      if (listingsCategoryTab === 'magazines') return i._type === 'ebook'
                      return true
                    })
                    if (filtered.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                          <Building2 size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                          <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
                            {listingsCategoryTab === 'all' ? 'No listings yet' : `No ${listingsCategoryTab} listed`}
                          </p>
                          <p style={{ fontSize: 13, margin: 0 }}>Published listings will appear here</p>
                        </div>
                      )
                    }
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, padding: '12px 16px' }}>
                        {filtered.map(item => (
                          <motion.div key={item.id} whileHover={{ y: -2 }}
                            onClick={() => {
                              if (item._type === 'company') navigate('supplierDetail', { company: item })
                              else if (item._type === 'product') navigate('productDetail', { product: item })
                              else navigate('magazineDetail', { ebook: item })
                            }}
                            style={{
                              background: C.card, border: `1px solid ${C.cardBdr}`,
                              borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                            }}>
                            {(item.cover_url || (item.images && item.images[0])) && (
                              <div style={{ height: 100, background: `url(${item.cover_url || item.images[0]}) center/cover` }} />
                            )}
                            <div style={{ padding: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 700,
                                  color: item._type === 'company' ? '#2563eb' : item._type === 'product' ? '#059669' : '#f59e0b',
                                  background: item._type === 'company' ? 'rgba(37,99,235,0.12)' : item._type === 'product' ? 'rgba(5,150,105,0.12)' : 'rgba(245,158,11,0.12)',
                                  padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize',
                                }}>{item._type}</span>
                                {item.price && (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>${item.price.toLocaleString()}</span>
                                )}
                              </div>
                              <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.name || item.title || 'Untitled'}
                              </h4>
                              {item.description && (
                                <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  })()}
                </motion.div>
              </ScopedErrorBoundary>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Followers Modal ── */}
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
                <button onClick={() => setShowFollowers(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {followersLoading ? (
                  <Spinner />
                ) : followersList.filter(Boolean).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: C.muted, fontSize: 13 }}>No followers yet</div>
                ) : (
                  <>
                    {followersList.filter(Boolean).length >= 50 && <div style={{ textAlign: 'center', padding: '8px 0', color: C.muted, fontSize: 11 }}>Showing first 50</div>}
                    {followersList.filter(Boolean).map(f => renderUserRow(f, () => setShowFollowers(false)))}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Following Modal ── */}
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
                <button onClick={() => setShowFollowing(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {followingLoading ? (
                  <Spinner />
                ) : followingList.filter(Boolean).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: C.muted, fontSize: 13 }}>Not following anyone yet</div>
                ) : (
                  <>
                    {followingList.filter(Boolean).length >= 50 && <div style={{ textAlign: 'center', padding: '8px 0', color: C.muted, fontSize: 11 }}>Showing first 50</div>}
                    {followingList.filter(Boolean).map(f => renderUserRow(f, () => setShowFollowing(false)))}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
