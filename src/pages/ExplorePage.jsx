import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, TrendingUp, Hash, Users, Compass, Sparkles } from 'lucide-react'
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

const SUGGESTED_USERS = [
  { id: 'u1', display_name: 'Dr. Elena Vance', username: 'elena_vance', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', is_verified: true, bio: 'AI Safety Researcher' },
  { id: 'u2', display_name: 'Mark S.', username: 'mark_s', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', is_verified: true, bio: 'Macro Analyst' },
  { id: 'u3', display_name: 'Priya Sharma', username: 'priya_sharma', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', is_verified: true, bio: 'Space & Biotech' },
]

export default function ExplorePage({ navigate }) {
  const { user } = useSupabaseAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [trendingPosts, setTrendingPosts] = useState([])
  const [activeTab, setActiveTab] = useState('trending')

  useEffect(() => {
    const load = async () => {
      try {
        const posts = await postService.getFeed(0, 20)
        if (posts.length > 0) {
          setTrendingPosts(posts.sort((a, b) => b.likes_count - a.likes_count).slice(0, 10))
        }
      } catch {}
    }
    load()
  }, [])

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); setSearching(false); return }
    setSearching(true)
    try {
      const results = await postService.search(q)
      setSearchResults(results)
    } catch { setSearchResults([]) }
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

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('home')} style={{ background: 'rgba(7,17,36,0.7)', border: '1px solid rgba(0,210,255,0.1)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Explore</h2>
      </div>

      {/* Search */}
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '10px 14px' }}>
          <Search size={16} color={C.muted} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search posts, users, tags..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14 }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '0 18px 12px' }}>
        {[
          { id: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
          { id: 'tags', label: 'Tags', icon: <Hash size={14} /> },
          { id: 'people', label: 'People', icon: <Users size={14} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: `1px solid ${activeTab === tab.id ? C.cyan : C.cardBdr}`, background: activeTab === tab.id ? `${C.cyan}15` : 'transparent', color: activeTab === tab.id ? C.cyan : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div style={{ padding: '0 18px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: C.muted }}>
            {searching ? 'Searching...' : `${searchResults.length} results for "${searchQuery}"`}
          </p>
          {searchResults.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => navigate('post', { postId: post.id })}
              style={{ padding: '14px 16px', borderRadius: 12, background: C.card, border: `1px solid ${C.cardBdr}`, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: post.author?.avatar_url ? `url(${post.author.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {!post.author?.avatar_url && post.author?.display_name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{post.author?.display_name}</span>
                <span style={{ fontSize: 11, color: C.muted }}>@{post.author?.username}</span>
              </div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>{post.title}</h4>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {!searchQuery && activeTab === 'trending' && (
        <div style={{ padding: '0 18px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color={C.cyan} /> Top Posts
          </h3>
          {trendingPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
              <TrendingUp size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13 }}>No trending posts yet</p>
            </div>
          ) : (
            trendingPosts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate('post', { postId: post.id })}
                style={{ padding: '16px', borderRadius: 12, background: C.card, border: `1px solid ${C.cardBdr}`, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: post.author?.avatar_url ? `url(${post.author.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                    {!post.author?.avatar_url && post.author?.display_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{post.author?.display_name}</span>
                    {post.author?.is_verified && <span style={{ marginLeft: 4, width: 12, height: 12, borderRadius: '50%', background: C.cyan, color: '#fff', fontSize: 7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
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
          {SUGGESTED_USERS.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => navigate('profile', { author: { name: u.display_name, handle: `@${u.username}`, avatar: u.avatar_url, verified: u.is_verified } })}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: C.card, border: `1px solid ${C.cardBdr}`, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {!u.avatar_url && u.display_name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{u.display_name}</span>
                  {u.is_verified && <span style={{ width: 14, height: 14, borderRadius: '50%', background: C.cyan, color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: C.muted }}>@{u.username} · {u.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
