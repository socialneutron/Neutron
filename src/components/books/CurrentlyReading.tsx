import { motion } from 'framer-motion'
import { BookOpen, Clock, ArrowRight } from 'lucide-react'
import type { UserEbook } from '../../types/database'

const C = {
  bg: '#0f172a',
  accent: '#00D2FF',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

interface CurrentlyReadingProps {
  userEbook: UserEbook
  onContinue: () => void
}

export default function CurrentlyReading({ userEbook, onContinue }: CurrentlyReadingProps) {
  const { ebook, progress, last_read_at } = userEbook

  const formatLastRead = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      whileHover={{ borderColor: `${C.accent}40` }}
      style={{
        background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: '16px 20px',
        display: 'flex', gap: 16, alignItems: 'center',
        cursor: 'pointer', transition: 'border-color 0.2s',
      }}
      onClick={onContinue}
    >
      {/* Cover */}
      <div style={{
        width: 64, height: 80, borderRadius: 8, overflow: 'hidden',
        flexShrink: 0, background: '#1e293b',
      }}>
        {ebook?.cover_url ? (
          <img
            src={ebook.cover_url}
            alt={ebook.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          }}>
            <BookOpen size={24} color={C.muted} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          margin: 0, fontSize: 15, fontWeight: 700, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {ebook?.title || 'Untitled'}
        </h4>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
          {ebook?.author || 'Unknown'}
        </p>

        {/* Progress */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: C.muted }}>Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>{progress}%</span>
          </div>
          <div style={{ height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${C.accent}, #7928CA)`,
                borderRadius: 2,
              }}
            />
          </div>
        </div>

        {/* Last Read */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <Clock size={10} color={C.muted} />
          <span style={{ fontSize: 10, color: C.muted }}>
            Last read {formatLastRead(last_read_at)}
          </span>
        </div>
      </div>

      {/* Continue Button */}
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `linear-gradient(135deg, ${C.accent}, #7928CA)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <ArrowRight size={18} color="#fff" />
      </div>
    </motion.div>
  )
}