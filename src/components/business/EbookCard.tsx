import { motion } from 'framer-motion'
import { Star, BookOpen, ShoppingCart, Check } from 'lucide-react'
import type { Ebook, UserEbook } from '../../types/database'

interface EbookCardProps {
  ebook: Ebook
  userEbook?: UserEbook
  onPurchase: (ebook: Ebook) => void
  onRead?: (ebook: Ebook) => void
  onDetail?: (ebook: Ebook) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  'Self-Help': '#22c55e',
  'Business': '#2563eb',
  'Productivity': '#7c3aed',
  'Finance': '#f59e0b',
  'Technology': '#06b6d4',
  'Fiction': '#ec4899',
  'News': '#ef4444',
  'Lifestyle': '#f97316',
  'Science': '#10b981',
  'Entertainment': '#e879f9',
  'Scientific Papers': '#6366f1',
}

export default function EbookCard({ ebook, userEbook, onPurchase, onRead, onDetail }: EbookCardProps) {
  const isOwned = !!userEbook
  const progress = userEbook?.progress || 0
  const catColor = CATEGORY_COLORS[ebook.category] || '#6b7280'

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: `${catColor}40` }}
      onClick={() => onDetail?.(ebook)}
      style={{
        background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.2s', cursor: 'pointer',
      }}
    >
      {/* Cover Image */}
      <div style={{ position: 'relative', paddingTop: '140%', background: '#0d1220' }}>
        <img
          src={ebook.cover_url}
          alt={ebook.title}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
        {isOwned && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: '#22c55e', borderRadius: 8, padding: '4px 8px',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Check size={12} color="#fff" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>Owned</span>
          </div>
        )}
        {ebook.price === 0 && !isOwned && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '4px 8px',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>FREE</span>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {/* Category */}
        <span style={{
          fontSize: 10, fontWeight: 700, color: catColor,
          background: `${catColor}15`, padding: '3px 8px', borderRadius: 6,
          alignSelf: 'flex-start',
        }}>
          {ebook.category}
        </span>

        {/* Title */}
        <h3 style={{
          margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {ebook.title}
        </h3>

        {/* Author */}
        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
          by {ebook.author}
        </p>

        {/* Rating + Pages */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6b7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={12} fill="#f59e0b" stroke="#f59e0b" /> {ebook.rating}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <BookOpen size={12} /> {ebook.pages} pages
          </span>
        </div>

        {/* Progress (if owned) */}
        {isOwned && progress > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#6b7280' }}>Progress</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e' }}>{progress}%</span>
            </div>
            <div style={{ height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                borderRadius: 2,
              }} />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          {isOwned ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRead?.(ebook) }}
              style={{
                width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <BookOpen size={14} /> {progress > 0 ? 'Continue Reading' : 'Read Now'}
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onPurchase(ebook) }}
              style={{
                width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <ShoppingCart size={14} /> {ebook.price === 0 ? 'Get Free Magazine' : `$${ebook.price}`}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}