import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { commentService, notificationService } from '../../services'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA',
  text: '#f1f5f9', muted: '#6b7280',
}

interface RichCommentComposerProps {
  placeholder?: string
  postId: string
  parentId?: string
  postAuthorId: string
  onCommentSent?: (parentId?: string) => void
  compact?: boolean
}

export default function RichCommentComposer({
  placeholder = 'Start the discussion... Share your thoughts and insights on this topic',
  postId,
  parentId,
  postAuthorId,
  onCommentSent,
  compact = false,
}: RichCommentComposerProps) {
  const { user } = useSupabaseAuth()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = useCallback(async () => {
    if (!user || !text.trim() || sending) return
    setSending(true)
    const comment = await commentService.create(user.id, postId, text.trim(), parentId)
    if (comment) {
      setText('')
      onCommentSent?.(parentId)
      if (postAuthorId !== user.id) {
        await notificationService.create(postAuthorId, user.id, 'comment', postId, comment.id)
      }
    }
    setSending(false)
  }, [user, text, sending, postId, parentId, postAuthorId, onCommentSent])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${C.cardBdr}`,
      borderRadius: 12, padding: compact ? '10px' : '12px',
    }}>
      {/* Textarea */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          outline: 'none', color: '#fff', fontSize: compact ? 13 : 14,
          fontFamily: 'inherit', lineHeight: 1.5, resize: 'none',
        }}
      />

      {/* Send row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: compact ? '6px 14px' : '8px 18px',
            borderRadius: 8, border: 'none',
            background: text.trim() ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(255,255,255,0.05)',
            color: '#fff', fontSize: compact ? 12 : 13, fontWeight: 700,
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            opacity: sending ? 0.5 : 1, transition: 'opacity 0.2s',
          }}
        >
          <Send size={compact ? 13 : 14} />
          {sending ? 'Posting...' : 'Comment'}
        </motion.button>
      </div>

      {compact && (
        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
          <span>Ctrl+Enter to send</span>
        </div>
      )}
    </div>
  )
}
