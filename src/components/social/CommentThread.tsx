import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Trash2, Share2, Bookmark, Flag, Copy, Languages, GitFork, Award, Lightbulb, SmilePlus } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { likeService, commentService, notificationService } from '../../services'
import type { CommentWithAuthor, Comment } from '../../types/database'
import { timeAgo } from '@/lib/timeAgo'
import RichCommentComposer from './RichCommentComposer'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399',
  text: '#f1f5f9', muted: '#6b7280',
}

export interface CommentNodeData extends CommentWithAuthor {
  replies: CommentNodeData[]
  showReplies: boolean
  replyCount: number
  insight_score?: number
  reactions?: Record<string, number>
  is_author_approved?: boolean
  expertise_badges?: string[]
}

const REACTION_TYPES = [
  { emoji: '👍', key: 'like', label: 'Like' },
  { emoji: '❤️', key: 'love', label: 'Love' },
  { emoji: '🔥', key: 'fire', label: 'Fire' },
  { emoji: '🚀', key: 'rocket', label: 'Rocket' },
  { emoji: '💡', key: 'insightful', label: 'Insightful' },
  { emoji: '🤔', key: 'interesting', label: 'Interesting' },
  { emoji: '😄', key: 'funny', label: 'Funny' },
  { emoji: '🧠', key: 'genius', label: 'Genius' },
  { emoji: '📈', key: 'bullish', label: 'Bullish' },
]

const EXPERTISE_BADGES: Record<string, { label: string; color: string }> = {
  ai_expert: { label: 'AI Expert', color: '#8b5cf6' },
  startup_founder: { label: 'Startup Founder', color: '#f59e0b' },
  investor: { label: 'Investor', color: '#10b981' },
  legal_expert: { label: 'Legal Expert', color: '#3b82f6' },
  web3_specialist: { label: 'Web3 Specialist', color: '#00D2FF' },
  finance_pro: { label: 'Finance Professional', color: '#34D399' },
  ca: { label: 'CA', color: '#14b8a6' },
  entrepreneur: { label: 'Entrepreneur', color: '#f97316' },
  developer: { label: 'Developer', color: '#6366f1' },
  industry_leader: { label: 'Industry Leader', color: '#ec4899' },
}

interface CommentThreadProps {
  comment: CommentNodeData
  depth: number
  postId: string
  postAuthorId: string
  navigate: (page: string, params?: any) => void
  onReplyAdded?: (parentId: string) => void
  onCommentDeleted?: (commentId: string, parentId?: string | null) => void
  maxVisualDepth?: number
}

