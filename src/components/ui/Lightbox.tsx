import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxProps {
  images: string[]
  initialIndex?: number
  onClose: () => void
}

export default function Lightbox({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex)

  const next = () => setCurrent(c => (c + 1) % images.length)
  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
          }}
        >
          <X size={20} />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        <motion.img
          key={current}
          src={images[current]}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }}
        />

        {images.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 6, alignItems: 'center',
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
                style={{
                  width: i === current ? 24 : 8, height: 8, borderRadius: 4, border: 'none',
                  background: i === current ? '#fff' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', transition: 'all 0.2s', padding: 0,
                }}
              />
            ))}
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 8 }}>
              {current + 1} / {images.length}
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
