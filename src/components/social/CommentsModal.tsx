import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Heart, Trash2, MessageCircle } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { commentService, likeService, notificationService } from '../../services'
import type { CommentWithAuthor } from '../../types/database'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', green: '#34D399', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280', border: 'rgba(255,255,255,0.06)',
}

interface CommentsModalProps {
  postId: string
  authorId: string
  onClose: () => void
  navigate: (page: string, params?: any) => void
  onCommentAdded?: () => void
}

interface CommentNode extends CommentWithAuthor {
  replies: CommentNode[]
  showReplies: boolean
  replyCount: number
}

export default function CommentsModal({ postId, authorId, onClose, navigate, onCommentAdded }: CommentsModalProps) {
  const { user, profile } = useSupabaseAuth()
  const [comments, setComments] = useState<CommentNode[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set())
  const replyInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (replyTo && replyInputRef.current) {
      replyInputRef.current.focus()
    }
  }, [replyTo])

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await commentService.getByPost(postId)
      const nodes: CommentNode[] = data.map(c => ({
        ...c,
        replies: [],
        showReplies: false,
        replyCount: 0,
      }))
      if (user) {
        const likedIds = await likeService.getUserLikedComments(user.id, data.map(c => c.id))
        nodes.forEach(c => { c.is_liked = likedIds.has(c.id) })
      }
      setComments(nodes)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
    setLoading(false)
  }, [postId, user])

  useEffect(() => { loadComments().catch(() => {}) }, [loadComments])

  const loadReplies = useCallback(async (commentId: string) => {
    try {
      const replies = await commentService.getReplies(commentId)
      if (user) {
        const likedIds = await likeService.getUserLikedComments(user.id, replies.map(r => r.id))
        replies.forEach(r => { r.is_liked = likedIds.has(r.id) })
      }
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies: replies as CommentNode[], showReplies: true, replyCount: replies.length } : c
      ))
    } catch (err) {
      console.error('Failed to load replies:', err)
    }
  }, [user])

  const toggleReplies = useCallback(async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return
    if (comment.showReplies) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, showReplies: false } : c))
    } else {
      await loadReplies(commentId)
    }
  }, [comments, loadReplies])

  const handleSendTopLevel = useCallback(async () => {
    if (!user || !newComment.trim() || sending) return
    setSending(true)
    const comment = await commentService.create(user.id, postId, newComment.trim())
    if (comment) {
      setNewComment('')
      const node: CommentNode = {
        ...(comment as any),
        author: {
          id: user.id,
          display_name: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
        } as any,
        replies: [],
        showReplies: false,
        replyCount: 0,
        is_liked: false,
        likes_count: 0,
      }
      setNewCommentIds(prev => new Set(prev).add(comment.id))
      setComments(prev => [...prev, node])
      onCommentAdded?.()
      if (authorId !== user.id) {
        await notificationService.create(authorId, user.id, 'comment', postId, comment.id)
      }
    }
    setSending(false)
  }, [user, profile, newComment, postId, authorId, sending, onCommentAdded])

  const handleSendReply = useCallback(async (parentId: string) => {
    if (!user || !replyText.trim() || sendingReply) return
    setSendingReply(true)
    const reply = await commentService.create(user.id, postId, replyText.trim(), parentId)
    if (reply) {
      setReplyText('')
      setReplyTo(null)
      const node: CommentNode = {
        ...(reply as any),
        author: {
          id: user.id,
          display_name: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
        } as any,
        replies: [],
        showReplies: false,
        replyCount: 0,
        is_liked: false,
        likes_count: 0,
      }
      setNewCommentIds(prev => new Set(prev).add(reply.id))
      setComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: [...c.replies, node], showReplies: true, replyCount: c.replyCount + 1 }
          : c
      ))
      if (authorId !== user.id) {
        await notificationService.create(authorId, user.id, 'comment', postId, reply.id)
      }
    }
    setSendingReply(false)
  }, [user, profile, replyText, postId, authorId, sendingReply])

  const handleDelete = useCallback(async (commentId: string, parentId?: string | null) => {
    if (!user) return
    await commentService.delete(commentId, postId)
    if (parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== commentId), replyCount: c.replyCount - 1 } : c
      ))
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }, [user, postId])

  const handleLikeComment = useCallback(async (commentId: string, parentId?: string | null) => {
    if (!user) return
    const nowLiked = await likeService.toggleComment(user.id, commentId, postId)
    if (parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId ? {
          ...c,
          replies: c.replies.map(r => r.id === commentId ? { ...r, is_liked: nowLiked, likes_count: nowLiked ? r.likes_count + 1 : r.likes_count - 1 } : r)
        } : c
      ))
    } else {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, is_liked: nowLiked, likes_count: nowLiked ? c.likes_count + 1 : c.likes_count - 1 } : c))
    }
  }, [user, postId])

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const isNew = (id: string) => newCommentIds.has(id)

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={onClose}
      >
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 520, maxHeight: '80vh', background: C.card, border: `1px solid ${C.cardBdr}`, borderRadius: '18px 18px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {/* Header */}
          <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Comments</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBdr}`, borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ width: 24, height: 24, border: `2px solid ${C.cardBdr}`, borderTopColor: C.cyan, borderRadius: '50%' }} />
              </div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 13 }}>
                No comments yet. Be the first to comment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {comments.map(comment => (
                  <CommentNodeComponent
                    key={comment.id}
                    comment={comment}
                    depth={0}
                    user={user}
                    postId={postId}
                    authorId={authorId}
                    navigate={navigate}
                    onClose={onClose}
                    isNew={isNew(comment.id)}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    replyInputRef={replyInputRef}
                    sendingReply={sendingReply}
                    handleSendReply={handleSendReply}
                    handleLikeComment={handleLikeComment}
                    handleDelete={handleDelete}
                    toggleReplies={toggleReplies}
                    timeAgo={timeAgo}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Top-level Input */}
          <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.cardBdr}`, display: 'flex', gap: 8, flexShrink: 0, background: C.card }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {user?.user_metadata?.display_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <input
              value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendTopLevel()}
              placeholder="Write a comment..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = `${C.cyan}40`}
              onBlur={e => e.currentTarget.style.borderColor = C.cardBdr}
            />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSendTopLevel}
              disabled={!newComment.trim() || sending}
              style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: newComment.trim() ? `linear-gradient(135deg, #2563eb, #7c3aed)` : 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: newComment.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, opacity: sending ? 0.5 : 1, transition: 'opacity 0.2s' }}
            >
              <Send size={16} />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Recursive Comment Node ───────────────────────────────────
