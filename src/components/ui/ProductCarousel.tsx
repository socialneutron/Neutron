import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

interface ProductCarouselProps {
  images: string[]
  alt?: string
  height?: number
  onImageClick?: (index: number) => void
  style?: React.CSSProperties
}

export default function ProductCarousel({ images, alt = 'Product', height = 180, onImageClick, style }: ProductCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % images.length)
  }, [images.length])

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    if (isHovered && images.length > 1) {
      intervalRef.current = setInterval(next, 2000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isHovered, next, images.length])

  if (!images.length) return null

  return (
    <div
      style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height, background: '#0d1220', ...style }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          alt={alt}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
          onClick={() => onImageClick?.(current)}
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            style={{
              position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: '50%', border: 'none',
              background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', backdropFilter: 'blur(4px)',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: '50%', border: 'none',
              background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', backdropFilter: 'blur(4px)',
            }}
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onImageClick?.(current) }}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 26, height: 26, borderRadius: 6, border: 'none',
              background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', backdropFilter: 'blur(4px)',
            }}
          >
            <Maximize2 size={12} />
          </button>

          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 4,
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
                style={{
                  width: i === current ? 16 : 6, height: 6, borderRadius: 3, border: 'none',
                  background: i === current ? '#fff' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.2s', padding: 0,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
