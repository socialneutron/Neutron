import { motion } from 'framer-motion'
import type { Ebook } from '../../types/database'

interface Props {
  ebook: Ebook
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

export default function MagazineCoverPreview({ ebook }: Props) {
  const isPublished = ebook.id.startsWith('pub-')
  const catColor = CATEGORY_COLORS[ebook.category] || '#6b7280'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        width: 240,
        height: 320,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {ebook.cover_url ? (
        <img
          src={ebook.cover_url}
          alt={`Cover of ${ebook.title}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 48, opacity: 0.2 }}>📰</span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>No preview available</span>
        </div>
      )}

      {/* Category badge overlay */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: `${catColor}dd`,
          padding: '3px 10px',
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 700,
          color: '#fff',
          backdropFilter: 'blur(8px)',
        }}
      >
        {ebook.category}
      </div>

      {/* Bottom gradient + label */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
          padding: '24px 14px 10px',
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(0,0,0,0.5)',
            padding: '3px 8px',
            borderRadius: 4,
            letterSpacing: '0.08em',
          }}
        >
          {isPublished ? 'FIRST PAGE PREVIEW' : 'COVER PREVIEW'}
        </span>
      </div>
    </motion.div>
  )
}
