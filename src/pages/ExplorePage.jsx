import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Hash, Users, Sparkles, X, UserPlus, Check } from 'lucide-react'
import { useUserAvatar } from '../stores/userAvatarStore'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { feedService } from '../services'
import { followService } from '../services/followService'
import { timeAgo } from '@/lib/timeAgo'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', green: '#34D399', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280',
}

const TAG_COLORS = ['#00D2FF', '#7928CA', '#f59e0b', '#34D399', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#ef4444']

function FollowButton({ userId, targetUserId, size = 'small' }) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId || !targetUserId || userId === targetUserId) return
    followService.isFollowing(userId, targetUserId).then(setIsFollowing).catch(() => {})
  }, [userId, targetUserId])

  if (!userId || !targetUserId || userId === targetUserId) return null

  const handleFollow = async (e) => {
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const result = await followService.toggle(userId, targetUserId)
      setIsFollowing(result)
    } catch {}
    setLoading(false)
  }

  const isSmall = size === 'small'
  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: isSmall ? '5px 12px' : '7px 16px',
        borderRadius: 8, border: isFollowing ? `1px solid ${C.cardBdr}` : 'none',
        background: isFollowing ? 'transparent' : C.cyan,
        color: isFollowing ? C.muted : '#000',
        fontSize: isSmall ? 11 : 12, fontWeight: 600, cursor: 'pointer',
        flexShrink: 0, transition: 'all 0.15s ease',
      }}
    >
      {isFollowing ? <><Check size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}
    </button>
  )
}

