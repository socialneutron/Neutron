import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Send, Bold, Italic, Link, Image, Smile } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { commentService, notificationService } from '../../services'
import type { Comment } from '../../types/database'

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
  onCommentSent?: (comment: Comment | null, parentId?: string) => void
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
  const [focused, setFocused] = useState(false)

  const handleSend = useCallback(async () => {
    if (!user || !text.trim() || sending) return
    setSending(true)
    const comment = await commentService.create(user.id, postId, text.trim(), parentId)
    if (comment) {
      setText('')
      onCommentSent?.(comment, parentId)
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
      border: `1px solid ${focused ? 'rgba(0,210,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12,
      boxShadow: focused ? '0 0 0 1px rgba(0,210,255,0.08), 0 4px 20px rgba(0,0,0,0.2)' : 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      overflow: 'hidden',
    }}>
      {/* Textarea */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          outline: 'none', color: '#fff', fontSize: compact ? 13 : 14,
          fontFamily: 'inherit', lineHeight: 1.5, resize: 'none',
          padding: compact ? '10px 12px 4px' : '14px 16px 6px',
        }}
      />

      {/* Bottom action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: compact ? '6px 10px 8px' : '8px 14px 10px',
        borderTop: text.trim() ? `1px solid rgba(255,255,255,0.04)` : 'none',
      }}>
        {/* Left utility icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToolBtn icon={<Bold size={13} />} label="Bold" />
          <ToolBtn icon={<Italic size={13} />} label="Italic" />
          <ToolBtn icon={<Link size={13} />} label="Link" />
          <ToolBtn icon={<Image size={13} />} label="Image" />
          <ToolBtn icon={<Smile size={13} />} label="Emoji" />
        </div>

        {/* Right side: helper + button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!compact && text.trim() && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', userSelect: 'none' }}>
              Ctrl+Enter
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: compact ? '5px 12px' : '7px 16px',
              borderRadius: 8, border: 'none',
              background: text.trim() ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(255,255,255,0.05)',
              color: '#fff', fontSize: compact ? 11 : 12, fontWeight: 700,
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              opacity: sending ? 0.5 : 1, transition: 'opacity 0.2s',
            }}
          >
            <Send size={compact ? 11 : 13} />
            {sending ? 'Sending...' : 'Comment'}
          </motion.button>
        </div>
      </div>

      {compact && text.trim() && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', padding: '0 12px 6px', textAlign: 'right' }}>
          Ctrl+Enter to send
        </div>
      )}
    </div>
  )
}

function ToolBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={label}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'rgba(255,255,255,0.3)', padding: '4px 5px', borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'none' }}
    >
      {icon}
    </motion.button>
  )
}
