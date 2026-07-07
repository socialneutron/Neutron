import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Heart, MessageCircle, Repeat2, Bookmark, Share2,
  MoreHorizontal, Trash2, Link, ExternalLink, Send, Bell,
  TrendingUp, Users, Clock, Sparkles, ChevronDown,
  Hash, Eye, Star, Zap, Copy, Languages, GitFork, Award,
  Lightbulb, Plus, MessageSquare, Shield, Check, X,
  ThumbsUp, Flame, Rocket, Filter, Search,
  Smile,
} from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { postService, likeService, repostService, bookmarkService, commentService, notificationService } from '../../services'
import { useFeedStore } from '../../stores/feedStore'
import { useScrollPositionStore } from '../../stores/scrollPositionStore'
import { supabase } from '../../lib/supabase'
import type { PostWithAuthor, CommentWithAuthor, User } from '../../types/database'
import CommentThread, { type CommentNodeData } from '../../components/social/CommentThread'
import RichCommentComposer from '../../components/social/RichCommentComposer'
import NeutronLogo from '../../components/NeutronLogo'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  accent: '#00D2FF', cyan: '#00D2FF', green: '#34D399', purple: '#7928CA',
  red: '#ef4444', orange: '#f59e0b', pink: '#ec4899',
  text: '#f1f5f9', muted: '#6b7280', border: 'rgba(255,255,255,0.06)',
}

const SORT_OPTIONS = [
  { value: 'top', label: 'Top', icon: <TrendingUp size={14} /> },
  { value: 'newest', label: 'Newest', icon: <Clock size={14} /> },
  { value: 'oldest', label: 'Oldest', icon: <Clock size={14} /> },
  { value: 'most_liked', label: 'Most Liked', icon: <Heart size={14} /> },
  { value: 'most_replied', label: 'Most Replied', icon: <MessageCircle size={14} /> },
  { value: 'most_relevant', label: 'Most Relevant', icon: <Sparkles size={14} /> },
  { value: 'expert_insights', label: 'Expert Insights', icon: <Award size={14} /> },
]

const SHARE_OPTIONS = [
  { id: 'copy', icon: <Link size={15} />, label: 'Copy Link' },
  { id: 'chat', icon: <MessageSquare size={15} />, label: 'Share to Chat' },
  { id: 'external', icon: <ExternalLink size={15} />, label: 'Share Externally' },
]

interface PostDiscussionPageProps {
  postId: string
  navigate: (page: string, params?: any) => void
}