function UserRow({ u, currentUser, navigate, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={() => navigate('profile', { author: { id: u.id, name: u.display_name, handle: `@${u.username}`, avatar: u.avatar_url, verified: u.is_verified } })}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.cardBdr}`, marginBottom: 6, cursor: 'pointer' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
        {!u.avatar_url && u.display_name?.[0]?.toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{u.display_name}</span>
          {u.is_verified && <span style={{ width: 12, height: 12, borderRadius: '50%', background: C.cyan, color: '#000', fontSize: 7, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: C.muted }}>@{u.username} · {u.bio || (u.followers_count != null ? `${u.followers_count.toLocaleString()} followers` : '')}</p>
      </div>
      <FollowButton userId={currentUser?.id} targetUserId={u.id} />
    </motion.div>
  )
}

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
  const [trendingTags, setTrendingTags] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [activeTab, setActiveTab] = useState('trending')
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [trendingError, setTrendingError] = useState(null)

  useEffect(() => {
    const load = async () => {
      setTrendingLoading(true)
      setTrendingError(null)
      try {
        const [trending, tags, users] = await Promise.all([
          feedService.getTrendingFeed(10),
          feedService.getTrendingTags(10),
          feedService.getSuggestedUsers(10),
        ])
        setTrendingPosts(trending)
        setTrendingTags(tags.map((t, i) => ({
          ...t,
          color: TAG_COLORS[i % TAG_COLORS.length],
        })))
        setSuggestedUsers(users)
      } catch (e) {
        console.error(e)
        setTrendingError('Failed to load explore data. Please try again later.')
      }
      setTrendingLoading(false)
    }
    load()
  }, [])

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setPostResults([]); setUserResults([]); setSearching(false); return }
    setSearching(true)
    try {
      const results = await feedService.searchExplore(q)
      setPostResults(results.posts || [])
      setUserResults(results.users || [])
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

  const filteredPostResults = searchCategory === 'all' || searchCategory === 'posts' ? postResults : []
  const filteredUserResults = searchCategory === 'all' || searchCategory === 'people' ? userResults : []
  const totalResults = filteredPostResults.length + filteredUserResults.length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('home')} style={{ background: 'rgba(7,17,36,0.7)', border: '1px solid rgba(0,210,255,0.1)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>Explore</h2>
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
          {searchQuery && <button onClick={() => { setSearchQuery(''); setPostResults([]); setUserResults([]); setSearchCategory('all') }} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0 }}><X size={14} /></button>}
        </div>
      </div>

      {/* Main Tab Switcher (no search) */}
      {!searchQuery && (
        <div style={{ display: 'flex', gap: 6, padding: '0 18px 14px' }}>
          {[
            { id: 'trending', label: 'Trending', icon: <Sparkles size={13} /> },
            { id: 'tags', label: 'Tags', icon: <Hash size={13} /> },
            { id: 'people', label: 'People', icon: <Users size={13} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, border: `1px solid ${activeTab === tab.id ? C.cyan : C.cardBdr}`, background: activeTab === tab.id ? `${C.cyan}15` : 'transparent', color: activeTab === tab.id ? C.cyan : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Category tabs (search active) */}
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
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
              <Search size={36} style={{ opacity: 0.15, marginBottom: 10 }} />
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>No results for "{searchQuery}"</p>
              <p style={{ margin: 0, fontSize: 12 }}>Try a different search term</p>
            </div>
          ) : (
            <p style={{ margin: '0 0 10px', fontSize: 13, color: C.muted }}>{totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"</p>
          )}

          {/* User Results */}
          {filteredUserResults.length > 0 && (
            <>
              <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>People</h4>
              {filteredUserResults.map((u, i) => (
                <UserRow key={u.id} u={u} currentUser={user} navigate={navigate} delay={i * 0.03} />
              ))}
            </>
          )}

          {/* Post Results */}
          {filteredPostResults.length > 0 && (
            <>
              <h4 style={{ margin: '10px 0 8px', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Posts</h4>
              {filteredPostResults.map((post, i) => (
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
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{post.title || 'Untitled'}</h4>
                  {post.body && <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</p>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: C.muted }}>
                    <span>{post.likes_count || 0} likes</span>
                    <span>{post.comments_count || 0} comments</span>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Trending Tab */}
      {!searchQuery && activeTab === 'trending' && (
        <div style={{ padding: '0 18px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color={C.cyan} /> Top Posts
          </h3>
          {trendingLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} style={{ padding: '16px', borderRadius: 12, background: C.card, border: `1px solid ${C.cardBdr}`, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div>
                    <div style={{ width: 100, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 4 }} />
                    <div style={{ width: 60, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                </div>
                <div style={{ width: '70%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 6 }} />
                <div style={{ width: '100%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
              </div>
            ))
          ) : trendingError ? (
            <div style={{ textAlign: 'center', padding: 50, color: C.muted }}>
              <p style={{ margin: '0 0 5px', fontSize: 14, fontWeight: 600, color: '#ef4444' }}>Oops!</p>
              <p style={{ margin: 0, fontSize: 13 }}>{trendingError}</p>
            </div>
          ) : trendingPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50, color: C.muted }}>
              <Sparkles size={52} style={{ opacity: 0.15, marginBottom: 14, color: C.cyan }} strokeWidth={1.5} />
              <p style={{ margin: '0 0 5px', fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>No trending posts yet</p>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>When popular posts are published, they will appear here.</p>
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
                    {post.author?.is_verified && <span style={{ marginLeft: 4, width: 16, height: 16, borderRadius: '50%', background: C.cyan, color: '#000', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,210,255,0.5)' }}>✓</span>}
                    <span style={{ display: 'block', fontSize: 11, color: C.muted }}>@{post.author?.username} · {timeAgo(post.created_at)}</span>
                  </div>
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: C.text }}>{post.title || 'Untitled'}</h4>
                {post.body && <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</p>}
                <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: C.muted }}>
                  <span>❤️ {post.likes_count || 0}</span>
                  <span>💬 {post.comments_count || 0}</span>
                  <span>🔁 {post.reposts_count || 0}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Tags Tab */}
      {!searchQuery && activeTab === 'tags' && (
        <div style={{ padding: '0 18px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Hash size={14} color={C.purple} /> Trending Tags
          </h3>
          {trendingTags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
              <Hash size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13 }}>No trending tags yet. Tags from posts will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {trendingTags.map((t, i) => (
                <motion.div key={t.tag} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                  onClick={() => setSearchQuery(`#${t.tag}`)}
                  style={{ padding: '14px', borderRadius: 12, background: C.card, border: `1px solid ${C.cardBdr}`, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Hash size={14} color={t.color} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.tag}</span>
                  </div>
                  <span style={{ fontSize: 12, color: C.muted }}>{t.count} post{t.count !== 1 ? 's' : ''}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* People Tab */}
      {!searchQuery && activeTab === 'people' && (
        <div style={{ padding: '0 18px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} color={C.green} /> {user ? 'Suggested People' : 'Discover People'}
          </h3>
          {!user ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: C.muted }}>
              <Users size={40} style={{ opacity: 0.15, marginBottom: 14 }} />
              <p style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Sign in to discover people</p>
              <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.5 }}>Find and follow people who share your interests</p>
              <button onClick={() => navigate('auth')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 10, background: C.cyan, color: '#000', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Sign In
              </button>
            </div>
          ) : suggestedUsers.length > 0 ? (
            suggestedUsers.map((u, i) => (
              <UserRow key={u.id} u={u} currentUser={user} navigate={navigate} delay={i * 0.03} />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
              <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13 }}>No suggested people yet. Start following accounts to get suggestions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
