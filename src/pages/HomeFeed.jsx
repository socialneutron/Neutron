import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Bell, TrendingUp, Hash, X, Send } from 'lucide-react'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { useFeedStore } from '../stores/feedStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useUserAvatar } from '../stores/userAvatarStore'
import { feedService, notificationService, postService } from '../services'
import PostCard from '../components/social/PostCard'
import { useToast } from '../components/ToastNotification'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', text: '#f1f5f9', muted: '#6b7280',
  green: '#34D399', purple: '#7928CA',
}

const CATEGORIES = ['All', 'Digital Assets', 'Creative Assets', 'Intellectual Property', 'Business Marketplace', 'Financial Opportunities', 'Real Estate', 'Physical Products']

const TRENDING_TAGS = ['#DigitalAssets', '#NFTs', '#DeFi', '#Web3', '#Blockchain', '#CryptoArt', '#SmartContracts']

export default function HomeFeed({ navigate, user, sharedAssetData, onClearAssetData }) {
  const { user: supaUser } = useSupabaseAuth()
  const { posts, loading, loadMore, refresh, feedType, setFeedType } = useFeedStore()
  const { unreadCount, incrementUnread, setUnreadCount } = useNotificationStore()
  const { avatar: globalAvatar, displayName: globalName } = useUserAvatar()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [error, setError] = useState(null)
  const [pullDistance, setPullDistance] = useState(0)
  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)
  const hasLoadedOnce = useRef(false)
  const scrollContainerRef = useRef(null)
  const touchStartY = useRef(null)
  const isRefreshing = useRef(false)

  const currentUser = supaUser || user

  const stableUserId = currentUser?.id

  useEffect(() => {
    if (!stableUserId) return
    setError(null)
    refresh(stableUserId).catch((err) => {
      console.error('Failed to refresh feed:', err)
      setError('Failed to load feed')
    })
    hasLoadedOnce.current = true
  }, [refresh, stableUserId])

  useEffect(() => {
    if (!currentUser) return
    const channel = notificationService.subscribe(currentUser.id, (notification) => { incrementUnread(); addToast(notification) })
    notificationService.getUnreadCount(currentUser.id).then(setUnreadCount)
    return () => { channel.unsubscribe() }
  }, [currentUser, incrementUnread, setUnreadCount, addToast])

  useEffect(() => {
    if (!loadMoreRef.current) return
    const el = loadMoreRef.current
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading) {
        loadMore(currentUser?.id).catch((err) => {
          console.error('Failed to load more posts:', err)
          setError('Failed to load more posts')
        })
      }
    }, { threshold: 0.1 })
    observerRef.current.observe(el)
    return () => observerRef.current?.disconnect()
  }, [loading, loadMore, currentUser?.id])

  useEffect(() => {
    if (!loadMoreRef.current || loading) return
    if (observerRef.current && loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
  }, [loading])

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); setSearching(false); return }
    setSearching(true)
    try {
      const results = await feedService.searchExplore(q)
      setSearchResults(results.posts || [])
    } catch (err) {
      console.error('Search failed:', err)
      setSearchResults([])
    }
    setSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { if (searchQuery) handleSearch(searchQuery) }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return posts
    return posts.filter(p => p.tags?.includes(activeCategory) || p.category === activeCategory)
  }, [posts, activeCategory])

  const displayed = searchQuery ? searchResults : filtered

  const displayName = globalName || currentUser?.username || currentUser?.user_metadata?.display_name || 'User'
  const avatar = globalAvatar || currentUser?.avatar || currentUser?.user_metadata?.avatar_url || ''

  const handleRefresh = useCallback(() => {
    if (isRefreshing.current) return
    isRefreshing.current = true
    setError(null)
    refresh(stableUserId).catch((err) => {
      console.error('Failed to refresh feed:', err)
      setError('Failed to refresh feed')
    }).finally(() => {
      isRefreshing.current = false
      setPullDistance(0)
    })
  }, [refresh, stableUserId])

  const handleTouchStart = useCallback((e) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
    } else {
      touchStartY.current = null
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === null) return
    const diff = e.touches[0].clientY - touchStartY.current
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 80) {
      handleRefresh()
    } else {
      setPullDistance(0)
    }
    touchStartY.current = null
  }, [pullDistance, handleRefresh])

  const handlePostComment = useCallback(async () => {
    if (!currentUser || !commentText.trim() || !sharedAssetData) return
    setPostingComment(true)
    try {
      const post = await postService.create(currentUser.id, {
        title: `Re: ${sharedAssetData.title}`,
        body: commentText.trim(),
        category: sharedAssetData.category || 'Graphs',
        category_color: '#00D2FF',
        tags: sharedAssetData.graphTags || ['Graphs'],
      })
      if (post) {
        setCommentText('')
        onClearAssetData?.()
        refresh(currentUser.id)
      }
    } catch (err) {
      console.error('Failed to post comment:', err)
    }
    setPostingComment(false)
  }, [currentUser, commentText, sharedAssetData, onClearAssetData, refresh])

  return (
    <div
      ref={scrollContainerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: '100vh', background: C.bg, paddingBottom: 88, position: 'relative' }}
    >
      {/* Pull to refresh indicator */}
      <motion.div
        animate={{ height: pullDistance > 0 ? Math.min(pullDistance, 80) : 0, opacity: pullDistance > 20 ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}
      >
        <motion.div
          animate={{ rotate: pullDistance > 80 ? 360 : (pullDistance / 80) * 360 }}
          transition={{ duration: 0.15 }}
          style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }}
        />
        <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>
          {pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </motion.div>

      {/* Top Bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: `${C.bg}ee`, backdropFilter: 'blur(12px)', padding: '14px 18px', borderBottom: `1px solid ${C.cardBdr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: C.text, letterSpacing: '2px' }}>neutron</span>
          <div style={{ flex: 1 }} />
          <div style={{ flex: 1, maxWidth: 320, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '8px 12px' }}>
            <Search size={16} color={C.muted} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search posts..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13 }} />
            {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0 }}><X size={14} /></button>}
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('notifications')}
            style={{ position: 'relative', width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>
          <div onClick={() => navigate('profile')} style={{ width: 34, height: 34, borderRadius: '50%', background: avatar ? `url(${avatar}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            {!avatar && displayName[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Shared Asset Comment Banner */}
      {sharedAssetData && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ margin: '10px 18px 0', padding: '14px 16px', borderRadius: 14, background: 'rgba(0,210,255,0.05)', border: '1px solid rgba(0,210,255,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {sharedAssetData.image && (
              <img src={sharedAssetData.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sharedAssetData.title}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                {sharedAssetData.category && <span style={{ fontSize: 11, color: C.cyan, fontWeight: 600 }}>{sharedAssetData.category}</span>}
                {sharedAssetData.price && <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>{sharedAssetData.price}</span>}
              </div>
            </div>
            <button onClick={onClearAssetData} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4, flexShrink: 0 }}><X size={14} /></button>
          </div>
          {/* Tag pills */}
          {sharedAssetData.graphTags && sharedAssetData.graphTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {sharedAssetData.graphTags.map(t => (
                <span key={t} style={{ fontSize: 10, fontWeight: 600, color: C.cyan, background: `${C.cyan}12`, padding: '2px 8px', borderRadius: 4 }}>#{t}</span>
              ))}
            </div>
          )}
          {/* Comment input */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: avatar ? `url(${avatar}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {!avatar && displayName[0]?.toUpperCase()}
            </div>
            <input
              value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePostComment()}
              placeholder={`Comment on ${sharedAssetData.title}...`}
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = `${C.cyan}40`}
              onBlur={e => e.currentTarget.style.borderColor = C.cardBdr}
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={handlePostComment}
              disabled={!commentText.trim() || postingComment}
              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: commentText.trim() ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: commentText.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, opacity: postingComment ? 0.5 : 1 }}>
              <Send size={14} />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Feed type toggle */}
      <div style={{ display: 'flex', gap: 0, padding: '8px 18px 4px' }}>
        {[
          { id: 'forYou', label: 'For You' },
          { id: 'following', label: 'Following' },
        ].map(t => (
          <button key={t.id} onClick={() => setFeedType(t.id)}
            style={{ padding: '6px 16px', borderRadius: 0, border: 'none', borderBottom: `2px solid ${feedType === t.id ? C.cyan : 'transparent'}`, background: 'none', color: feedType === t.id ? C.text : C.muted, fontSize: 13, fontWeight: feedType === t.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 18px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 8, border: `1px solid ${activeCategory === cat ? C.cyan : C.cardBdr}`, background: activeCategory === cat ? `${C.cyan}15` : 'transparent', color: activeCategory === cat ? C.cyan : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          >{cat}</button>
        ))}
      </div>

      {/* Trending */}
      <div style={{ padding: '8px 18px 12px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TRENDING_TAGS.map(tag => (
          <span key={tag} onClick={() => navigate('explore', { tag: tag.replace('#', '') })}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.12)', fontSize: 11, color: C.cyan, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Hash size={11} /> {tag.replace('#', '')}
          </span>
        ))}
      </div>

      {/* Search Header */}
      {searchQuery && (
        <div style={{ padding: '8px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Showing results for "<span style={{ color: C.cyan }}>{searchQuery}</span>"</p>
          <span style={{ fontSize: 12, color: C.muted }}>{displayed.length} found</span>
        </div>
      )}

      {/* Searching indicator */}
      {searching && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 18px', gap: 8 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
          <span style={{ fontSize: 12, color: C.muted }}>Searching...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ margin: '10px 18px', padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#f87171' }}>{error}</span>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleRefresh}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Retry
          </motion.button>
        </div>
      )}

      {/* Posts */}
      <div>
        {loading && !hasLoadedOnce.current ? (
          <div style={{ padding: '0 18px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: '18px 0', borderBottom: `1px solid ${C.cardBdr}` }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div>
                    <div style={{ width: 120, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ width: 80, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
                <div style={{ width: '70%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: '90%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.03)', marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: '50%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
            <TrendingUp size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 14 }}>{searchQuery ? 'No results found' : 'No posts yet'}</p>
            {!searchQuery && <p style={{ margin: '6px 0 0', fontSize: 12 }}>Be the first to post something</p>}
          </div>
        ) : (
          <AnimatePresence>
            {displayed.map((post, i) => (
              <PostCard key={post.id} post={post} navigate={navigate} delay={i * 0.03} />
            ))}
          </AnimatePresence>
        )}
        <div ref={loadMoreRef} style={{ height: 1 }} />
        {loading && hasLoadedOnce.current && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={() => navigate('create')}
        style={{ position: 'fixed', bottom: 90, right: 20, width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.4)', zIndex: 50 }}
      >
        <Plus size={22} />
      </motion.button>
    </div>
  )
}
