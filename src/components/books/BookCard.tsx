import { motion } from 'framer-motion'
import { BookOpen, Clock } from 'lucide-react'
import type { UserEbook } from '../../types/database'

const C = {
  bg: '#0f172a',
  accent: '#00D2FF',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

interface BookCardProps {
  userEbook: UserEbook
  onRead: () => void
}

export default function BookCard({ userEbook, onRead }: BookCardProps) {
  const { ebook, progress } = userEbook
  const hasStarted = progress > 0
  const isFinished = progress >= 100

  const formatLastRead = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: `${C.accent}40` }}
      onClick={onRead}
      style={{
        background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Cover Image */}
      <div style={{ position: 'relative', paddingTop: '130%', background: '#1e293b' }}>
        {ebook?.cover_url ? (
          <img
            src={ebook.cover_url}
            alt={ebook.title}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          }}>
            <BookOpen size={32} color={C.muted} />
          </div>
        )}

        {/* Progress Badge */}
        {hasStarted && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: isFinished ? C.green : 'rgba(0,0,0,0.7)',
            borderRadius: 6, padding: '3px 6px',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
              {isFinished ? 'Done' : `${progress}%`}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Title */}
        <h4 style={{
          margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {ebook?.title || 'Untitled'}
        </h4>

        {/* Author */}
        <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted }}>
          {ebook?.author || 'Unknown'}
        </p>

        {/* Progress Bar */}
        {hasStarted && (
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 3, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: isFinished ? C.green : `linear-gradient(90deg, ${C.accent}, #7928CA)`,
                borderRadius: 2,
              }} />
            </div>
          </div>
        )}

        {/* Last Read */}
        {hasStarted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Clock size={10} color={C.muted} />
            <span style={{ fontSize: 10, color: C.muted }}>
              {formatLastRead(userEbook.last_read_at)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}