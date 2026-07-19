import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const C = {
  bg: '#0f172a',
  border: 'rgba(255,255,255,0.1)',
}

const HIGHLIGHT_COLORS = [
  { id: 'yellow', color: '#fbbf24', label: 'Yellow' },
  { id: 'green', color: '#22c55e', label: 'Green' },
  { id: 'blue', color: '#3b82f6', label: 'Blue' },
  { id: 'pink', color: '#ec4899', label: 'Pink' },
  { id: 'purple', color: '#a855f7', label: 'Purple' },
]

interface HighlightToolbarProps {
  position: { x: number; y: number }
  onHighlight: (color: string) => void
  onClose: () => void
}

export default function HighlightToolbar({ position, onHighlight, onClose }: HighlightToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        zIndex: 3000,
      }}
    >
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {HIGHLIGHT_COLORS.map(c => (
          <button
            key={c.id}
            onClick={() => onHighlight(c.color)}
            title={c.label}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: '2px solid transparent', background: c.color,
              cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.15)'
              e.currentTarget.style.borderColor = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          />
        ))}
        <div style={{ width: 1, height: 20, background: C.border }} />
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: 'none', background: 'rgba(255,255,255,0.1)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>
      {/* Arrow */}
      <div style={{
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `6px solid ${C.bg}`,
        margin: '0 auto',
        transform: 'translateY(-1px)',
      }} />
    </motion.div>
  )
}