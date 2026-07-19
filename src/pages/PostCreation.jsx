import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Image, X, Upload, AlertCircle, GripVertical } from 'lucide-react'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { useAuth } from '../context/AuthContext'
import { postService } from '../services'
import { useFeedStore } from '../stores/feedStore'
import { useUserAvatar } from '../stores/userAvatarStore'

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

const MAX_IMAGE_SIZE_MB = 10
const MAX_IMAGES = 10

export default function PostCreation({ navigate }) {
  const { user, profile } = useSupabaseAuth()
  const { user: firebaseUser } = useAuth()
  const { addPost } = useFeedStore()
  const { avatar: globalAvatar, displayName: globalDisplayName, bio: globalBio } = useUserAvatar()
  const fileInputRef = useRef(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('General')
  const [categoryColor, setCategoryColor] = useState('#4b5563')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState([])
  const [dragIdx, setDragIdx] = useState(null)
  const [imageError, setImageError] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const activeUser = user || firebaseUser
  const uid = activeUser?.id || activeUser?.uid || profile?.id || 'local-user'
  const displayName = globalDisplayName
    || profile?.display_name
    || activeUser?.user_metadata?.display_name
    || activeUser?.displayName
    || activeUser?.username
    || activeUser?.email?.split('@')[0]
    || 'User'
  const username = (globalDisplayName || '').toLowerCase().replace(/\s/g, '_')
    || profile?.username
    || activeUser?.user_metadata?.username
    || activeUser?.username
    || activeUser?.email?.split('@')[0]
    || 'user'
  const avatarUrl = globalAvatar
    || profile?.avatar_url
    || activeUser?.user_metadata?.avatar_url
    || activeUser?.avatar
    || activeUser?.photoURL
    || ''

  const handleImageSelect = (files) => {
    setImageError('')
    if (!files || files.length === 0) return
    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      setImageError(`Maximum ${MAX_IMAGES} images allowed`)
      return
    }
    const toAdd = Array.from(files).slice(0, remaining)
    const valid = []
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) {
        setImageError('Only image files are accepted')
        continue
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setImageError(`Each image must be under ${MAX_IMAGE_SIZE_MB}MB`)
        continue
      }
      valid.push(file)
    }
    if (valid.length === 0) return
    const readers = valid.map(file => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.readAsDataURL(file)
    }))
    Promise.all(readers).then(results => {
      setImages(prev => [...prev, ...results])
    })
  }

  const handleRemoveImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleImageSelect(e.dataTransfer.files)
  }

  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragOver = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setImages(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

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
        image_url: images[0] || '',
        images,
        author_username: username,
        author_display_name: displayName,
        author_avatar: avatarUrl,
      })
      const newPost = {
        id: saved?.id || `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: title.trim(),
        body: body.trim(),
        category,
        category_color: categoryColor,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        image_url: images[0] || '',
        images,
        author_id: uid,
        author_username: username,
        author_display_name: displayName,
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
      navigate('home')
    } catch (e) {
      console.error('Post creation failed:', e)
      setError(`Failed to create post: ${e?.message || 'Unknown error'}`)
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

        {/* Multi-Image Upload */}
        <div>
          <label style={{ fontSize: 12, color: C.muted, marginBottom: 6, display: 'block' }}>
            Photos {images.length > 0 ? `(${images.length}/${MAX_IMAGES})` : '(optional)'}
          </label>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(2, 1fr)',
              gap: 6,
              marginBottom: 10,
            }}>
              <AnimatePresence>
                {images.map((src, idx) => (
                  <motion.div
                    key={src.slice(0, 50) + idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      position: 'relative',
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: `1px solid ${dragIdx === idx ? C.cyan : C.cardBdr}`,
                      aspectRatio: images.length === 1 ? 'auto' : '1',
                      maxHeight: images.length === 1 ? 300 : 180,
                      cursor: 'grab',
                    }}
                  >
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab' }}>
                        <GripVertical size={12} color="#fff" />
                      </div>
                      {idx === 0 && (
                        <div style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(0,210,255,0.8)', fontSize: 10, fontWeight: 700, color: '#000' }}>
                          COVER
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleRemoveImage(idx)}
                      style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Add More Button */}
          {images.length < MAX_IMAGES && (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${C.cardBdr}`, borderRadius: 12, padding: images.length > 0 ? '16px 20px' : '32px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.background = 'rgba(0,210,255,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBdr; e.currentTarget.style.background = 'transparent' }}
            >
              <Upload size={images.length > 0 ? 20 : 28} color={C.muted} style={{ margin: '0 auto 6px', display: 'block' }} />
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
                {images.length > 0 ? `Add more (${MAX_IMAGES - images.length} remaining)` : 'Click to upload or drag & drop'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4b5563' }}>PNG, JPG, GIF, WebP — Max {MAX_IMAGE_SIZE_MB}MB each</p>
            </div>
          )}
          {imageError && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> {imageError}</p>}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e => handleImageSelect(e.target.files)} style={{ display: 'none' }} />
        </div>

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
