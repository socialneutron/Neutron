import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal, Trash2, X, Send, Share2 } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { likeService, repostService, bookmarkService, postService, notificationService } from '../../services'
import { useFeedStore } from '../../stores/feedStore'
import type { PostWithAuthor } from '../../types/database'
import CommentsModal from './CommentsModal'
import ShareToChatModal from './ShareToChatModal'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  accent: '#00D2FF', green: '#34D399', cyan: '#00D2FF', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280', border: 'rgba(255,255,255,0.06)',
}

interface PostCardProps {
  post: PostWithAuthor
  navigate: (page: string, params?: any) => void
  delay?: number
  showFull?: boolean
}

export default function PostCard({ post, navigate, delay = 0, showFull = false }: PostCardProps) {
  const { user, profile } = useSupabaseAuth()
  const { updatePost, removePost } = useFeedStore()
  const [liked, setLiked] = useState(post.is_liked || false)
  const [likeCount, setLikeCount] = useState(post.likes_count || 0)
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked || false)
  const [reposted, setReposted] = useState(post.is_reposted || false)
  const [repostCount, setRepostCount] = useState(post.reposts_count || 0)
  const [commentCount, setCommentCount] = useState(post.comments_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [repostAnimating, setRepostAnimating] = useState(false)
  const [commentAnimating, setCommentAnimating] = useState(false)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [repostComment, setRepostComment] = useState('')
  const [reposting, setReposting] = useState(false)

  const [showAvatarImg, setShowAvatarImg] = useState(true)
  const [isTogglingLike, setIsTogglingLike] = useState(false)

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || isTogglingLike) return
    setIsTogglingLike(true)
    const newLiked = !liked
    const prevLiked = liked
    const prevCount = likeCount
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 600)
    setLiked(newLiked)
    setLikeCount(c => newLiked ? c + 1 : c - 1)
    try {
      const isNowLiked = await likeService.toggle(user.id, post.id)
      setLiked(isNowLiked)
      setLikeCount(c => isNowLiked ? c + 1 : c - 1)
      updatePost(post.id, { is_liked: isNowLiked, likes_count: isNowLiked ? prevCount + 1 : prevCount - 1 })
      if (isNowLiked && post.author_id !== user.id) {
        notificationService.create(post.author_id, user.id, 'like', post.id).catch(() => {})
      }
    } catch {
      setLiked(prevLiked)
      setLikeCount(prevCount)
    } finally {
      setIsTogglingLike(false)
    }
  }, [user, liked, likeCount, post, updatePost])

  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    const newBookmarked = !bookmarked
    const prevBookmarked = bookmarked
    setBookmarked(newBookmarked)
    try {
      await bookmarkService.toggle(user.id, post.id)
      updatePost(post.id, { is_bookmarked: newBookmarked })
    } catch {
      setBookmarked(prevBookmarked)
    }
  }, [user, bookmarked, post, updatePost])

  const handleRepost = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    setShowRepostModal(true)
  }, [user])

  const handleRepostSubmit = useCallback(async () => {
    if (!user || reposting || reposted) return
    setReposting(true)
    try {
      const newPost = await postService.create(user.id, {
        title: post.title,
        body: repostComment.trim()
          ? `${repostComment.trim()}\n\nReposted from @${post.author?.username}`
          : `Reposted from @${post.author?.username}`,
        category: post.category,
        category_color: post.category_color,
        tags: post.tags,
      })
      if (newPost) {
        const authorData = {
          id: user.id,
          display_name: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
          banner_url: profile?.banner_url || '', bio: profile?.bio || '', website: profile?.website || '', location: profile?.location || '',
          is_verified: profile?.is_verified || false, followers_count: profile?.followers_count || 0, following_count: profile?.following_count || 0,
          posts_count: profile?.posts_count || 0, created_at: profile?.created_at || '', updated_at: profile?.updated_at || '',
        }
        const fullPost: PostWithAuthor = {
          ...newPost,
          author: authorData as any,
          is_liked: false, is_bookmarked: false, is_reposted: false,
        }
        useFeedStore.getState().addPost(fullPost)
        await repostService.toggle(user.id, post.id)
        const newCount = repostCount + 1
        setReposted(true)
        setRepostCount(newCount)
        setRepostAnimating(true)
        setTimeout(() => setRepostAnimating(false), 600)
        updatePost(post.id, { is_reposted: true, reposts_count: newCount })
        if (post.author_id !== user.id) {
          await notificationService.create(post.author_id, user.id, 'repost', post.id)
        }
      }
    } catch {}
    setReposting(false)
    setShowRepostModal(false)
    setRepostComment('')
  }, [user, repostComment, post, updatePost, reposting, reposted, repostCount, profile])

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || user.id !== post.author_id) return
    try {
      const success = await postService.delete(post.id, user.id)
      if (success) removePost(post.id)
    } catch {}
    setShowMenu(false)
  }, [user, post, removePost])

  const formatNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n)

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}d`
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        style={{
          padding: '18px 20px', borderBottom: `1px solid ${C.border}`,
          background: C.card, cursor: 'default',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation()
              navigate('profile', {
                author: {
                  id: post.author_id,
                  name: post.author?.display_name,
                  handle: `@${post.author?.username}`,
                  avatar: post.author?.avatar_url,
                  verified: post.author?.is_verified,
                },
              })
            }}
          >
            {post.author?.avatar_url && showAvatarImg ? (
              <img
                src={post.author.avatar_url}
                alt={post.author?.display_name || 'Author'}
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  objectFit: 'cover', flexShrink: 0,
                }}
                onError={() => setShowAvatarImg(false)}
              />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `linear-gradient(135deg, ${post.category_color}60, #8a2be260)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {post.author?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{post.author?.display_name}</span>
                {post.author?.is_verified && <span style={{ width: 16, height: 16, borderRadius: '50%', background: C.cyan, color: '#000', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,210,255,0.5)' }}>✓</span>}
              </div>
              <span style={{ fontSize: 12, color: C.muted }}>@{post.author?.username} · {timeAgo(post.created_at)}</span>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
              <MoreHorizontal size={18} />
            </button>
            {showMenu && user?.id === post.author_id && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{
                position: 'absolute', right: 0, top: '100%', background: '#111', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 0', zIndex: 50, minWidth: 140,
              }}>
                <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer' }}>
                  <Trash2 size={14} /> Delete Post
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Content — clickable → post detail */}
        <div onClick={() => navigate('post', { postId: post.id })} style={{ cursor: 'pointer' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.45, marginBottom: 7, color: C.text, letterSpacing: '-0.2px' }}>{post.title}</h3>
          {(showFull || (post.body || '').length <= 300) ? (
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{post.body}</p>
          ) : (
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</p>
          )}
          {post.image_url && (
            <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 12, maxHeight: 400, objectFit: 'cover' }} />
          )}
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {post.tags.map(tag => (
              <span key={tag} style={{ fontSize: 12, color: C.cyan, opacity: 0.75 }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 4 }}>
          {/* LIKE */}
          <div style={{ position: 'relative' }}>
            <motion.button
              whileTap={{ scale: 0.7 }}
              onClick={handleLike}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                borderRadius: 8, border: 'none', background: 'transparent',
                color: liked ? '#f87171' : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { if (!liked) e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <motion.div
                animate={likeAnimating ? { scale: [1, 1.6, 0.9, 1.15, 1], rotate: [0, -15, 15, -5, 0] } : {}}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 2} />
              </motion.div>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={likeCount}
                  initial={{ y: liked ? 10 : -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: liked ? -10 : 10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {formatNum(likeCount)}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            {/* Like burst particles */}
            <AnimatePresence>
              {likeAnimating && liked && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={`like-particle-${i}`}
                      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                      animate={{
                        scale: [0, 1, 0],
                        x: Math.cos((i * 60) * Math.PI / 180) * 22,
                        y: Math.sin((i * 60) * Math.PI / 180) * 22 - 8,
                        opacity: [1, 1, 0],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
                      style={{
                        position: 'absolute', top: '50%', left: 14, width: 4, height: 4,
                        borderRadius: '50%', background: '#f87171', pointerEvents: 'none',
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* COMMENT */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation()
              setCommentAnimating(true)
              setTimeout(() => setCommentAnimating(false), 400)
              setShowComments(true)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              borderRadius: 8, border: 'none', background: 'transparent',
              color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,210,255,0.06)'; e.currentTarget.style.color = C.cyan }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted }}
          >
            <motion.div
              animate={commentAnimating ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <MessageCircle size={16} />
            </motion.div>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={commentCount}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {formatNum(commentCount)}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* REPOST */}
          <div style={{ position: 'relative' }}>
            <motion.button
              whileTap={{ scale: 0.7 }}
              onClick={handleRepost}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                borderRadius: 8, border: 'none', background: 'transparent',
                color: reposted ? C.green : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { if (!reposted) e.currentTarget.style.background = 'rgba(52,211,153,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <motion.div
                animate={repostAnimating ? { rotate: [0, -360] } : {}}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Repeat2 size={16} />
              </motion.div>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={repostCount}
                  initial={{ y: reposted ? 10 : -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: reposted ? -10 : 10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {formatNum(repostCount)}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>

          <div style={{ flex: 1 }} />

          {/* SHARE */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); setShowShareModal(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              borderRadius: 8, border: 'none', background: 'transparent',
              color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,210,255,0.06)'; e.currentTarget.style.color = C.cyan }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted }}
          >
            <Share2 size={16} />
          </motion.button>

          {/* BOOKMARK */}
          <motion.button
            whileTap={{ scale: 0.7 }}
            onClick={handleBookmark}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              borderRadius: 8, border: 'none', background: 'transparent',
              color: bookmarked ? C.cyan : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { if (!bookmarked) e.currentTarget.style.background = 'rgba(0,210,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <motion.div
              animate={bookmarked ? { scale: [1, 1.4, 1], y: [0, -3, 0] } : {}}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {showComments && (
        <CommentsModal
          postId={post.id}
          authorId={post.author_id}
          onClose={() => setShowComments(false)}
          navigate={navigate}
          onCommentAdded={() => {
            const newCount = commentCount + 1
            setCommentCount(newCount)
            setCommentAnimating(true)
            setTimeout(() => setCommentAnimating(false), 400)
            updatePost(post.id, { comments_count: newCount })
          }}
        />
      )}

      {showShareModal && (
        <ShareToChatModal
          post={post}
          onClose={() => setShowShareModal(false)}
          navigate={navigate}
        />
      )}

      <AnimatePresence>
        {showRepostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100, padding: 20,
            }}
            onClick={() => { setShowRepostModal(false); setRepostComment('') }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#0d1117', border: `1px solid ${C.border}`, borderRadius: 16,
                width: '100%', maxWidth: 500, padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Repost with comment</h3>
                <button onClick={() => { setShowRepostModal(false); setRepostComment('') }} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={repostComment}
                    onChange={(e) => setRepostComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    style={{
                      width: '100%', background: '#161b22', border: `1px solid ${C.border}`,
                      borderRadius: 12, padding: 14, color: C.text, fontSize: 14,
                      fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = C.cyan}
                    onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12, padding: 12, background: '#161b22', borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Original post by @{post.author?.username}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{post.title}</div>
                {post.body && (
                  <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => { setShowRepostModal(false); setRepostComment('') }}
                  style={{
                    padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.muted, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRepostSubmit}
                  disabled={reposting}
                  style={{
                    padding: '9px 18px', borderRadius: 10, border: 'none',
                    background: C.green, color: '#000', fontSize: 13, fontWeight: 700,
                    cursor: reposting ? 'not-allowed' : 'pointer', opacity: reposting ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Repeat2 size={14} /> {reposting ? 'Reposting...' : 'Repost'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
