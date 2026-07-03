import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Trash2 } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { likeService, commentService, notificationService } from '../../services'
import type { CommentWithAuthor } from '../../types/database'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280',
}

export interface CommentNodeData extends CommentWithAuthor {
  replies: CommentNodeData[]
  showReplies: boolean
  replyCount: number
}

interface CommentNodeProps {
  comment: CommentNodeData
  depth: number
  postId: string
  postAuthorId: string
  navigate: (page: string, params?: any) => void
  onReplyAdded?: (parentId: string) => void
  onCommentDeleted?: (commentId: string, parentId?: string | null) => void
  maxVisualDepth?: number
}

export default function CommentNode({
  comment,
  depth,
  postId,
  postAuthorId,
  navigate,
  onReplyAdded,
  onCommentDeleted,
  maxVisualDepth = 3,
}: CommentNodeProps) {
  const { user } = useSupabaseAuth()
  const [liked, setLiked] = useState(comment.is_liked || false)
  const [likeCount, setLikeCount] = useState(comment.likes_count)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<CommentNodeData[]>(comment.replies || [])

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

  const handleSendReply = useCallback(async () => {
    if (!user || !replyText.trim() || sending) return
    setSending(true)
    const reply = await commentService.create(user.id, postId, replyText.trim(), comment.id)
    if (reply) {
      const node: CommentNodeData = {
        ...(reply as any),
        author: {
          id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          avatar_url: user.user_metadata?.avatar_url || '',
        } as any,
        replies: [],
        showReplies: false,
        replyCount: 0,
        is_liked: false,
        likes_count: 0,
      }
      setReplies(prev => [...prev, node])
      setShowReplies(true)
      setReplyText('')
      setShowReplyInput(false)
      onReplyAdded?.(comment.id)
      if (postAuthorId !== user.id) {
        await notificationService.create(postAuthorId, user.id, 'comment', postId, reply.id)
      }
    }
    setSending(false)
  }, [user, replyText, sending, comment.id, postId, postAuthorId, onReplyAdded])

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

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const avatarSize = isNested ? 28 : 34
  const avatarFontSize = isNested ? 10 : 12
  const nameFontSize = isNested ? 12 : 13
  const bodyFontSize = isNested ? 12 : 13

  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical connector line from parent */}
      {isNested && (
        <div style={{
          position: 'absolute',
          left: visualDepth * 28 - 14,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'rgba(255,255,255,0.06)',
        }} />
      )}

      <div style={{
        display: 'flex',
        gap: 10,
        padding: '12px 0',
        paddingLeft: visualDepth * 28,
        position: 'relative',
      }}>
        {/* Avatar */}
        <div
          onClick={() => navigate('profile', { author: { name: comment.author?.display_name, handle: `@${comment.author?.username}`, avatar: comment.author?.avatar_url, verified: comment.author?.is_verified } })}
          style={{
            width: avatarSize, height: avatarSize, borderRadius: '50%',
            background: comment.author?.avatar_url ? `url(${comment.author.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}60, ${C.purple}60)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: avatarFontSize, fontWeight: 700, color: '#fff',
            flexShrink: 0, cursor: 'pointer', marginTop: 2,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {!comment.author?.avatar_url && comment.author?.display_name?.[0]?.toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{ fontSize: nameFontSize, fontWeight: 700, color: C.text, cursor: 'pointer' }}
              onClick={() => navigate('profile', { author: { name: comment.author?.display_name, handle: `@${comment.author?.username}` } })}
            >
              {comment.author?.display_name}
            </span>
            {comment.author?.is_verified && (
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: C.cyan, color: '#fff', fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>
            )}
            <span style={{ fontSize: 11, color: C.muted }}>@{comment.author?.username}</span>
            <span style={{ fontSize: 11, color: C.muted }}>·</span>
            <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(comment.created_at)}</span>
          </div>

          {/* Body */}
          <p style={{ margin: 0, fontSize: bodyFontSize, color: '#d1d5db', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {comment.body}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
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

            {replies.length > 0 || comment.replyCount > 0 ? (
              <button
                onClick={toggleReplies}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                  color: C.cyan, fontSize: 11, cursor: 'pointer', padding: '3px 8px', borderRadius: 6, fontWeight: 700,
                }}
              >
                {showReplies ? '▲ Hide' : `▼ ${replies.length || comment.replyCount}`} {(replies.length || comment.replyCount) === 1 ? 'reply' : 'replies'}
              </button>
            ) : null}

            {user?.id === comment.author_id && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleDelete}
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

          {/* Inline Reply Input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', marginTop: 10 }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 6,
                  }}>
                    {user?.user_metadata?.display_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendReply()
                      }}
                      placeholder={`Reply to @${comment.author?.username}...`}
                      rows={2}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${C.cardBdr}`, borderRadius: 10,
                        padding: '10px 12px', fontSize: 13, color: '#fff',
                        outline: 'none', resize: 'none', fontFamily: 'inherit',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = `${C.cyan}40`}
                      onBlur={e => e.currentTarget.style.borderColor = C.cardBdr}
                    />
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setShowReplyInput(false); setReplyText('') }}
                        style={{
                          padding: '6px 12px', borderRadius: 8, border: 'none',
                          background: 'rgba(255,255,255,0.05)', color: C.muted,
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                      >Cancel</button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sending}
                        style={{
                          padding: '6px 14px', borderRadius: 8, border: 'none',
                          background: replyText.trim() ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(255,255,255,0.05)',
                          color: '#fff', fontSize: 12, fontWeight: 600, cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                          opacity: sending ? 0.5 : 1, transition: 'opacity 0.2s',
                        }}
                      >
                        {sending ? 'Sending...' : 'Reply'}
                      </motion.button>
                    </div>
                  </div>
                </div>
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
              <CommentNode
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
