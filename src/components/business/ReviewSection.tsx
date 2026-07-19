import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MessageCircle } from 'lucide-react'
import { useListingReviewStore } from '../../stores/listingReviewStore'
import { timeAgo } from '../../lib/timeAgo'
import ReviewInput from './ReviewInput'

const C = {
  card: '#111827',
  accent: '#00D2FF',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

type ItemType = 'company' | 'product' | 'ebook' | 'talent'

interface Props {
  itemType: ItemType
  itemId: string
  user: any
}

export default function ReviewSection({ itemType, itemId, user }: Props) {
  const { getReviews, getAverage, getDistribution, loadReviews } = useListingReviewStore()
  const reviews = getReviews(itemType, itemId)
  const { average, count } = getAverage(itemType, itemId)
  const distribution = getDistribution(itemType, itemId)

  useEffect(() => {
    loadReviews(itemType, itemId)
  }, [itemType, itemId])

  return (
    <div style={{ marginTop: 8 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <MessageCircle size={18} color={C.text} />
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>
          Reviews & Ratings
        </h3>
        <span
          style={{
            fontSize: 12,
            color: C.accent,
            background: 'rgba(0,210,255,0.08)',
            padding: '2px 8px',
            borderRadius: 6,
            fontWeight: 700,
          }}
        >
          {count}
        </span>
      </div>

      {/* Average rating card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px',
          background: C.card,
          borderRadius: 14,
          border: `1px solid ${C.border}`,
          marginBottom: 20,
        }}
      >
        <div style={{ textAlign: 'center', minWidth: 60 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
            {count > 0 ? average.toFixed(1) : '-'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                size={12}
                fill={s <= Math.round(average) ? '#f59e0b' : 'none'}
                stroke={s <= Math.round(average) ? '#f59e0b' : '#6b7280'}
              />
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            {count} {count === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {/* Rating distribution bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[5, 4, 3, 2, 1].map(star => {
            const numForStar = distribution[star] || 0
            const pct = count > 0 ? (numForStar / count) * 100 : 0
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: C.muted, width: 10, textAlign: 'right' }}>
                  {star}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: '#1f2937',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: '#f59e0b',
                      borderRadius: 3,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: C.muted, width: 20 }}>
                  {numForStar}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Review input */}
      {user && <ReviewInput itemType={itemType} itemId={itemId} user={user} />}

      {/* Review list */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="popLayout">
          {reviews.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: C.muted,
                background: C.card,
                borderRadius: 14,
                border: `1px solid ${C.border}`,
              }}
            >
              <MessageCircle size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: C.text }}>
                No reviews yet
              </p>
              <p style={{ margin: 0, fontSize: 13 }}>
                {user ? 'Be the first to leave a review!' : 'Log in to leave a review.'}
              </p>
            </div>
          ) : (
            reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                style={{
                  padding: '16px',
                  background: C.card,
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: review.user_avatar
                        ? `url(${review.user_avatar}) center/cover`
                        : 'linear-gradient(135deg, #00D2FF, #7928CA)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {!review.user_avatar && (review.user_name[0]?.toUpperCase() || '?')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                        {review.user_name}
                      </span>
                      <span style={{ fontSize: 11, color: C.muted }}>
                        {timeAgo(review.created_at)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 1, margin: '4px 0 6px' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={11}
                          fill={s <= review.rating ? '#f59e0b' : 'none'}
                          stroke={s <= review.rating ? '#f59e0b' : '#6b7280'}
                        />
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#c9cdd4', lineHeight: 1.6 }}>
                      {review.comment}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
