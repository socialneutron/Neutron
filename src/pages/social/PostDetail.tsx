import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, MessageCircle, Repeat2, Bookmark, Share2, MoreHorizontal, Trash2, Link, ExternalLink, Send, Bell, BellOff, Flag, TrendingUp, Users, Clock, Sparkles, BarChart3, Filter, ChevronDown, Hash, AtSign, Eye, Star, Zap } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { postService, likeService, repostService, bookmarkService, commentService, notificationService } from '../../services'
import { useFeedStore } from '../../stores/feedStore'
import type { PostWithAuthor } from '../../types/database'
import CommentThread, { type CommentNodeData } from '../../components/social/CommentThread'
import RichCommentComposer from '../../components/social/RichCommentComposer'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  accent: '#00D2FF', cyan: '#00D2FF', green: '#34D399', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280', border: 'rgba(255,255,255,0.06)',
}

const SORT_OPTIONS = [
  { value: 'top', label: 'Top', icon: <TrendingUp size={14} /> },
  { value: 'newest', label: 'Newest', icon: <Clock size={14} /> },
  { value: 'oldest', label: 'Oldest', icon: <Clock size={14} /> },
  { value: 'most_liked', label: 'Most Liked', icon: <Heart size={14} /> },
  { value: 'most_replied', label: 'Most Replied', icon: <MessageCircle size={14} /> },
  { value: 'insightful', label: 'Insightful', icon: <Sparkles size={14} /> },
]

interface PostDetailProps {
  postId: string
  navigate: (page: string, params?: any) => void
}

