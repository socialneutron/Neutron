import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { useAuth } from '../context/AuthContext'
import { postService } from '../services'
import { useFeedStore } from '../stores/feedStore'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', text: '#f1f5f9', muted: '#6b7280',
}

const CATEGORIES = [
  { name: 'Digital Assets', color: '#00D2FF' },
  { name: 'Creative Assets', color: '#7928CA' },
  { name: 'Intellectual Property', color: '#0891b2' },
  { name: 'Business Marketplace', color: '#d97706' },
  { name: 'Financial Opportunities', color: '#f59e0b' },
  { name: 'Real Estate', color: '#059669' },
  { name: 'Physical Products', color: '#b45309' },
  { name: 'General', color: '#4b5563' },
]

export default function PostCreation({ navigate }) {
  const { user, profile } = useSupabaseAuth()
  const { user: firebaseUser } = useAuth()
  const { addPost } = useFeedStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('General')
  const [categoryColor, setCategoryColor] = useState('#4b5563')
  const [tags, setTags] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const activeUser = firebaseUser || user
  const uid = activeUser?.id || activeUser?.uid || profile?.id || 'local-user'
  const displayName = profile?.display_name
    || activeUser?.user_metadata?.display_name
    || activeUser?.displayName
    || activeUser?.username
    || activeUser?.email?.split('@')[0]
    || 'User'
  const username = profile?.username
    || activeUser?.user_metadata?.username
    || activeUser?.username
    || activeUser?.email?.split('@')[0]
    || 'user'
  const avatarUrl = profile?.avatar_url
    || activeUser?.user_metadata?.avatar_url
    || activeUser?.avatar
    || activeUser?.photoURL
    || ''

  const handleSubmit = async () => {
    if (!title.trim() || posting) return
    setPosting(true)
    setError('')
    const now = new Date().toISOString()
    const postAuthor = {
      id: uid,
      display_name: displayName,
      username: username,
      avatar_url: avatarUrl,
      banner_url: profile?.banner_url || '',
      bio: profile?.bio || '',
      website: profile?.website || '',
      location: profile?.location || '',
      is_verified: profile?.is_verified || false,
      followers_count: profile?.followers_count || 0,
      following_count: profile?.following_count || 0,
      posts_count: profile?.posts_count || 0,
      created_at: profile?.created_at || '',
      updated_at: profile?.updated_at || '',
    }
    try {
      const saved = await postService.create(uid, {
        title: title.trim(),
        body: body.trim(),
        category,
        category_color: categoryColor,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        image_url: imageUrl,
      })
      const newPost = {
        id: saved?.id || `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: title.trim(),
        body: body.trim(),
        category,
        category_color: categoryColor,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        image_url: imageUrl,
        author_id: uid,
        author_username: username,
        author_avatar: avatarUrl,
        likes_count: saved?.likes_count ?? 0,
        comments_count: saved?.comments_count ?? 0,
        reposts_count: saved?.reposts_count ?? 0,
        bookmarks_count: saved?.bookmarks_count ?? 0,
        is_repost: false,
        repost_of: null,
        is_liked: false,
        is_bookmarked: false,
        is_reposted: false,
        created_at: saved?.created_at || now,
        updated_at: now,
        author: postAuthor,
      }
      addPost(newPost)
      navigate('profile')
    } catch {
      setError('Failed to create post. Please try again.')
      setPosting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>New Post</h2>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit}
          disabled={!title.trim() || posting}
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: title.trim() ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: title.trim() ? 'pointer' : 'not-allowed', opacity: posting ? 0.5 : 1 }}
        >
          {posting ? 'Posting...' : 'Post'}
        </motion.button>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>}

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: '#fff', outline: 'none' }} />

        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="What's on your mind?" rows={6}
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#fff', outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />

        {/* Category */}
        <div>
          <label style={{ fontSize: 12, color: C.muted, marginBottom: 6, display: 'block' }}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map(c => (
              <button key={c.name} onClick={() => { setCategory(c.name); setCategoryColor(c.color) }}
                style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${category === c.name ? c.color : C.cardBdr}`, background: category === c.name ? `${c.color}20` : 'transparent', color: category === c.name ? c.color : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >{c.name}</button>
            ))}
          </div>
        </div>

        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)"
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none' }} />

        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL (optional)"
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none' }} />

        {/* AI Moderation notice */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(0,210,255,0.04)', border: '1px solid rgba(0,210,255,0.1)' }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>AI Moderation Active</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Your post will be checked for misinformation and community guidelines.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
