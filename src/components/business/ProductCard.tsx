import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, MessageSquare, Tag, Package } from 'lucide-react'
import ProductCarousel from '../ui/ProductCarousel'
import Lightbox from '../ui/Lightbox'
import ListingActions from './ListingActions'
import type { Product } from '../../types/database'

const CONDITION_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  used: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  refurbished: { bg: 'rgba(6,182,212,0.15)', text: '#06b6d4' },
}

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: '#2563eb',
  Furniture: '#7c3aed',
  Tools: '#ea580c',
  Clothing: '#ec4899',
}

interface ProductCardProps {
  product: Product
  onMessage: (product: Product) => void
  navigate?: (page: string, params?: any) => void
  onClick?: (product: Product) => void
  userId?: string
  isOwn?: boolean
}

export default function ProductCard({ product, onMessage, navigate, onClick, userId, isOwn }: ProductCardProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const condition = CONDITION_COLORS[product.condition] || CONDITION_COLORS.used
  const catColor = CATEGORY_COLORS[product.category] || '#6b7280'

  return (
    <>
      <motion.div
        whileHover={{ y: -3, borderColor: `${catColor}40` }}
        onClick={() => onClick ? onClick(product) : navigate?.('productDetail', { product })}
        style={{
          background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transition: 'border-color 0.2s',
        }}
      >
        {/* Image Carousel */}
        {(product.images || []).length > 0 && (
          <ProductCarousel
            images={product.images || []}
            alt={product.name}
            height={200}
            onImageClick={(idx) => setLightboxIndex(idx)}
          />
        )}

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {/* Category + Condition */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: catColor,
              background: `${catColor}15`, padding: '3px 8px', borderRadius: 6,
            }}>
              {product.category}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: condition.text,
              background: condition.bg, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize',
            }}>
              {product.condition}
            </span>
          </div>

          {/* Name */}
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {product.name}
          </h3>

          {/* Description */}
          <p style={{
            margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {product.description}
          </p>

          {/* Price */}
          <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>
            ${(product.price || 0).toLocaleString()}
          </div>

          {/* Stock + Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6b7280' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Package size={11} /> {product.stock} in stock
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11} /> {product.location}
            </span>
          </div>

          {/* Seller */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            borderRadius: 8, background: '#0d1220',
          }}>
            <img
              src={product.seller_avatar}
              alt={product.seller_name}
              style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }}
            />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{product.seller_name}</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => onMessage(product)}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <MessageSquare size={14} /> Message Seller
            </button>
          </div>

          {!isOwn && userId && (
            <ListingActions listingId={product.id} listingType="product" userId={userId} />
          )}
        </div>
      </motion.div>

      {lightboxIndex !== null && (
        <Lightbox
          images={product.images || []}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
