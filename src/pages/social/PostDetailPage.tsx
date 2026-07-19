import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Heart, MessageCircle, Repeat2, Bookmark, Share2,
  MoreHorizontal, Trash2, Send, Check, X, ChevronDown,
  Users, Award, Hash, Search, Bell, Plus, Flag, Copy,
  ExternalLink, MessageSquare,
} from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import {
  postService, likeService, repostService, bookmarkService,
  commentService, followService, notificationService,
} from '../../services'
import { useFeedStore } from '../../stores/feedStore'
import CommentThread from '../../components/social/CommentThread'
import RichCommentComposer from '../../components/social/RichCommentComposer'
import PostImages, { resolvePostImages } from '../../components/social/PostImages'
import type { PostWithAuthor, CommentWithAuthor } from '../../types/database'
import { timeAgo } from '@/lib/timeAgo'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', green: '#34D399', purple: '#7928CA', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280', border: 'rgba(255,255,255,0.06)',
}

interface PostDetailPageProps {
  postId: string
  navigate: (page: string, params?: any) => void
}

export default function PostDetailPage({ postId, navigate }: PostDetailPageProps) {
  const { user } = useSupabaseAuth()
  const { updatePost, removePost } = useFeedStore()

  const [post, setPost] = useState<PostWithAuthor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [reposted, setReposted] = useState(false)
  const [repostCount, setRepostCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [sortBy, setSortBy] = useState('top')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [repostComment, setRepostComment] = useState('')
  const [reposting, setReposting] = useState(false)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const commentsRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)
  const isTogglingLike = useRef(false)

  const isOwnPost = user?.id === post?.author_id

  const resolvedImages = resolvePostImages(post)

  const SORT_OPTIONS = [
    { value: 'top', label: 'Top', icon: <Award size={14} /> },
    { value: 'newest', label: 'Newest', icon: <Check size={14} /> },
    { value: 'oldest', label: 'Oldest', icon: <Check size={14} /> },
    { value: 'most_liked', label: 'Most Liked', icon: <Heart size={14} /> },
    { value: 'most_replies', label: 'Most Replied', icon: <MessageCircle size={14} /> },
  ]

  const SHARE_OPTIONS = [
    { id: 'copy', label: 'Copy Link', icon: <Copy size={15} /> },
    { id: 'chat', label: 'Share to Chat', icon: <MessageSquare size={15} /> },
    { id: 'external', label: 'Open in Browser', icon: <ExternalLink size={15} /> },
  ]

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    postService.getById(postId, user?.id).then(p => {
      if (cancelled) return
      if (!p) { setError('Post not found'); setLoading(false); return }
      setPost(p)
      setLiked(p.is_liked || false)
      setLikeCount(p.likes_count || 0)
      setBookmarked(p.is_bookmarked || false)
      setReposted(p.is_reposted || false)
      setRepostCount(p.reposts_count || 0)
      setCommentCount(p.comments_count || 0)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) { setError('Failed to load post'); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [postId, user?.id])

  const loadComments = useCallback(async () => {
    if (!postId) return
    setLoadingComments(true)
    try {
      const data = await commentService.getByPost(postId)
      if (user) {
        const likedIds = await likeService.getUserLikedComments(user.id, data.map(c => c.id))
        data.forEach(c => { (c as any).is_liked = likedIds.has(c.id) })
      }
      setComments(data)
    } catch {}
    setLoadingComments(false)
  }, [postId, user])

  useEffect(() => { loadComments() }, [loadComments])

  useEffect(() => {
    if (post?.author_id && user && !isOwnPost) {
      followService.isFollowing(user.id, post.author_id).then(setIsFollowing).catch(() => {})
    }
  }, [post?.author_id, user, isOwnPost])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false)
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShareMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const handleLike = useCallback(async () => {
    if (!user || !post || isTogglingLike.current) return
    isTogglingLike.current = true
    const prev = liked
    const prevCount = likeCount
    const next = !liked
    setLiked(next)
    setLikeCount(next ? prevCount + 1 : prevCount - 1)
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 600)
    updatePost(post.id, { is_liked: next, likes_count: next ? prevCount + 1 : prevCount - 1 })
    try {
      const result = await likeService.toggle(user.id, post.id)
      // Reconcile if server result differs from optimistic update
      if (result !== next) {
        setLiked(result)
        setLikeCount(result ? prevCount + 1 : prevCount - 1)
        updatePost(post.id, { is_liked: result, likes_count: result ? prevCount + 1 : prevCount - 1 })
      }
      if (result && post.author_id !== user.id) {
        notificationService.create(post.author_id, user.id, 'like', post.id).catch(() => {})
      }
    } catch {
      setLiked(prev)
      setLikeCount(prevCount)
      updatePost(post.id, { is_liked: prev, likes_count: prevCount })
    } finally {
      isTogglingLike.current = false
    }
  }, [user, liked, likeCount, post, updatePost])

  const handleBookmark = useCallback(async () => {
    if (!user || !post) return
    const next = !bookmarked
    setBookmarked(next)
    updatePost(post.id, { is_bookmarked: next })
    try {
      await bookmarkService.toggle(user.id, post.id)
    } catch {
      setBookmarked(!next)
      updatePost(post.id, { is_bookmarked: !next })
    }
  }, [user, bookmarked, post, updatePost])

  const handleRepostSubmit = useCallback(async () => {
    if (!user || !post || reposting || reposted) return
    setReposting(true)
    try {
      await repostService.toggle(user.id, post.id)
      const newPost = await postService.create({
        authorId: user.id,
        title: `Reposted from @${post.author?.username}`,
        body: repostComment || '',
        category: post.category || 'General',
        tags: post.tags || [],
        image_url: post.image_url,
        is_repost: true,
        repost_of: post.id,
      })
      if (newPost) {
        updatePost(post.id, { is_reposted: true, reposts_count: (post.reposts_count || 0) + 1 })
        notificationService.create(post.author_id, user.id, 'repost', post.id).catch(() => {})
      }
    } catch {}
    setReposting(false)
    setRepostComment('')
    setShowRepostModal(false)
  }, [user, post, reposting, reposted, repostComment, updatePost])

  const handleFollow = useCallback(async () => {
    if (!user || !post || followLoading || isOwnPost) return
    setFollowLoading(true)
    const prev = isFollowing
    setIsFollowing(!prev)
    try {
      await followService.toggle(user.id, post.author_id)
    } catch {
      setIsFollowing(prev)
    }
    setFollowLoading(false)
  }, [user, post, followLoading, isFollowing, isOwnPost])

  const handleDelete = useCallback(async () => {
    if (!user || !post) return
    try {
      await postService.delete(post.id, user.id)
      removePost(post.id)
      navigate('home')
    } catch {}
  }, [user, post, removePost, navigate])

  const handleShareOption = useCallback((id: string) => {
    if (id === 'copy') {
      navigator.clipboard?.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else if (id === 'external') {
      window.open(window.location.href, '_blank')
    }
    setShowShareMenu(false)
  }, [])

  const formatNum = (n: number) => (n || 0) >= 1000 ? ((n || 0) / 1000).toFixed(1) + 'K' : String(n || 0)

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '16px 0 8px' }}>{renderInline(line.slice(4))}</h3>
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '18px 0 8px' }}>{renderInline(line.slice(3))}</h2>
      if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '20px 0 8px' }}>{renderInline(line.slice(2))}</h1>
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ color: '#c9cdd4', fontSize: 15, lineHeight: 1.7, marginLeft: 20 }}>{renderInline(line.slice(2))}</li>
      if (line.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: `3px solid ${C.cyan}`, padding: '8px 14px', margin: '12px 0', background: `${C.cyan}05`, borderRadius: '0 8px 8px 0', color: '#c9cdd4', fontSize: 15, lineHeight: 1.6 }}>{renderInline(line.slice(2))}</blockquote>
      if (line.startsWith('```') && line.endsWith('```')) return <code key={i} style={{ display: 'block', background: '#0d1117', padding: '12px 16px', borderRadius: 8, margin: '12px 0', fontSize: 13, color: '#e6edf3', overflow: 'auto', fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${C.cardBdr}` }}>{line.slice(3, -3)}</code>
      if (line === '') return <br key={i} />
      return <p key={i} style={{ margin: '6px 0', fontSize: 16, color: '#c9cdd4', lineHeight: 1.7 }}>{renderInline(line)}</p>
    })
  }

  const renderInline = (text: string) => {
    const parts: React.ReactNode[] = []
    const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[([^\]]+)\]\(([^)]+)\))|(#\w+)|(@\w+)/g
    let last = 0
    let match: RegExpExecArray | null
    let idx = 0
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index))
      const [full, code, bold, italic, link, linkText, linkUrl, hashtag, mention] = match
      if (code) parts.push(<code key={idx++} style={{ background: 'rgba(0,210,255,0.1)', padding: '1px 6px', borderRadius: 4, fontSize: '0.9em', color: C.cyan, fontFamily: "'JetBrains Mono', monospace" }}>{code.slice(1, -1)}</code>)
      else if (bold) parts.push(<strong key={idx++} style={{ fontWeight: 800, color: '#fff' }}>{bold.slice(2, -2)}</strong>)
      else if (italic) parts.push(<em key={idx++} style={{ fontStyle: 'italic', color: '#e2e8f0' }}>{italic.slice(1, -1)}</em>)
      else if (link) parts.push(<a key={idx++} href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.cyan, textDecoration: 'none', borderBottom: `1px solid ${C.cyan}40` }}>{linkText}</a>)
      else if (hashtag) parts.push(<span key={idx++} onClick={() => navigate('explore', { tag: hashtag.slice(1) })} style={{ color: C.cyan, cursor: 'pointer', fontWeight: 600 }}>{hashtag}</span>)
      else if (mention) parts.push(<span key={idx++} onClick={() => navigate('profile', { author: { handle: mention } })} style={{ color: C.cyan, cursor: 'pointer', fontWeight: 600 }}>{mention}</span>)
      last = match.index + full.length
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts.length > 0 ? parts : text
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
    </div>
  )

  if (error || !post) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{error || 'Post not found'}</p>
        <button onClick={() => navigate('home')} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.cyan}30`, background: `${C.cyan}10`, color: C.cyan, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      {/* Sticky top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: `${C.bg}ee`, backdropFilter: 'blur(12px)',
        padding: '10px 18px', borderBottom: `1px solid ${C.cardBdr}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('home')} style={{
            background: 'rgba(7,17,36,0.7)', border: `1px solid rgba(0,210,255,0.1)`,
            borderRadius: 10, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.muted, flexShrink: 0,
          }}>
            <ArrowLeft size={18} />
          </motion.button>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '1px', fontFamily: 'Michroma, sans-serif', flex: 1 }}>
            Post
          </span>
          {isOwnPost && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.08)', color: C.red, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Trash2 size={12} /> Delete
            </motion.button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 18px', position: 'relative' }}>
        {/* Author card */}
        <div style={{ padding: '20px 0 16px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              onClick={() => navigate('profile', { author: { id: post.author_id, name: post.author?.display_name, handle: `@${post.author?.username}`, avatar: post.author?.avatar_url, verified: post.author?.is_verified } })}
              style={{
                width: 52, height: 52, borderRadius: 14, cursor: 'pointer', flexShrink: 0,
                background: post.author?.avatar_url
                  ? `url(${post.author.avatar_url}) center/cover`
                  : `linear-gradient(135deg, ${post.category_color}60, #8a2be260)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff',
                border: post.is_author_approved ? `2px solid ${C.cyan}` : 'none',
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
                <span>{timeAgo(post.created_at)}</span>
              </div>
            </div>
            {!isOwnPost && (
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleFollow}
                  style={{
                    padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${isFollowing ? 'rgba(255,255,255,0.1)' : C.cyan}`,
                    background: isFollowing ? 'rgba(255,255,255,0.04)' : `${C.cyan}12`,
                    color: isFollowing ? C.muted : C.cyan,
                  }}
                >
                  {isFollowing ? 'Following' : '+ Follow'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('chat', { chat: { username: post.author?.username, id: post.author?.id, avatar: post.author?.avatar_url, displayName: post.author?.display_name } })}
                  style={{
                    padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <MessageSquare size={14} />
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Post content */}
        <div style={{ paddingBottom: 16 }}>
          <h1 style={{
            margin: '0 0 12px', fontSize: 26, fontWeight: 800, color: C.text,
            lineHeight: 1.3, letterSpacing: '-0.3px',
          }}>
            {post.title}
          </h1>

          <div style={{ marginBottom: 14 }}>
            {renderMarkdown(post.body || '')}
          </div>

          {/* Images */}
          {resolvedImages.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <PostImages images={resolvedImages} maxHeight={440} borderRadius={14} showBorder />
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {post.tags.map(tag => (
                <span key={tag} onClick={() => navigate('explore', { tag })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 13, color: C.cyan, cursor: 'pointer',
                    background: `${C.cyan}08`, padding: '4px 10px', borderRadius: 6,
                    border: `1px solid ${C.cyan}18`, fontWeight: 500,
                  }}
                >
                  <Hash size={12} />{tag}
                </span>
              ))}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                background: `${post.category_color}15`, color: post.category_color,
                border: `1px solid ${post.category_color}30`,
              }}>
                {post.category}
              </span>
            </div>
          )}

          {/* Timestamp */}
          <div style={{ padding: '10px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, color: C.muted }}>
              {new Date(post.created_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Engagement stats */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '8px 0', borderBottom: `1px solid ${C.border}`,
        }}>
          {[
            { icon: <Repeat2 size={18} />, count: repostCount, color: reposted ? C.green : C.muted, onClick: () => setShowRepostModal(true) },
            { icon: <MessageCircle size={18} />, count: commentCount, color: C.muted, onClick: () => commentsRef.current?.scrollIntoView({ behavior: 'smooth' }) },
            { icon: <Heart size={18} fill={liked ? 'currentColor' : 'none'} />, count: likeCount, color: liked ? '#f87171' : C.muted, onClick: handleLike },
            { icon: <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />, count: 0, color: bookmarked ? C.cyan : C.muted, onClick: handleBookmark },
          ].map((item, i) => (
            <motion.button key={i} whileTap={{ scale: 0.85 }} onClick={item.onClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                borderRadius: 8, border: 'none', background: 'transparent',
                color: item.color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {item.icon}
              {item.count > 0 && <span>{formatNum(item.count)}</span>}
            </motion.button>
          ))}

          {/* Share */}
          <div ref={shareRef} style={{ position: 'relative' }}>
            <motion.button whileTap={{ scale: 0.85 }}
              onClick={() => setShowShareMenu(!showShareMenu)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                borderRadius: 8, border: 'none', background: 'transparent',
                color: showShareMenu ? C.cyan : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Share2 size={18} />
            </motion.button>
            <AnimatePresence>
              {showShareMenu && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  style={{
                    position: 'absolute', right: 0, bottom: '100%', marginBottom: 8,
                    background: '#141420', border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: '6px 0', zIndex: 50, minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {SHARE_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => handleShareOption(opt.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '8px 14px', background: 'none', border: 'none',
                        color: opt.id === 'copy' && copied ? C.green : '#e5e7eb',
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      {opt.id === 'copy' && copied ? <Check size={15} /> : opt.icon}
                      {opt.id === 'copy' && copied ? 'Copied!' : opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Comment section */}
        <div ref={commentsRef} style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={18} color={C.text} />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Discussion</h3>
              <span style={{ fontSize: 12, color: C.cyan, background: `${C.cyan}10`, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                {commentCount}
              </span>
            </div>
            <div ref={sortRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowSortMenu(!showSortMenu)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.cardBdr}`,
                  background: 'transparent', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {SORT_OPTIONS.find(o => o.value === sortBy)?.icon} {SORT_OPTIONS.find(o => o.value === sortBy)?.label} <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 4,
                      background: '#141420', border: `1px solid ${C.border}`, borderRadius: 10,
                      padding: '4px 0', zIndex: 50, minWidth: 170, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortMenu(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                          padding: '8px 14px', background: sortBy === opt.value ? `${C.cyan}10` : 'none',
                          border: 'none', color: sortBy === opt.value ? C.cyan : '#e5e7eb',
                          fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Comment composer */}
          <div style={{
            marginBottom: 20, background: C.card, borderRadius: 14,
            border: `1px solid ${C.cardBdr}`, padding: 16,
          }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: user?.user_metadata?.avatar_url
                  ? `url(${user.user_metadata.avatar_url}) center/cover`
                  : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff',
              }}>
                {user?.user_metadata?.display_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <RichCommentComposer
                  postId={postId}
                  postAuthorId={post.author_id}
                  onCommentSent={() => { setCommentCount(c => c + 1); loadComments() }}
                />
              </div>
            </div>
          </div>

          {/* Comments */}
          {loadingComments ? (
            <div style={{ padding: '20px 0' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 20, padding: '16px 0' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '40%', background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 12, width: '80%', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px', color: C.muted,
              background: C.card, borderRadius: 14, border: `1px solid ${C.cardBdr}`,
            }}>
              <MessageCircle size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
              <p style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: C.text }}>Start the discussion</p>
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Share your thoughts and insights on this topic</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence mode="popLayout">
                {comments.map((comment, idx) => (
                  <motion.div key={comment.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                  >
                    <CommentThread
                      comment={comment}
                      depth={0}
                      postId={postId}
                      postAuthorId={post.author_id}
                      navigate={navigate}
                      onReplyAdded={() => setCommentCount(c => c + 1)}
                      onCommentDeleted={() => setCommentCount(c => Math.max(0, c - 1))}
                    />
                    <div style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => navigate('create')}
        style={{
          position: 'fixed', bottom: 100, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00D2FF, #7B61FF)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,210,255,0.3)', color: '#fff',
        }}
      >
        <Plus size={24} />
      </motion.button>

      {/* Repost modal */}
      <AnimatePresence>
        {showRepostModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setShowRepostModal(false)}
          >
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#0d1117', border: `1px solid ${C.border}`, borderRadius: 18,
                padding: 24, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Repeat2 size={20} color={C.green} />
                <span style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Repost</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => setShowRepostModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <textarea
                placeholder="Add your thoughts (optional)..."
                rows={3}
                value={repostComment}
                onChange={e => setRepostComment(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardBdr}`,
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff',
                  outline: 'none', resize: 'none', fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => setShowRepostModal(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.cardBdr}`,
                    background: 'transparent', color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleRepostSubmit} disabled={reposting}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                    background: reposted ? 'rgba(52,211,153,0.15)' : C.green, color: reposted ? C.green : '#000',
                    fontSize: 13, fontWeight: 700, cursor: reposting ? 'not-allowed' : 'pointer',
                    opacity: reposting ? 0.6 : 1,
                  }}
                >
                  {reposting ? 'Posting...' : reposted ? 'Reposted' : 'Repost'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#0d1117', border: `1px solid ${C.border}`, borderRadius: 18,
                padding: 24, maxWidth: 360, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: C.text }}>Delete Post?</h3>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: C.muted }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.cardBdr}`,
                    background: 'transparent', color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleDelete}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                    background: C.red, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
