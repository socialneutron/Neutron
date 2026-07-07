import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, TrendingUp, Hash, Users, Compass, Sparkles, X, BadgeCheck } from 'lucide-react'
import { useUserAvatar } from '../stores/userAvatarStore'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { postService, userService } from '../services'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', green: '#34D399', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280',
}

const TRENDING_TAGS = [
  { tag: 'DigitalAssets', count: '14.2K', color: '#00D2FF' },
  { tag: 'NFTs', count: '8.7K', color: '#7928CA' },
  { tag: 'DeFi', count: '12.1K', color: '#f59e0b' },
  { tag: 'Web3', count: '9.4K', color: '#34D399' },
  { tag: 'Blockchain', count: '11.3K', color: '#00D2FF' },
  { tag: 'CryptoArt', count: '6.8K', color: '#ec4899' },
  { tag: 'SmartContracts', count: '7.2K', color: '#8b5cf6' },
  { tag: 'AI', count: '22.5K', color: '#06b6d4' },
  { tag: 'Fusion', count: '3.1K', color: '#f97316' },
  { tag: 'MarsColonization', count: '5.6K', color: '#ef4444' },
]

export default function ExplorePage({ navigate }) {
  const { user } = useSupabaseAuth()
  const { avatar: globalAvatar, displayName: globalDisplayName } = useUserAvatar()
  const userAvatar = globalAvatar || user?.avatar_url || ''
  const userDisplayName = globalDisplayName || user?.display_name || 'User'
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCategory, setSearchCategory] = useState('all')
  const [postResults, setPostResults] = useState([])
  const [userResults, setUserResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [trendingPosts, setTrendingPosts] = useState([])
  const [activeTab, setActiveTab] = useState('trending')

  useEffect(() => {
    const load = async () => {
      try {
        const posts = await postService.getFeed(0, 20, user?.id, true)
        if (posts.length > 0) {
          setTrendingPosts(posts.sort((a, b) => b.likes_count - a.likes_count).slice(0, 10))
        }
      } catch {}
    }
    load()
  }, [])

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setPostResults([]); setUserResults([]); setSearching(false); return }
    setSearching(true)
    try {
      const [posts, users] = await Promise.all([
        postService.search(q, 0, 20, true),
        userService.searchUsers(q),
      ])
      setPostResults(posts || [])
      setUserResults(users || [])
    } catch {
      setPostResults([])
      setUserResults([])
    }
    setSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { if (searchQuery) handleSearch(searchQuery) }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const filteredPostResults = searchCategory === 'all' || searchCategory === 'posts' ? postResults : []
  const filteredUserResults = searchCategory === 'all' || searchCategory === 'people' ? userResults : []
  const totalResults = filteredPostResults.length + filteredUserResults.length
  const hasResults = searchQuery && !searching && totalResults > 0

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('home')} style={{ background: 'rgba(7,17,36,0.7)', border: '1px solid rgba(0,210,255,0.1)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>Explore
          <span style={{ fontSize: 9, fontWeight: 600, color: C.cyan, background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, borderRadius: 5, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            ✓ Verified Feed
          </span>
        </h2>
        <div style={{ flex: 1 }} />
        <motion.div onClick={() => navigate('profile')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ width: 34, height: 34, borderRadius: '50%', background: userAvatar ? `url(${userAvatar}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
          {!userAvatar && userDisplayName[0]?.toUpperCase()}
        </motion.div>
      </div>

      {/* Search */}
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '10px 14px' }}>
          <Search size={16} color={C.muted} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search posts, users, tags..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14 }} />
          {searchQuery && <button onClick={() => { setSearchQuery(''); setPostResults([]); setUserResults([]) }} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0 }}><X size={14} /></button>}
        </div>
      </div>

      {/* Category tabs */}
      {searchQuery && (
        <div style={{ display: 'flex', gap: 6, padding: '0 18px 10px' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'posts', label: 'Posts' },
            { id: 'people', label: 'People' },
          ].map(cat => (
            <button key={cat.id} onClick={() => setSearchCategory(cat.id)}
              style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${searchCategory === cat.id ? C.cyan : C.cardBdr}`, background: searchCategory === cat.id ? `${C.cyan}15` : 'transparent', color: searchCategory === cat.id ? C.cyan : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div style={{ padding: '0 18px' }}>
          {searching ? (
            <p style={{ fontSize: 13, color: C.muted }}>Searching...</p>
          ) : totalResults === 0 ? (
            <p style={{ fontSize: 13, color: C.muted }}>No results for "{searchQuery}"</p>
          ) : (
            <p style={{ margin: '0 0 10px', fontSize: 13, color: C.muted }}>{totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"</p>
          )}

          {/* User Results */}
          {filteredUserResults.length > 0 && (
            <>
              <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>People</h4>
              {filteredUserResults.map((u, i) => (
                <motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => navigate('profile', { author: { id: u.id, name: u.display_name, handle: `@${u.username}`, avatar: u.avatar_url, verified: u.is_verified } })}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.cardBdr}`, marginBottom: 6, cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {!u.avatar_url && u.display_name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{u.display_name}</span>
                      {u.is_verified && <span style={{ width: 12, height: 12, borderRadius: '50%', background: C.cyan, color: '#000', fontSize: 7, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>@{u.username} · {u.bio || u.followers_count?.toLocaleString() + ' followers'}</p>
                  </div>
                </motion.div>
              ))}
            </>
          )}

          {/* Post Results */}
          {filteredPostResults.length > 0 && (
            <>
              <h4 style={{ margin: '10px 0 8px', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Posts</h4>
              {filteredPostResults.filter(p => p.author?.is_verified === true).map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => navigate('post', { postId: post.id })}
                  style={{ padding: '12px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.cardBdr}`, marginBottom: 6, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: post.author?.avatar_url ? `url(${post.author.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                      {!post.author?.avatar_url && post.author?.display_name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{post.author?.display_name}</span>
                    {post.author?.is_verified && <span style={{ width: 13, height: 13, borderRadius: '50%', background: C.cyan, color: '#000', fontSize: 7, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 6px rgba(0,210,255,0.4)' }}>✓</span>}
                    <span style={{ fontSize: 10, color: C.muted }}>· {timeAgo(post.created_at)}</span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{post.title}</h4>
                  {post.body && <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</p>}
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Tab Content */}
      {!searchQuery && activeTab === 'trending' && (
        <div style={{ padding: '0 18px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color={C.cyan} /> Top Posts
          </h3>
          {trendingPosts.filter(p => p.author?.is_verified === true).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50, color: C.muted }}>
              <BadgeCheck size={52} style={{ opacity: 0.15, marginBottom: 14, color: C.cyan }} strokeWidth={1.5} />
              <p style={{ margin: '0 0 5px', fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>You're all caught up!</p>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>Only verified posts appear here. When verified users publish content, it will show up in this feed.</p>
            </div>
          ) : (
            trendingPosts.filter(p => p.author?.is_verified === true).map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate('post', { postId: post.id })}
                style={{ padding: '16px', borderRadius: 12, background: C.card, border: `1px solid ${C.cardBdr}`, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: post.author?.avatar_url ? `url(${post.author.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                    {!post.author?.avatar_url && post.author?.display_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{post.author?.display_name}</span>
                    {post.author?.is_verified && <span style={{ marginLeft: 4, width: 16, height: 16, borderRadius: '50%', background: C.cyan, color: '#000', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,210,255,0.5)' }}>✓</span>}
                    <span style={{ display: 'block', fontSize: 11, color: C.muted }}>@{post.author?.username} · {timeAgo(post.created_at)}</span>
                  </div>
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: C.text }}>{post.title}</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</p>
                <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: C.muted }}>
                  <span>❤️ {post.likes_count}</span>
                  <span>💬 {post.comments_count}</span>
                  <span>🔁 {post.reposts_count}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {!searchQuery && activeTab === 'tags' && (
        <div style={{ padding: '0 18px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Hash size={14} color={C.purple} /> Trending Tags
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TRENDING_TAGS.map((t, i) => (
              <motion.div key={t.tag} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                onClick={() => navigate('explore', { tag: t.tag })}
                style={{ padding: '14px', borderRadius: 12, background: C.card, border: `1px solid ${C.cardBdr}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Hash size={14} color={t.color} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.tag}</span>
                </div>
                <span style={{ fontSize: 12, color: C.muted }}>{t.count} posts</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!searchQuery && activeTab === 'people' && (
        <div style={{ padding: '0 18px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} color={C.green} /> Suggested People
          </h3>
          <div style={{ textAlign: 'center', padding: 20, color: C.muted }}>
            <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13 }}>Search for users above or browse trending content</p>
          </div>
        </div>
      )}
    </div>
  )
}
