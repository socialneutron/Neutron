import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Bell, TrendingUp, Hash } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { useFeedStore } from '../../stores/feedStore'
import { useNotificationStore } from '../../stores/notificationStore'
import { postService, notificationService } from '../../services'
import PostCard from '../../components/social/PostCard'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', text: '#f1f5f9', muted: '#6b7280',
}

const CATEGORIES = ['All', 'Digital Assets', 'Creative Assets', 'Intellectual Property', 'Business Marketplace', 'Financial Opportunities', 'Real Estate', 'Physical Products']

const TRENDING_TAGS = ['#DigitalAssets', '#NFTs', '#DeFi', '#Web3', '#Blockchain', '#CryptoArt', '#SmartContracts']

interface HomeFeedProps {
  navigate: (page: string, params?: any) => void
}

export default function HomeFeed({ navigate }: HomeFeedProps) {
  const { user } = useSupabaseAuth()
  const { posts, loading, loadMore, refresh } = useFeedStore()
  const { unreadCount, incrementUnread, setUnreadCount } = useNotificationStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { refresh(user?.id) }, [refresh, user?.id])

  // Real-time notifications
  useEffect(() => {
    if (!user) return
    const channel = notificationService.subscribe(user.id, () => { incrementUnread() })
    notificationService.getUnreadCount(user.id).then(setUnreadCount)
    return () => { channel.unsubscribe() }
  }, [user, incrementUnread, setUnreadCount])

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading) loadMore(user?.id)
    }, { threshold: 0.1 })
    observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
  }, [loading, loadMore, user?.id])

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); setSearching(false); return }
    setSearching(true)
    const results = await postService.search(q)
    setSearchResults(results)
    setSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { if (searchQuery) handleSearch(searchQuery) }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory)
  const displayed = searchQuery ? searchResults : filtered

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      {/* Top Bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: `${C.bg}ee`, backdropFilter: 'blur(12px)', padding: '14px 18px', borderBottom: `1px solid ${C.cardBdr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '8px 12px' }}>
            <Search size={16} color={C.muted} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search posts..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13 }} />
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
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 18px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 8, border: `1px solid ${activeCategory === cat ? C.cyan : C.cardBdr}`, background: activeCategory === cat ? `${C.cyan}15` : 'transparent', color: activeCategory === cat ? C.cyan : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >{cat}</button>
        ))}
      </div>

      {/* Trending */}
      <div style={{ padding: '8px 18px 12px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TRENDING_TAGS.map(tag => (
          <span key={tag} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.12)', fontSize: 11, color: C.cyan, cursor: 'pointer' }}>
            <Hash size={11} /> {tag.replace('#', '')}
          </span>
        ))}
      </div>

      {/* Posts */}
      <div>
        {loading && posts.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
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
        {loading && posts.length > 0 && (
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