function CommentNodeComponent({
  comment, depth, user, postId, authorId, navigate, onClose, isNew,
  replyTo, setReplyTo, replyText, setReplyText, replyInputRef, sendingReply,
  handleSendReply, handleLikeComment, handleDelete, toggleReplies, timeAgo,
}: {
  comment: CommentNode
  depth: number
  user: any
  postId: string
  authorId: string
  navigate: (page: string, params?: any) => void
  onClose: () => void
  isNew: boolean
  replyTo: string | null
  setReplyTo: (id: string | null) => void
  replyText: string
  setReplyText: (text: string) => void
  replyInputRef: React.RefObject<HTMLInputElement>
  sendingReply: boolean
  handleSendReply: (parentId: string) => void
  handleLikeComment: (id: string, parentId?: string | null) => void
  handleDelete: (id: string, parentId?: string | null) => void
  toggleReplies: (id: string) => void
  timeAgo: (date: string) => string
}) {
  const maxDepth = 3
  const indent = Math.min(depth, maxDepth)

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        paddingLeft: indent * 24,
        borderLeft: depth > 0 ? `2px solid rgba(255,255,255,0.06)` : 'none',
        marginLeft: depth > 0 ? 12 : 0,
      }}
    >
      <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
        {/* Avatar */}
        <div
          onClick={() => { onClose(); navigate('profile', { author: { name: comment.author?.display_name, handle: `@${comment.author?.username}`, avatar: comment.author?.avatar_url } }) }}
          style={{
            width: depth > 0 ? 28 : 34, height: depth > 0 ? 28 : 34, borderRadius: '50%',
            background: comment.author?.avatar_url ? `url(${comment.author.avatar_url}) center/cover` : `linear-gradient(135deg, ${C.cyan}60, ${C.purple}60)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: depth > 0 ? 10 : 12, fontWeight: 700, color: '#fff',
            flexShrink: 0, cursor: 'pointer', marginTop: 2,
          }}
        >
          {!comment.author?.avatar_url && comment.author?.display_name?.[0]?.toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span
              style={{ fontSize: depth > 0 ? 12 : 13, fontWeight: 700, color: C.text, cursor: 'pointer' }}
              onClick={() => { onClose(); navigate('profile', { author: { name: comment.author?.display_name, handle: `@${comment.author?.username}` } }) }}
            >
              {comment.author?.display_name}
            </span>
            <span style={{ fontSize: 11, color: C.muted }}>@{comment.author?.username}</span>
            <span style={{ fontSize: 11, color: C.muted }}>·</span>
            <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(comment.created_at)}</span>
          </div>

          {/* Body */}
          <p style={{ margin: 0, fontSize: depth > 0 ? 12 : 13, color: '#d1d5db', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{comment.body}</p>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <button onClick={() => handleLikeComment(comment.id, depth > 0 ? comment.id : undefined)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: comment.is_liked ? '#f87171' : C.muted, fontSize: 11, cursor: 'pointer', padding: '2px 6px', borderRadius: 6, transition: 'color 0.2s, background 0.2s' }}
              onMouseEnter={e => { if (!comment.is_liked) e.currentTarget.style.background = 'rgba(248,113,113,0.06)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Heart size={12} fill={comment.is_liked ? 'currentColor' : 'none'} /> {comment.likes_count > 0 ? comment.likes_count : ''}
            </button>

            <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: replyTo === comment.id ? C.cyan : C.muted, fontSize: 11, cursor: 'pointer', padding: '2px 6px', borderRadius: 6, transition: 'color 0.2s, background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,210,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <MessageCircle size={12} /> Reply
            </button>

            {comment.replyCount > 0 || (comment.replies.length > 0 && depth === 0) ? (
              <button onClick={() => toggleReplies(comment.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: C.cyan, fontSize: 11, cursor: 'pointer', padding: '2px 6px', borderRadius: 6, fontWeight: 600 }}
              >
                {comment.showReplies ? '▲ Hide' : `▼ ${comment.replyCount || comment.replies.length}`} {comment.replyCount === 1 ? 'reply' : 'replies'}
              </button>
            ) : depth === 0 ? (
              <button onClick={() => toggleReplies(comment.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}
              >
                <MessageCircle size={12} /> Reply
              </button>
            ) : null}

            {user?.id === comment.author_id && (
              <button onClick={() => handleDelete(comment.id, depth > 0 ? comment.id : undefined)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', padding: '2px 6px', borderRadius: 6, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = C.muted}
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>

          {/* Inline Reply Box */}
          <AnimatePresence>
            {replyTo === comment.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', marginTop: 8 }}
              >
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {user?.user_metadata?.display_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <input
                    ref={replyInputRef}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendReply(comment.id)}
                    placeholder={`Reply to @${comment.author?.username}...`}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = `${C.cyan}40`}
                    onBlur={e => e.currentTarget.style.borderColor = C.cardBdr}
                  />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSendReply(comment.id)}
                    disabled={!replyText.trim() || sendingReply}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: replyText.trim() ? `linear-gradient(135deg, #2563eb, #7c3aed)` : 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: replyText.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, opacity: sendingReply ? 0.5 : 1 }}
                  >
                    <Send size={13} />
                  </motion.button>
                  <button onClick={() => { setReplyTo(null); setReplyText('') }}
                    style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4, fontSize: 11 }}
                  >Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nested Replies */}
      <AnimatePresence>
        {comment.showReplies && comment.replies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            {comment.replies.map(reply => (
              <CommentNodeComponent
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                user={user}
                postId={postId}
                authorId={authorId}
                navigate={navigate}
                onClose={onClose}
                isNew={false}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                replyText={replyText}
                setReplyText={setReplyText}
                replyInputRef={replyInputRef}
                sendingReply={sendingReply}
                handleSendReply={handleSendReply}
                handleLikeComment={(id) => handleLikeComment(id, comment.id)}
                handleDelete={(id) => handleDelete(id, comment.id)}
                toggleReplies={toggleReplies}
                timeAgo={timeAgo}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
