import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Send, AlertCircle } from 'lucide-react'
import { useListingReviewStore } from '../../stores/listingReviewStore'

const C = {
  card: '#111827',
  accent: '#00D2FF',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
  error: '#ef4444',
}

type ItemType = 'company' | 'product' | 'ebook' | 'talent'

interface Props {
  itemType: ItemType
  itemId: string
  user: any
  onSubmitted?: () => void
}

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

export default function ReviewInput({ itemType, itemId, user, onSubmitted }: Props) {
  const { submitReview, hasUserReviewed } = useListingReviewStore()
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const alreadyReviewed = hasUserReviewed(itemType, itemId, user?.id)

  const handleSubmit = () => {
    setError('')
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    if (!comment.trim()) {
      setError('Please write a comment')
      return
    }

    setSubmitting(true)
    setTimeout(() => {
      submitReview(
        itemType,
        itemId,
        user?.id || '',
        user?.user_metadata?.display_name || user?.display_name || user?.email?.split('@')[0] || 'Anonymous',
        user?.user_metadata?.avatar_url || user?.avatar_url || '',
        rating,
        comment.trim(),
      )
      setSubmitting(false)
      setSubmitted(true)
      setRating(0)
      setComment('')
      onSubmitted?.()
    }, 400)
  }

  if (alreadyReviewed || submitted) {
    return (
      <div
        style={{
          padding: '14px 16px',
          background: 'rgba(34,197,94,0.06)',
          borderRadius: 12,
          border: '1px solid rgba(34,197,94,0.2)',
          marginBottom: 20,
          fontSize: 13,
          color: '#22c55e',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Star size={14} fill="#22c55e" stroke="#22c55e" />
        You have already reviewed this. Thank you!
      </div>
    )
  }

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        padding: 16,
        marginBottom: 20,
      }}
    >
      <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.text }}>
        Write a Review
      </p>

      {/* Star picker */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(s => (
          <motion.button
            key={s}
            whileTap={{ scale: 0.85 }}
            onMouseEnter={() => setHoveredStar(s)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(s)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
            }}
          >
            <Star
              size={22}
              fill={(hoveredStar || rating) >= s ? '#f59e0b' : 'none'}
              stroke={(hoveredStar || rating) >= s ? '#f59e0b' : '#6b7280'}
              style={{ transition: 'all 0.15s' }}
            />
          </motion.button>
        ))}
        {(hoveredStar || rating) > 0 && (
          <span style={{ fontSize: 12, color: C.muted, marginLeft: 6 }}>
            {RATING_LABELS[hoveredStar || rating]}
          </span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        placeholder="Share your thoughts..."
        value={comment}
        onChange={e => { setComment(e.target.value); setError('') }}
        rows={3}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 13,
          color: '#fff',
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: C.error }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          marginTop: 12,
          padding: '10px 20px',
          borderRadius: 10,
          border: 'none',
          background: 'linear-gradient(135deg, #00D2FF, #7928CA)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'inherit',
        }}
      >
        <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Review'}
      </motion.button>
    </div>
  )
}