export default function PostDiscussionPage({ postId, navigate }: PostDiscussionPageProps) {
  const { user } = useSupabaseAuth()
  const { updatePost } = useFeedStore()
  const { setPosition } = useScrollPositionStore()

  // Post state
  const [post, setPost] = useState<PostWithAuthor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Engagement state
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [reposted, setReposted] = useState(false)
  const [repostCount, setRepostCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [likeAnimating, setLikeAnimating] = useState(false)

  // Comment state
  const [comments, setComments] = useState<CommentNodeData[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [sortBy, setSortBy] = useState('top')
  const [showSortMenu, setShowSortMenu] = useState(false)

  // UI state
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [showFAB, setShowFAB] = useState(true)

  // Refs
  const shareRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  const commentsRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShareMenu(false)
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load post (with fallback for mock/dev)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      let data = await postService.getById(postId, user?.id)
      if (data) {
        setPost(data)
        setLiked(data.is_liked || false)
        setLikeCount(data.likes_count || 0)
        setBookmarked(data.is_bookmarked || false)
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

  // Real-time comment subscription via Supabase Realtime
  useEffect(() => {
    if (!postId) return
    const channel = supabase
      .channel(`comments:${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      }, () => {
        loadComments()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [postId])

  // Load comments
  const loadComments = useCallback(async () => {
    setLoadingComments(true)
    try {
      const data = await commentService.getByPost(postId)
      const nodes: CommentNodeData[] = await Promise.all(data.map(async (c, i) => {
        const replies = await commentService.getReplies(c.id)
        return {
          ...c,
          replies: replies.map(r => ({
            ...r,
            replies: [],
            showReplies: false,
            replyCount: 0,
            insight_score: 0,
            reactions: {},
          })),
          showReplies: false,
          replyCount: replies.length,
          insight_score: Math.floor(Math.random() * 50),
          reactions: {
            like: Math.floor(Math.random() * 10),
            insightful: Math.floor(Math.random() * 5),
            interesting: Math.floor(Math.random() * 3),
            fire: Math.floor(Math.random() * 4),
          },
          is_author_approved: post?.author_id === c.author_id && false,
          expertise_badges: i === 0 ? ['developer'] : i === 1 ? ['investor', 'web3_specialist'] : i === 2 ? ['ai_expert'] : i === 3 ? ['ca'] : i === 4 ? ['entrepreneur'] : undefined,
        }
      }))
      if (user) {
        const likedIds = await likeService.getUserLikedComments(user.id, nodes.map(c => c.id))
        nodes.forEach(c => { c.is_liked = likedIds.has(c.id) })
      }
      const approved = nodes.find(c => c.is_author_approved)
      const rest = nodes.filter(c => !c.is_author_approved)
      const sorted = sortComments(approved ? [approved, ...rest] : rest, sortBy)
      setComments(sorted)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
    setLoadingComments(false)
  }, [postId, user, sortBy, post?.author_id])

  useEffect(() => { if (post) loadComments().catch(() => {}) }, [loadComments, post])

  const sortComments = useCallback((nodes: CommentNodeData[], sort: string) => {
    const arr = [...nodes]
    switch (sort) {
      case 'newest':
        return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'oldest':
        return arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'most_liked':
        return arr.sort((a, b) => b.likes_count - a.likes_count)
      case 'most_replied':
        return arr.sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0))
      case 'most_relevant':
        return arr.sort((a, b) => ((b.insight_score || 0) + b.likes_count) - ((a.insight_score || 0) + a.likes_count))
      case 'expert_insights':
        return arr.sort((a, b) => {
          const aExpert = (a.expertise_badges?.length || 0) * 100 + (a.insight_score || 0)
          const bExpert = (b.expertise_badges?.length || 0) * 100 + (b.insight_score || 0)
          return bExpert - aExpert
        })
      default:
        return arr.sort((a, b) => b.likes_count - a.likes_count)
    }
  }, [])

  // Engagement handlers
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
    setBookmarked(newBookmarked)
    try {
      await bookmarkService.toggle(user.id, post.id)
      updatePost(post.id, { is_bookmarked: newBookmarked })
    } catch {
      setBookmarked(prevBookmarked)
    }
  }, [user, bookmarked, post, updatePost])

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

  const handleShareOption = useCallback(async (id: string) => {
    const url = `${window.location.origin}/post/${postId}`
    try {
      switch (id) {
        case 'copy':
          await navigator.clipboard.writeText(url)
          setCopied(true); setTimeout(() => setCopied(false), 2000)
          break
        case 'chat':
          navigate('chat')
          break
        case 'external':
          if (navigator.share) await navigator.share({ title: post?.title || '', url })
          break
      }
    } catch {}
    setShowShareMenu(false)
  }, [postId, post?.title, navigate])

  const handleBack = useCallback(() => {
    setPosition('home-feed', window.scrollY)
    navigate('home')
  }, [navigate, setPosition])

  const handleDelete = useCallback(async () => {
    if (!user || !post || user.id !== post.author_id) return
    try {
      const success = await postService.delete(post.id, user.id)
      if (success) navigate('home')
    } catch {}
  }, [user, post, navigate])

  // Helpers
  const formatNum = (n: number) => (n || 0) >= 1000 ? ((n || 0) / 1000).toFixed(1) + 'K' : String(n || 0)

  const fullDate = (date: string) => new Date(date).toLocaleString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  // Markdown renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('### '))
        return <h3 key={i} style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '16px 0 8px' }}>{renderInline(line.slice(4))}</h3>
      if (line.startsWith('## '))
        return <h2 key={i} style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '18px 0 8px' }}>{renderInline(line.slice(3))}</h2>
      if (line.startsWith('# '))
        return <h1 key={i} style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '20px 0 8px' }}>{renderInline(line.slice(2))}</h1>
      if (line.startsWith('- ') || line.startsWith('* '))
        return <li key={i} style={{ color: '#c9cdd4', fontSize: 15, lineHeight: 1.7, marginLeft: 20 }}>{renderInline(line.slice(2))}</li>
      if (line.startsWith('> '))
        return <blockquote key={i} style={{ borderLeft: `3px solid ${C.cyan}`, padding: '8px 14px', margin: '12px 0', background: `${C.cyan}05`, borderRadius: '0 8px 8px 0', color: '#c9cdd4', fontSize: 15, lineHeight: 1.6 }}>{renderInline(line.slice(2))}</blockquote>
      if (line.startsWith('```') && line.endsWith('```'))
        return <code key={i} style={{ display: 'block', background: '#0d1117', padding: '12px 16px', borderRadius: 8, margin: '12px 0', fontSize: 13, color: '#e6edf3', overflow: 'auto', fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${C.cardBdr}` }}>{line.slice(3, -3)}</code>
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

  // Skeleton loader
  const renderSkeleton = () => (
    <div style={{ padding: '20px 0' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 20, padding: '16px 0' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, width: '40%', background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 12, width: '80%', background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 4 }} />
            <div style={{ height: 12, width: '60%', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
    </div>
  )

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>📭</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{error || 'Post not found'}</p>
        <button onClick={handleBack} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.cyan}30`, background: `${C.cyan}10`, color: C.cyan, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          ← Go Back
        </button>
      </div>
    )
  }

  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy) || SORT_OPTIONS[0]

  return (
    <div ref={pageRef} style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      {/* ═══ 1. FULL TOP NAV BAR (Neutron branding + Search + Notifications + Profile) ═══ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: `${C.bg}ee`, backdropFilter: 'blur(12px)',
        padding: '10px 18px', borderBottom: `1px solid ${C.cardBdr}`,
      }}>
        {/* Row 1: Brand + Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleBack} style={{
            background: 'rgba(7,17,36,0.7)', border: `1px solid rgba(0,210,255,0.1)`,
            borderRadius: 10, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.muted, flexShrink: 0,
          }}>
            <ArrowLeft size={18} />
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '1px', fontFamily: 'Michroma, sans-serif' }}>
              neutron
            </span>
          </div>

          {user?.id === post.author_id && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleDelete}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.08)', color: C.red, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Trash2 size={12} />
            </motion.button>
          )}
        </div>

        {/* Row 2: Search Bar + Notifications + Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`,
            borderRadius: 10, padding: '7px 12px',
          }}>
            <Search size={15} color={C.muted} />
            <input placeholder="Search posts, topics, users..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#fff', fontSize: 13, fontFamily: 'inherit',
              }}
            />
          </div>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('notifications')}
            style={{
              position: 'relative', width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.muted,
            }}
          >
            <Bell size={15} />
            <span style={{
              position: 'absolute', top: -3, right: -3, width: 16, height: 16,
              borderRadius: '50%', background: '#ef4444', color: '#fff',
              fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>3</span>
          </motion.button>

          <motion.div whileHover={{ scale: 1.05 }} onClick={() => navigate('profile')}
            style={{
              width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
              background: user?.user_metadata?.avatar_url
                ? `url(${user.user_metadata.avatar_url}) center/cover`
                : 'linear-gradient(135deg, #00D2FF, #7B61FF)',
              border: '2px solid rgba(0,210,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}
          >
            {!user?.user_metadata?.avatar_url && (user?.user_metadata?.display_name?.[0]?.toUpperCase() || 'U')}
          </motion.div>
        </div>
      </div>

      {/* ═══ 2. MAIN LAYOUT ═══ */}
      <div style={{
        maxWidth: 700, margin: '0 auto',
        padding: '0 18px',
        position: 'relative',
      }}>
        {/* ─── POST CONTENT ─── */}
        <div style={{ minWidth: 0 }}>

          {/* ═══ 3. MAIN POST PRESENTATION AREA ═══ */}
          <div style={{ padding: '20px 0' }}>
            {/* Author Identity Header */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div
                onClick={() => navigate('profile', { author: { id: post.author_id, name: post.author?.display_name, handle: `@${post.author?.username}`, avatar: post.author?.avatar_url, verified: post.author?.is_verified } })}
                style={{
                  width: 52, height: 52, borderRadius: 14, cursor: 'pointer', flexShrink: 0,
                  background: post.author?.avatar_url
                    ? `url(${post.author.avatar_url}) center/cover`
                    : `linear-gradient(135deg, ${post.category_color}60, #8a2be260)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff',
                  border: post.is_author_approved ? `2px solid ${C.cyan}` : 'none',
                  boxShadow: post.is_author_approved ? `0 0 12px ${C.cyan}40` : 'none',
                  position: 'relative',
                }}
              >
                {!post.author?.avatar_url && post.author?.display_name?.[0]?.toUpperCase()}
                {post.author?.is_verified && (
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.bg}` }}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </div>
                )}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 12, color: C.muted, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={11} /> {formatNum(post.author?.followers_count || 0)} followers
                  </span>
                  <span>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Award size={11} /> Reputation {Math.floor(Math.random() * 100) + 50}
                  </span>
                  <span>·</span>
                  <span>{timeAgo(post.created_at)}</span>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.cyan}`,
                  background: `${C.cyan}12`, color: C.cyan, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                + Follow
              </motion.button>
            </div>

            {/* Post Title */}
            <h1 style={{
              margin: '0 0 12px', fontSize: 26, fontWeight: 800, color: C.text,
              lineHeight: 1.3, letterSpacing: '-0.3px', fontFamily: 'var(--font-heading)',
            }}>
              {post.title}
            </h1>

            {/* Post Body with Markdown */}
            <div style={{ marginBottom: 14 }}>
              {renderMarkdown(post.body || '')}
            </div>

            {/* Image */}
            {post.image_url && (
              <motion.img
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={post.image_url} alt=""
                style={{
                  width: '100%', borderRadius: 14, marginBottom: 14,
                  maxHeight: 500, objectFit: 'cover', border: `1px solid ${C.cardBdr}`,
                }}
              />
            )}

            {/* Hashtags & Category */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, alignItems: 'center' }}>
              {post.tags?.length > 0 && post.tags.map(tag => (
                <span key={tag} onClick={() => navigate('explore', { tag })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 13, color: C.cyan, cursor: 'pointer',
                    background: `${C.cyan}08`, padding: '4px 10px', borderRadius: 6,
                    border: `1px solid ${C.cyan}18`, fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                >
                  <Hash size={12} />{tag}
                </span>
              ))}
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

            {/* ═══ 4. ENGAGEMENT BAR ═══ */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              padding: '4px 0', borderBottom: `1px solid ${C.border}`,
            }}>
              <EngagementBtn icon={
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 2} />
              } label={formatNum(likeCount)} onClick={handleLike}
                color={liked ? '#f87171' : C.muted} animate={likeAnimating} active={liked} />

              <EngagementBtn icon={<MessageCircle size={20} />} label={formatNum(commentCount)}
                onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' })} color={C.muted} />

              <EngagementBtn icon={<Repeat2 size={20} />} label={formatNum(repostCount)}
                onClick={() => setShowRepostModal(true)} color={reposted ? C.green : C.muted} active={reposted} />

              <EngagementBtn icon={<Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />}
                label="" onClick={handleBookmark} color={bookmarked ? C.cyan : C.muted} active={bookmarked} />

              {/* Share */}
              <div ref={shareRef} style={{ position: 'relative' }}>
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
                    borderRadius: 8, border: 'none', background: 'transparent',
                    color: showShareMenu ? C.cyan : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Share2 size={20} />
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
                        padding: '6px 0', zIndex: 50, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      }}
                    >
                      {SHARE_OPTIONS.map(opt => (
                        <ShareMenuItem key={opt.id}
                          icon={opt.id === 'copy' && copied ? <Check size={15} color={C.green} /> : opt.icon}
                          label={opt.id === 'copy' && copied ? 'Copied!' : opt.label}
                          onClick={() => handleShareOption(opt.id)}
                          color={opt.id === 'copy' && copied ? C.green : undefined}
                        />
                      ))}
                      {navigator.share && (
                        <ShareMenuItem icon={<Share2 size={15} />} label="Native Share..." onClick={() => handleShareOption('external')} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ═══ 5. RICH COMMENT SECTION ═══ */}
          <div ref={commentsRef} style={{ marginTop: 8 }}>
            {/* Comment Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
              padding: '0 4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={18} color={C.text} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>
                  Discussion
                </h3>
                <span style={{
                  fontSize: 12, color: C.cyan, background: `${C.cyan}10`,
                  padding: '2px 8px', borderRadius: 6, fontWeight: 700,
                }}>
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
                        padding: '4px 0', zIndex: 50, minWidth: 170, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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

            {/* Composer */}
            <div ref={composerRef} style={{
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
                    onCommentSent={() => {
                      setCommentCount(c => c + 1)
                      loadComments()
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ═══ 6. INFINITE NESTED DISCUSSION TREE ═══ */}
            {loadingComments ? (
              renderSkeleton()
            ) : comments.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  textAlign: 'center', padding: '60px 20px', color: C.muted,
                  background: C.card, borderRadius: 14, border: `1px solid ${C.cardBdr}`,
                }}
              >
                <MessageCircle size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
                <p style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: C.text }}>Start the discussion</p>
                <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Share your thoughts and insights on this topic</p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence mode="popLayout">
                  {comments.map((comment, idx) => (
                    <motion.div
                      key={comment.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                    >
                      {/* Author Approved Insight - pinned to top */}
                      {comment.is_author_approved && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', marginBottom: 8,
                          background: `${C.cyan}08`, borderRadius: 8,
                          border: `1px solid ${C.cyan}25`,
                        }}>
                          <Award size={14} color={C.cyan} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.cyan }}>Author Approved Insight</span>
                          <Sparkles size={12} color={C.cyan} />
                        </div>
                      )}
                      <div style={{
                        border: comment.is_author_approved ? `1px solid ${C.cyan}30` : 'none',
                        borderRadius: comment.is_author_approved ? 12 : 0,
                        padding: comment.is_author_approved ? '4px 8px 0' : 0,
                        background: comment.is_author_approved ? `${C.cyan}02` : 'none',
                        marginBottom: 4,
                      }}>
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
                      </div>
                      {!comment.is_author_approved && (
                        <div style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }} />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* View More */}
                {comments.length >= 50 && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {}}
                    style={{
                      marginTop: 16, padding: '10px', width: '100%',
                      borderRadius: 10, border: `1px solid ${C.cardBdr}`,
                      background: 'rgba(255,255,255,0.02)', color: C.cyan,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    View More Replies
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FAB - Create Post ═══ */}
      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => navigate('create')}
        style={{
          position: 'fixed', bottom: 100, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00D2FF, #7B61FF)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,210,255,0.3)',
          color: '#fff',
        }}
      >
        <Plus size={24} />
      </motion.button>

      {/* ═══ REPOST MODAL ═══ */}
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
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${C.green}12`, border: `1px solid ${C.green}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Repeat2 size={18} color={C.green} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  Repost to your feed
                </h3>
                <div style={{ flex: 1 }} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowRepostModal(false)}
                  style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </motion.button>
              </div>

              <div style={{
                background: C.card, borderRadius: 12, border: `1px solid ${C.cardBdr}`,
                padding: 12, marginBottom: 16,
              }}>
                <p style={{ fontSize: 13, color: '#c9cdd4', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.title}
                </p>
              </div>

              <textarea
                placeholder="Add your thoughts (optional)..."
                rows={3}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardBdr}`,
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff',
                  outline: 'none', resize: 'none', fontFamily: 'inherit',
                }}
              />

              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowRepostModal(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.cardBdr}`,
                    background: 'transparent', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { handleRepost(); setShowRepostModal(false) }}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: `linear-gradient(135deg, ${C.green}, #059669)`,
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Repost
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══ SUB-COMPONENTS ═══

function EngagementBtn({ icon, label, onClick, color, animate, active }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  color: string; animate?: boolean; active?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      animate={animate ? { scale: [1, 1.3, 1] } : {}}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
        borderRadius: 8, border: 'none', background: active ? `${color}10` : 'transparent',
        color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = active ? `${color}10` : 'transparent'}
    >
      {icon}
      {label && <span>{label}</span>}
    </motion.button>
  )
}

function ShareMenuItem({ icon, label, onClick, color }: {
  icon: React.ReactNode; label: string; onClick: () => void; color?: string
}) {
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
