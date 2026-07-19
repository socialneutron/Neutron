import { motion } from 'framer-motion'
import { Bookmark } from 'lucide-react'

interface SavedIconProps {
  isSaved: boolean
  onToggle: () => void
  size?: number
  style?: React.CSSProperties
}

export default function SavedIcon({ isSaved, onToggle, size = 16, style }: SavedIconProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.75 }}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: 'none',
        borderRadius: 8,
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'background 0.15s',
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.65)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
      title={isSaved ? 'Remove from saved' : 'Save'}
    >
      <Bookmark
        size={size}
        fill={isSaved ? '#f59e0b' : 'none'}
        stroke={isSaved ? '#f59e0b' : '#fff'}
        strokeWidth={2}
      />
    </motion.button>
  )
}
