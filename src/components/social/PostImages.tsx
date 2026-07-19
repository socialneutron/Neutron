import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const SCROLLBAR_HIDE_STYLE = 'div.post-images-carousel::-webkit-scrollbar { display: none; }'

export function resolvePostImages(post: any): string[] {
  const arr = post?.images
  if (Array.isArray(arr) && arr.length > 0) return arr.filter(Boolean)
  if (post?.image_url) return [post.image_url]
  return []
}

interface PostImagesProps {
  images: string[]
  maxHeight?: number
  borderRadius?: number
  lightboxZIndex?: number
  showBorder?: boolean
}

export default function PostImages({
  images,
  maxHeight = 340,
  borderRadius = 12,
  lightboxZIndex = 9999,
  showBorder = false,
}: PostImagesProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollTo = useCallback((idx: number) => {
    const el = scrollRef.current
    if (!el) return
    const child = el.children[idx] as HTMLElement
    if (child) {
      el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
      setActiveIdx(idx)
    }
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIdx(idx)
  }, [])

  const openLightbox = useCallback((idx: number) => {
    setLightboxIdx(idx)
    setShowLightbox(true)
  }, [])

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!showLightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setLightboxIdx(i => (i - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') setLightboxIdx(i => (i + 1) % images.length)
      if (e.key === 'Escape') setShowLightbox(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showLightbox, images.length])

  if (!images.length) return null

  const single = images.length === 1

  return (
    <>
      {/* Inline Carousel */}
      <div
        style={{
          position: 'relative',
          borderRadius,
          overflow: 'hidden',
          marginBottom: 12,
          border: showBorder ? '1px solid rgba(255,255,255,0.06)' : undefined,
        }}
      >
        <style>{SCROLLBAR_HIDE_STYLE}</style>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="post-images-carousel"
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: single ? 'none' : 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {images.map((src, idx) => (
            <div
              key={idx}
              style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                position: 'relative',
                background: '#000',
                cursor: 'pointer',
              }}
              onClick={() => openLightbox(idx)}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                draggable={false}
                style={{
                  width: '100%',
                  maxHeight,
                  objectFit: 'contain',
                  display: 'block',
                  userSelect: 'none',
                  borderRadius,
                }}
              />
            </div>
          ))}
        </div>

        {/* Desktop arrow buttons */}
        {!single && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); scrollTo((activeIdx - 1 + images.length) % images.length) }}
              className="post-images-arrow post-images-arrow-left"
              style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: activeIdx === 0 ? 0 : 1, pointerEvents: activeIdx === 0 ? 'none' : 'auto',
                transition: 'opacity 0.15s', zIndex: 2,
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); scrollTo((activeIdx + 1) % images.length) }}
              className="post-images-arrow post-images-arrow-right"
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: activeIdx === images.length - 1 ? 0 : 1,
                pointerEvents: activeIdx === images.length - 1 ? 'none' : 'auto',
                transition: 'opacity 0.15s', zIndex: 2,
              }}
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {!single && images.length <= 10 && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 5, zIndex: 2,
          }}>
            {images.map((_, idx) => (
              <div
                key={idx}
                onClick={(e) => { e.stopPropagation(); scrollTo(idx) }}
                style={{
                  width: idx === activeIdx ? 16 : 6, height: 6, borderRadius: 3,
                  background: idx === activeIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Counter badge for >10 images */}
        {!single && images.length > 10 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '3px 8px',
            fontSize: 11, fontWeight: 600, color: '#fff', zIndex: 2,
          }}>
            {activeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Full-screen Lightbox */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="post-images-lightbox"
            style={{
              position: 'fixed', inset: 0, zIndex: lightboxZIndex,
              background: 'rgba(0,0,0,0.95)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              touchAction: 'none',
            }}
            onClick={() => setShowLightbox(false)}
          >
            {/* Header: counter + close */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', zIndex: 10,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                {images.length > 1 ? `${lightboxIdx + 1} / ${images.length}` : ''}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowLightbox(false) }}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Arrow nav */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + images.length) % images.length) }}
                  style={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10, transition: 'background 0.15s',
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % images.length) }}
                  style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10, transition: 'background 0.15s',
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Image carousel — scroll-snap */}
            <div
              onScroll={(e) => {
                const el = e.currentTarget
                const idx = Math.round(el.scrollLeft / el.clientWidth)
                setLightboxIdx(idx)
              }}
              className="post-images-carousel"
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: images.length > 1 ? 'x mandatory' : 'none',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                width: '100%',
                height: '100%',
              }}
            >
              {images.map((src, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: '0 0 100%',
                    scrollSnapAlign: 'start',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '60px 20px 80px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    style={{
                      maxWidth: '95vw',
                      maxHeight: '85vh',
                      objectFit: 'contain',
                      borderRadius: 8,
                      userSelect: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Dot indicators */}
            {images.length > 1 && images.length <= 15 && (
              <div style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 6, zIndex: 10,
              }}>
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxIdx(idx)
                      const container = (e.currentTarget as HTMLElement)
                        ?.closest('.post-images-lightbox')
                        ?.querySelector('.post-images-carousel') as HTMLElement
                      if (container) {
                        const child = container.children[idx] as HTMLElement
                        if (child) container.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
                      }
                    }}
                    style={{
                      width: idx === lightboxIdx ? 20 : 8, height: 8, borderRadius: 4,
                      background: idx === lightboxIdx ? '#fff' : 'rgba(255,255,255,0.35)',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Counter for >15 images */}
            {images.length > 15 && (
              <div style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '4px 12px',
                fontSize: 12, fontWeight: 600, color: '#fff', zIndex: 10,
              }}>
                {lightboxIdx + 1} / {images.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