export default function PostDetail({ postId, navigate }: PostDetailProps) {
  const { user } = useSupabaseAuth()
  const { updatePost } = useFeedStore()
  const [post, setPost] = useState<PostWithAuthor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [reposted, setReposted] = useState(false)
  const [repostCount, setRepostCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [likeAnimating, setLikeAnimating] = useState(false)

  const [comments, setComments] = useState<CommentNodeData[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [sortBy, setSortBy] = useState('top')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [isFollowingDiscussion, setIsFollowingDiscussion] = useState(false)
  const [viewCount] = useState(Math.floor(Math.random() * 5000) + 1000)
  const [shareCount, setShareCount] = useState(0)

  const shareRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  const commentsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShareMenu(false)
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await postService.getById(postId, user?.id)
      if (data) {
        setPost(data)
        setLiked(data.is_liked || false)
        setLikeCount(data.likes_count || 0)
        setBookmarked(data.is_bookmarked || false)
        setBookmarkCount(data.bookmarks_count || 0)
        setReposted(data.is_reposted || false)
        setRepostCount(data.reposts_count || 0)
        setCommentCount(data.comments_count || 0)
      } else {
        setError('Post not found')
      }
    } catch (err) {
      setError('Failed to load post')
    }
    setLoading(false)
  }, [postId, user?.id])

  useEffect(() => { load().catch(() => {}) }, [load])

  const loadComments = useCallback(async () => {
    setLoadingComments(true)
    try {
      const data = await commentService.getByPost(postId)
      const nodes: CommentNodeData[] = data.map((c, i) => ({
        ...c,
        replies: [],
        showReplies: false,
        replyCount: 0,
        insight_score: Math.floor(Math.random() * 50),
        reactions: {},
        is_author_approved: i === 0 ? true : false,
        expertise_badges: i % 3 === 0 ? ['developer', 'web3_specialist'] : undefined,
      }))
      if (user) {
        const likedIds = await likeService.getUserLikedComments(user.id, data.map(c => c.id))
        nodes.forEach(c => { c.is_liked = likedIds.has(c.id) })
      }
      const sorted = sortComments(nodes, sortBy)
      setComments(sorted)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
    setLoadingComments(false)
  }, [postId, user, sortBy])

  useEffect(() => { if (post) loadComments().catch(() => {}) }, [loadComments, post])

  const sortComments = (nodes: CommentNodeData[], sort: string) => {
    const arr = [...nodes]
    switch (sort) {
      case 'newest': return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'oldest': return arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'most_liked': return arr.sort((a, b) => b.likes_count - a.likes_count)
      case 'most_replied': return arr.sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0))
      case 'insightful': return arr.sort((a, b) => (b.insight_score || 0) - (a.insight_score || 0))
      default: return arr.sort((a, b) => b.likes_count - a.likes_count)
    }
  }

  const handleLike = useCallback(async () => {
    if (!user || !post) return
    setLikeAnimating(true); setTimeout(() => setLikeAnimating(false), 400)
    const newLiked = !liked
    const prevLiked = liked
    const prevCount = likeCount
    setLiked(newLiked); setLikeCount(c => newLiked ? c + 1 : c - 1)
    try {
      await likeService.toggle(user.id, post.id)
      updatePost(post.id, { is_liked: newLiked, likes_count: newLiked ? likeCount + 1 : likeCount - 1 })
      if (newLiked && post.author_id !== user.id) {
        notificationService.create(post.author_id, user.id, 'like', post.id).catch(() => {})
      }
    } catch {
      setLiked(prevLiked); setLikeCount(prevCount)
    }
  }, [user, liked, post, updatePost, likeCount])

  const handleBookmark = useCallback(async () => {
    if (!user || !post) return
    const newBookmarked = !bookmarked
    const prevBookmarked = bookmarked
    const prevCount = bookmarkCount
    setBookmarked(newBookmarked)
    setBookmarkCount(c => newBookmarked ? c + 1 : c - 1)
    try {
      await bookmarkService.toggle(user.id, post.id)
      updatePost(post.id, { is_bookmarked: newBookmarked })
    } catch {
      setBookmarked(prevBookmarked); setBookmarkCount(prevCount)
    }
  }, [user, bookmarked, post, updatePost, bookmarkCount])

  const handleRepost = useCallback(async () => {
    if (!user || !post) return
    const nowReposted = !reposted
    const prevReposted = reposted
    const prevCount = repostCount
    setReposted(nowReposted); setRepostCount(c => nowReposted ? c + 1 : c - 1)
    try {
      await repostService.toggle(user.id, post.id)
      if (nowReposted && post.author_id !== user.id) await notificationService.create(post.author_id, user.id, 'repost', post.id)
      updatePost(post.id, { is_reposted: nowReposted, reposts_count: nowReposted ? repostCount + 1 : repostCount - 1 })
    } catch {
      setReposted(prevReposted); setRepostCount(prevCount)
    }
  }, [user, reposted, post, updatePost, repostCount])

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/post/${postId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch {}
    setShowShareMenu(false)
  }, [postId])

  const handleShareTwitter = useCallback(() => {
    if (!post) return
    const url = `${window.location.origin}/post/${postId}`
    const text = encodeURIComponent(`${post.title}\n\n`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
    setShowShareMenu(false)
    setShareCount(c => c + 1)
  }, [post, postId])

  const handleNativeShare = useCallback(async () => {
    if (!post || !navigator.share) return
    const url = `${window.location.origin}/post/${postId}`
    try {
      await navigator.share({ title: post.title, text: post.body.slice(0, 200), url })
    } catch {}
    setShowShareMenu(false)
    setShareCount(c => c + 1)
  }, [post, postId])

  const handleDelete = useCallback(async () => {
    if (!user || !post || user.id !== post.author_id) return
    try {
      const success = await postService.delete(post.id, user.id)
      if (success) navigate('home')
    } catch {}
  }, [user, post, navigate])

  const formatNum = (n: number) => (n || 0) >= 1000 ? ((n || 0) / 1000).toFixed(1) + 'K' : String(n || 0)

  const fullDate = (date: string) => new Date(date).toLocaleString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    month: 'short', day: 'numeric', year: 'numeric',
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
    </div>
  )

  if (error || !post) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <p style={{ color: C.muted, fontSize: 14 }}>{error || 'Post not found'}</p>
      <button onClick={() => navigate('home')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'rgba(0,210,255,0.15)', color: C.cyan, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Go Home</button>
    </div>
  )

  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy) || SORT_OPTIONS[0]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      {/* ─── Top Nav Bar ─── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: `${C.bg}ee`, backdropFilter: 'blur(12px)',
        padding: '10px 18px', borderBottom: `1px solid ${C.cardBdr}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={() => navigate('home')} style={{
          background: 'rgba(7,17,36,0.7)', border: `1px solid rgba(0,210,255,0.1)`,
          borderRadius: 10, width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: C.muted, flexShrink: 0,
        }}>
          <ArrowLeft size={18} />
        </button>

        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
            {post.category || 'Discussion'}
          </span>
          <div style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={11} /> {formatNum(viewCount)} views
            {commentCount > 0 && <><span>·</span><MessageCircle size={11} /> {formatNum(commentCount)} comments</>}
          </div>
        </div>

        {/* Follow Discussion */}
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => setIsFollowingDiscussion(!isFollowingDiscussion)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 8, border: `1px solid ${isFollowingDiscussion ? C.cyan : C.cardBdr}`,
            background: isFollowingDiscussion ? `${C.cyan}12` : 'transparent',
            color: isFollowingDiscussion ? C.cyan : C.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {isFollowingDiscussion ? <Bell size={13} /> : <BellOff size={13} />}
          {isFollowingDiscussion ? 'Following' : 'Follow'}
        </motion.button>

        {user?.id === post.author_id && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleDelete}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Trash2 size={13} /> Delete
          </motion.button>
        )}
      </div>

      {/* ─── Main Content ─── */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 18px' }}>

        {/* ─── Author & Post ─── */}
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div
              onClick={() => navigate('profile', { author: { id: post.author_id, name: post.author?.display_name, handle: `@${post.author?.username}`, avatar: post.author?.avatar_url, verified: post.author?.is_verified } })}
              style={{
                width: 52, height: 52, borderRadius: 14, cursor: 'pointer', flexShrink: 0,
                background: post.author?.avatar_url ? `url(${post.author.avatar_url}) center/cover` : `linear-gradient(135deg, ${post.category_color}60, #8a2be260)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff',
              }}
            >
              {!post.author?.avatar_url && post.author?.display_name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  onClick={() => navigate('profile', { author: { id: post.author_id, name: post.author?.display_name, handle: `@${post.author?.username}` } })}
                  style={{ fontSize: 16, fontWeight: 700, color: C.text, cursor: 'pointer' }}
                >
                  {post.author?.display_name}
                </span>
                {post.author?.is_verified && (
                  <span style={{ width: 17, height: 17, borderRadius: '50%', background: C.cyan, color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>
                )}
                <span style={{ fontSize: 13, color: C.muted }}>@{post.author?.username}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 12, color: C.muted }}>
                <span>{formatNum(post.author?.followers_count || 0)} followers</span>
                <span>·</span>
                <span>{formatNum(post.author?.posts_count || 0)} posts</span>
              </div>
            </div>
            {/* Follow button */}
            <motion.button whileTap={{ scale: 0.95 }}
              style={{
                padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.cyan}`,
                background: `${C.cyan}12`, color: C.cyan, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              + Follow
            </motion.button>
          </div>

          <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1.3, letterSpacing: '-0.3px', fontFamily: 'var(--font-heading)' }}>
            {post.title}
          </h1>

          <p style={{ margin: '0 0 14px', fontSize: 16, color: '#c9cdd4', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {post.body}
          </p>

          {post.image_url && (
            <img src={post.image_url} alt="" style={{
              width: '100%', borderRadius: 14, marginBottom: 14,
              maxHeight: 500, objectFit: 'cover', border: `1px solid ${C.cardBdr}`,
            }} />
          )}

          {/* Hashtags & Mentions */}
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {post.tags.map(tag => (
                <span key={tag} onClick={() => navigate('explore', { tag })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 13, color: C.cyan, cursor: 'pointer',
                    background: `${C.cyan}08`, padding: '4px 10px', borderRadius: 6,
                    border: `1px solid ${C.cyan}18`, fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${C.cyan}15`}
                  onMouseLeave={e => e.currentTarget.style.background = `${C.cyan}08`}
                >
                  <Hash size={12} />{tag}
                </span>
              ))}
            </div>
          )}

          {/* Category Badge */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
              background: `${post.category_color}15`, color: post.category_color,
              border: `1px solid ${post.category_color}30`, letterSpacing: '0.3px',
            }}>
              {post.category}
            </span>
          </div>

          {/* Timestamp */}
          <div style={{ padding: '10px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, color: C.muted }}>{fullDate(post.created_at)}</span>
          </div>

          {/* Engagement Stats */}
          <div style={{ display: 'flex', gap: 20, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14, color: C.muted }}><strong style={{ color: C.text }}>{formatNum(repostCount)}</strong> Reposts</span>
            <span style={{ fontSize: 14, color: C.muted }}><strong style={{ color: C.text }}>{formatNum(commentCount)}</strong> Comments</span>
            <span style={{ fontSize: 14, color: C.muted }}><strong style={{ color: C.text }}>{formatNum(likeCount)}</strong> Likes</span>
            <span style={{ fontSize: 14, color: C.muted }}><strong style={{ color: C.text }}>{formatNum(bookmarkCount)}</strong> Saves</span>
            <span style={{ fontSize: 14, color: C.muted }}><strong style={{ color: C.text }}>{formatNum(viewCount)}</strong> Views</span>
          </div>

          {/* ─── Engagement Bar ─── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            padding: '8px 0', borderBottom: `1px solid ${C.border}`,
          }}>
            <ActionBtn icon={<Heart size={18} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 2} />}
              label={formatNum(likeCount)} onClick={handleLike}
              color={liked ? '#f87171' : C.muted} animate={likeAnimating} />

            <ActionBtn icon={<MessageCircle size={18} />} label={formatNum(commentCount)}
              onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' })} color={C.muted} />

            <ActionBtn icon={<Repeat2 size={18} />} label={formatNum(repostCount)}
              onClick={handleRepost} color={reposted ? C.green : C.muted} />

            <ActionBtn icon={<Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />}
              label="" onClick={handleBookmark} color={bookmarked ? C.cyan : C.muted} />

            {/* Share */}
            <div ref={shareRef} style={{ position: 'relative' }}>
              <motion.button whileTap={{ scale: 0.85 }}
                onClick={() => setShowShareMenu(!showShareMenu)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                  borderRadius: 8, border: 'none', background: 'transparent',
                  color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Share2 size={18} />
                {shareCount > 0 && <span>{formatNum(shareCount)}</span>}
              </motion.button>
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '100%', marginBottom: 8,
                      background: '#141420', border: `1px solid ${C.border}`, borderRadius: 12,
                      padding: '6px 0', zIndex: 50, minWidth: 190, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    <ShareMenuItem icon={<Link size={15} />} label={copied ? 'Copied!' : 'Copy Link'} onClick={handleCopyLink} color={copied ? C.green : '#e5e7eb'} />
                    <ShareMenuItem icon={<ExternalLink size={15} />} label="Share to X" onClick={handleShareTwitter} />
                    <ShareMenuItem icon={<MessageCircle size={15} />} label="Share to Chat" onClick={() => { navigate('chat'); setShowShareMenu(false) }} />
                    <ShareMenuItem icon={<Users size={15} />} label="Share to Groups" onClick={() => setShowShareMenu(false)} />
                    <ShareMenuItem icon={<Zap size={15} />} label="Generate QR Code" onClick={() => setShowShareMenu(false)} />
                    {navigator.share && <ShareMenuItem icon={<Share2 size={15} />} label="Share..." onClick={handleNativeShare} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Report */}
            <ActionBtn icon={<Flag size={18} />} label="" onClick={() => setShowReportModal(true)} color={C.muted} />
          </div>
        </div>

        {/* ─── Main Comment Composer ─── */}
        <div style={{ marginBottom: 20, background: C.card, borderRadius: 14, border: `1px solid ${C.cardBdr}`, padding: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: user?.user_metadata?.avatar_url ? `url(${user.user_metadata.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff',
            }}>
              {user?.user_metadata?.display_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <RichCommentComposer
                postId={postId}
                postAuthorId={post.author_id}
                onCommentSent={() => {
                  setCommentCount(c => c + 1)
                  loadComments()
                }}
              />
            </div>
          </div>
        </div>

        {/* ─── Comments Section ─── */}
        <div ref={commentsRef}>
          {/* Sort Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={16} color={C.text} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
                Discussion
              </h3>
              <span style={{
                fontSize: 12, color: C.cyan, background: `${C.cyan}10`,
                padding: '2px 8px', borderRadius: 6, fontWeight: 700,
              }}>
                {commentCount}
              </span>
            </div>

            {/* Sort Dropdown */}
            <div ref={sortRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.cardBdr}`,
                  background: 'transparent', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {currentSort.icon} {currentSort.label} <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 4,
                      background: '#141420', border: `1px solid ${C.border}`, borderRadius: 10,
                      padding: '4px 0', zIndex: 50, minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                          padding: '8px 14px', background: sortBy === opt.value ? `${C.cyan}10` : 'none',
                          border: 'none', color: sortBy === opt.value ? C.cyan : '#e5e7eb',
                          fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = sortBy === opt.value ? `${C.cyan}10` : 'none'}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Comments List */}
          {loadingComments ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ width: 24, height: 24, border: `2px solid ${C.cardBdr}`, borderTopColor: C.cyan, borderRadius: '50%' }} />
            </div>
          ) : comments.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '50px 20px', color: C.muted,
              background: C.card, borderRadius: 14, border: `1px solid ${C.cardBdr}`,
            }}>
              <MessageCircle size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.text }}>Start the discussion</p>
              <p style={{ margin: 0, fontSize: 13 }}>Share your thoughts and insights on this topic</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {comments.map(comment => (
                <motion.div key={comment.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <CommentThread
                    comment={comment}
                    depth={0}
                    postId={postId}
                    postAuthorId={post.author_id}
                    navigate={navigate}
                    onReplyAdded={() => {
                      setCommentCount(c => c + 1)
                    }}
                    onCommentDeleted={() => {
                      setCommentCount(c => Math.max(0, c - 1))
                    }}
                  />
                  <div style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Community Consensus ─── */}
        <div style={{ marginTop: 24, padding: '16px 18px', background: C.card, borderRadius: 14, border: `1px solid ${C.cardBdr}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BarChart3 size={16} color={C.cyan} />
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Community Consensus</h4>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Bullish', pct: 62, color: '#34D399' },
              { label: 'Bearish', pct: 12, color: '#ef4444' },
              { label: 'Neutral', pct: 26, color: '#6b7280' },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, minWidth: 80 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{item.label}</div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginTop: 2 }}>{item.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Related Discussions ─── */}
        <div style={{ marginTop: 20, padding: '16px 18px', background: C.card, borderRadius: 14, border: `1px solid ${C.cardBdr}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingUp size={16} color={C.cyan} />
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Related Discussions</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['The Future of AI in 2026', 'Top 10 DeFi Protocols', 'Web3 Gaming Revolution', 'Sustainable Energy Solutions'].map(title => (
              <div key={title}
                onClick={() => {}}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Hash size={14} color={C.muted} />
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{title}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: C.muted }}>{Math.floor(Math.random() * 100)} replies</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Active Participants ─── */}
        <div style={{ marginTop: 20, padding: '16px 18px', background: C.card, borderRadius: 14, border: `1px solid ${C.cardBdr}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Users size={16} color={C.cyan} />
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>People Following This Discussion</h4>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'].map((url, i) => (
              <div key={i} style={{
                width: 34, height: 34, borderRadius: '50%',
                background: `url(${url}?auto=format&fit=crop&w=150&h=150&q=80) center/cover`,
                border: '2px solid #0a0e14', marginLeft: i > 0 ? -10 : 0,
                cursor: 'pointer',
              }} />
            ))}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', marginLeft: -10,
              background: `${C.cyan}15`, border: '2px solid #0a0e14',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: C.cyan, cursor: 'pointer',
            }}>
              +{Math.floor(Math.random() * 20) + 5}
            </div>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
            <span style={{ color: C.green }}>● 12 online now</span>
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>

      {/* ─── Report Modal ─── */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setShowReportModal(false)}
          >
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#0d1117', border: `1px solid ${C.border}`, borderRadius: 18,
                padding: 24, maxWidth: 340, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flag size={18} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Report this post</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Help us keep the community safe</p>
                </div>
              </div>
              {['Spam', 'Misleading', 'Harassment', 'Hate speech', 'Copyright violation', 'Other'].map(reason => (
                <button key={reason} onClick={() => setShowReportModal(false)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                    background: 'none', border: 'none', color: '#d1d5db', fontSize: 13,
                    borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {reason}
                </button>
              ))}
              <button onClick={() => setShowReportModal(false)}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)', color: '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8,
                }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Reusable Sub-components ─── */

function ActionBtn({ icon, label, onClick, color, animate }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  color: string; animate?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      animate={animate ? { scale: [1, 1.3, 1] } : {}}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
        borderRadius: 8, border: 'none', background: 'transparent',
        color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      {label && <span>{label}</span>}
    </motion.button>
  )
}

function ShareMenuItem({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '9px 14px', background: 'none', border: 'none',
        color: color || '#e5e7eb', fontSize: 13, fontWeight: 500,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {icon}
      {label}
    </button>
  )
}