export default function CommentThread({
  comment,
  depth,
  postId,
  postAuthorId,
  navigate,
  onReplyAdded,
  onCommentDeleted,
  maxVisualDepth = 3,
}: CommentThreadProps) {
  const { user, profile } = useSupabaseAuth()
  const [liked, setLiked] = useState(comment.is_liked || false)
  const [likeCount, setLikeCount] = useState(comment.likes_count || 0)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [showReplies, setShowReplies] = useState(comment.showReplies)
  const [replies, setReplies] = useState<CommentNodeData[]>(comment.replies || [])
  const [showActions, setShowActions] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, number>>(comment.reactions || {})
  const [copied, setCopied] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const reactionRef = useRef<HTMLDivElement>(null)

  const visualDepth = Math.min(depth, maxVisualDepth)
  const isNested = depth > 0

  const handleLike = useCallback(async () => {
    if (!user) return
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 500)
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(c => newLiked ? c + 1 : c - 1)
    await likeService.toggleComment(user.id, comment.id, postId)
  }, [user, liked, comment.id, postId])

  const handleReplyAdded = useCallback((parentId: string) => {
    onReplyAdded?.(parentId)
    setShowReplies(true)
  }, [onReplyAdded])

  const handleDelete = useCallback(async () => {
    if (!user || user.id !== comment.author_id) return
    await commentService.delete(comment.id, postId)
    onCommentDeleted?.(comment.id)
  }, [user, comment.id, postId, onCommentDeleted])

  const handleDeleteReply = useCallback((replyId: string) => {
    setReplies(prev => prev.filter(r => r.id !== replyId))
    onCommentDeleted?.(replyId, comment.id)
  }, [comment.id, onCommentDeleted])

  const loadReplies = useCallback(async () => {
    const data = await commentService.getReplies(comment.id)
    if (user) {
      const likedIds = await likeService.getUserLikedComments(user.id, data.map(r => r.id))
      data.forEach(r => { r.is_liked = likedIds.has(r.id) })
    }
    setReplies(data as CommentNodeData[])
    setShowReplies(true)
  }, [comment.id, user])

  const toggleReplies = useCallback(() => {
    if (showReplies) {
      setShowReplies(false)
    } else if (replies.length === 0) {
      loadReplies()
    } else {
      setShowReplies(true)
    }
  }, [showReplies, replies.length, loadReplies])

  const handleReaction = useCallback(async (emoji: string, key: string) => {
    if (!user) return
    setReactions(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }))
    setShowReactionPicker(false)
  }, [user])

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/post/${postId}?comment=${comment.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setShowActions(null)
  }, [comment.id, postId])

  const handleReport = useCallback(() => {
    if (!user) return
    setShowActions(null)
  }, [user])

  const handleCommentSent = useCallback((createdComment: Comment | null) => {
    setShowReplyInput(false)
    if (createdComment) {
      const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'
      const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'user'
      const newReply: CommentNodeData = {
        ...createdComment,
        author: {
          id: user?.id || '',
          display_name: displayName,
          username,
          avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || '',
          banner_url: '',
          bio: '',
          website: '',
          location: '',
          is_verified: false,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        replies: [],
        showReplies: false,
        replyCount: 0,
        is_liked: false,
        likes_count: 0,
        insight_score: 0,
        reactions: {},
      }
      setReplies(prev => [...prev, newReply])
      setShowReplies(true)
      onReplyAdded?.(comment.id)
    }
  }, [user, profile, comment.id, onReplyAdded])

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const avatarSize = isNested ? 28 : 36
  const avatarFontSize = isNested ? 10 : 13
  const nameFontSize = isNested ? 12 : 14
  const bodyFontSize = isNested ? 12 : 14
  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0)
  const hasReactions = totalReactions > 0

  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical connector line */}
      {isNested && (
        <div style={{
          position: 'absolute',
          left: visualDepth * 28 - 10,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'linear-gradient(180deg, rgba(0,210,255,0.15), rgba(0,210,255,0.04))',
        }} />
      )}

      <div style={{
        display: 'flex', gap: 10,
        padding: '12px 0',
        paddingLeft: visualDepth * 28,
        position: 'relative',
      }}>
        {/* Thread dot connector */}
        {isNested && (
          <div style={{
            position: 'absolute',
            left: visualDepth * 28 - 10,
            top: avatarSize / 2 + 12,
            width: 14,
            height: 2,
            background: 'rgba(0,210,255,0.15)',
          }} />
        )}

        {/* Avatar */}
        <div
          onClick={() => navigate('profile', { author: { id: comment.author_id, name: comment.author?.display_name, handle: `@${comment.author?.username}`, avatar: comment.author?.avatar_url, verified: comment.author?.is_verified } })}
          style={{
            width: avatarSize, height: avatarSize, borderRadius: '50%',
            background: comment.author?.avatar_url ? `url(${comment.author.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}60, ${C.purple}60)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: avatarFontSize, fontWeight: 700, color: '#fff',
            flexShrink: 0, cursor: 'pointer', marginTop: 2,
            position: 'relative', zIndex: 2,
            border: comment.is_author_approved ? `2px solid ${C.cyan}` : 'none',
            boxShadow: comment.is_author_approved ? `0 0 8px ${C.cyan}40` : 'none',
          }}
        >
          {!comment.author?.avatar_url && comment.author?.display_name?.[0]?.toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span
              style={{ fontSize: nameFontSize, fontWeight: 700, color: C.text, cursor: 'pointer' }}
              onClick={() => navigate('profile', { author: { id: comment.author_id, name: comment.author?.display_name, handle: `@${comment.author?.username}`, verified: comment.author?.is_verified } })}
            >
              {comment.author?.display_name}
            </span>
            {comment.author?.is_verified && (
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: C.cyan, color: '#fff', fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>
            )}
            <span style={{ fontSize: 11, color: C.muted }}>@{comment.author?.username}</span>
            <span style={{ fontSize: 11, color: C.muted }}>·</span>
            <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(comment.created_at)}</span>

            {/* Author Approved Badge */}
            {comment.is_author_approved && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 3,
                fontSize: 10, color: C.cyan, fontWeight: 700,
                background: `${C.cyan}12`, padding: '2px 8px', borderRadius: 4,
                border: `1px solid ${C.cyan}30`,
              }}>
                <Award size={10} /> Author Approved
              </span>
            )}

            {/* Insight Score */}
            {comment.insight_score && comment.insight_score > 0 && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 2,
                fontSize: 10, color: '#f59e0b', fontWeight: 700,
                background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4,
              }}>
                <Lightbulb size={10} /> {comment.insight_score}
              </span>
            )}
          </div>

          {/* Expertise Badges - unified glassmorphic */}
          {comment.expertise_badges && comment.expertise_badges.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
              {comment.expertise_badges.map(badge => {
                const config = EXPERTISE_BADGES[badge]
                if (!config) return null
                return (
                  <span key={badge} style={{
                    fontSize: 9, fontWeight: 600, padding: '2px 8px',
                    borderRadius: 99, color: config.color,
                    background: `${config.color}12`,
                    border: `1px solid ${config.color}20`,
                    letterSpacing: '0.2px',
                  }}>
                    {config.label}
                  </span>
                )
              })}
            </div>
          )}

          {/* Body */}
          <p style={{ margin: 0, fontSize: bodyFontSize, color: '#d1d5db', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {comment.body}
          </p>

          {/* Reactions Row - pill-shaped badges */}
          {hasReactions && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {Object.entries(reactions).filter(([, count]) => count > 0).map(([key, count]) => {
                const reaction = REACTION_TYPES.find(r => r.key === key)
                if (!reaction) return null
                return (
                  <span key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`,
                    borderRadius: 99, padding: '2px 8px', fontSize: 11,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {reaction.emoji} {count}
                  </span>
                )
              })}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 8, flexWrap: 'wrap' }}>
            {/* Like */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleLike}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                color: liked ? '#f87171' : C.muted, fontSize: 11, cursor: 'pointer',
                padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { if (!liked) e.currentTarget.style.background = 'rgba(248,113,113,0.06)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <motion.div
                animate={likeAnimating ? { scale: [1, 1.5, 0.9, 1.1, 1], rotate: [0, -12, 12, -4, 0] } : {}}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Heart size={13} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 2} />
              </motion.div>
              {likeCount > 0 && <span>{likeCount}</span>}
            </motion.button>

            {/* Reaction Picker - popover trigger */}
            <div ref={reactionRef} style={{ position: 'relative' }}>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                  color: showReactionPicker ? C.cyan : C.muted, fontSize: 11, cursor: 'pointer',
                  padding: '3px 6px', borderRadius: 6, fontWeight: 600,
                  transition: 'color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,210,255,0.06)'}
                onMouseLeave={e => { if (!showReactionPicker) e.currentTarget.style.background = 'none' }}
              >
                <SmilePlus size={13} />
              </motion.button>

              <AnimatePresence>
                {showReactionPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: 'absolute', left: 0, top: '100%', marginTop: 4,
                      background: '#141420', border: `1px solid ${C.cardBdr}`,
                      borderRadius: 10, padding: '6px 8px', zIndex: 50,
                      display: 'flex', gap: 2,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    {REACTION_TYPES.map(r => (
                      <motion.button
                        key={r.key}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReaction(r.emoji, r.key)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 16, padding: '4px 5px', borderRadius: 6,
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        title={r.label}
                      >
                        {r.emoji}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reply */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setShowReplyInput(!showReplyInput)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                color: showReplyInput ? C.cyan : C.muted, fontSize: 11, cursor: 'pointer',
                padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,210,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <MessageCircle size={13} /> Reply
            </motion.button>

            {/* Expand / Collapse */}
            {(replies.length > 0 || comment.replyCount > 0) && (
              <button onClick={toggleReplies} style={{
                display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                color: C.cyan, fontSize: 11, cursor: 'pointer', padding: '3px 8px', borderRadius: 6, fontWeight: 700,
              }}>
                {showReplies ? '▲ Hide' : `▼ ${replies.length || comment.replyCount}`} {(replies.length || comment.replyCount) === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {/* More Actions */}
            <div style={{ position: 'relative' }}>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setShowActions(showActions === comment.id ? null : comment.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                  color: C.muted, fontSize: 11, cursor: 'pointer', padding: '3px 8px', borderRadius: 6,
                }}
              >
                •••
              </motion.button>

              <AnimatePresence>
                {showActions === comment.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: 'absolute', left: 0, top: '100%',
                      background: '#141420', border: `1px solid ${C.cardBdr}`,
                      borderRadius: 10, padding: '4px 0', zIndex: 50, minWidth: 160,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    <DropdownItem icon={<Share2 size={13} />} label="Share" onClick={handleCopyLink} />
                    <DropdownItem icon={<Copy size={13} />} label={copied ? 'Copied!' : 'Copy Link'} onClick={handleCopyLink} />
                    <DropdownItem icon={<Bookmark size={13} />} label="Bookmark" onClick={() => setShowActions(null)} />
                    <DropdownItem icon={<Flag size={13} />} label="Report" onClick={handleReport} color="#f87171" />
                    <DropdownItem icon={<Languages size={13} />} label="Translate" onClick={() => setShowActions(null)} />
                    <DropdownItem icon={<GitFork size={13} />} label="Follow Thread" onClick={() => setShowActions(null)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Delete */}
            {user?.id === comment.author_id && (
              <motion.button whileTap={{ scale: 0.85 }} onClick={handleDelete}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                  color: C.muted, fontSize: 11, cursor: 'pointer', padding: '3px 8px', borderRadius: 6,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = C.muted}
              >
                <Trash2 size={12} />
              </motion.button>
            )}
          </div>

          {/* Inline Reply Composer */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', marginTop: 10 }}
              >
                <RichCommentComposer
                  placeholder={`Reply to @${comment.author?.username}...`}
                  postId={postId}
                  parentId={comment.id}
                  postAuthorId={postAuthorId}
                  onCommentSent={handleCommentSent}
                  compact
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nested Replies */}
      <AnimatePresence>
        {showReplies && replies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            {replies.map(reply => (
              <CommentThread
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                postId={postId}
                postAuthorId={postAuthorId}
                navigate={navigate}
                onReplyAdded={onReplyAdded}
                onCommentDeleted={handleDeleteReply}
                maxVisualDepth={maxVisualDepth}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DropdownItem({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 14px', background: 'none', border: 'none',
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
