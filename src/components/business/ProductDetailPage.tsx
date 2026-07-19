import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, MapPin, MessageSquare, Tag, Package } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import ReviewSection from './ReviewSection'
import ProductCarousel from '../ui/ProductCarousel'
import type { Product } from '../../types/database'

const C = {
  bg: '#05050A',
  card: '#111827',
  accent: '#2563eb',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

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

interface Props {
  product: Product | undefined
  navigate: (page: string, params?: any) => void
  user: any
}

export default function ProductDetailPage({ product, navigate, user }: Props) {
  const [seller, setSeller] = useState<any>(null)
  const { getOrCreateConversation } = useChatStore()

  useEffect(() => {
    if (product?.seller_id) {
      import('../../lib/supabase').then(({ supabase }) =>
        supabase.from('users').select('*').eq('id', product.seller_id).single()
      ).then(({ data }) => setSeller(data))
    }
  }, [product?.seller_id])

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Product not found</p>
        <button onClick={() => navigate('business')} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.accent}`, background: 'rgba(37,99,235,0.12)', color: C.accent, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Back to Business
        </button>
      </div>
    )
  }

  const catColor = CATEGORY_COLORS[product.category] || '#6b7280'
  const condColor = CONDITION_COLORS[product.condition] || CONDITION_COLORS.new
  const isOwn = user?.id === product.seller_id

  const handleMessage = () => {
    getOrCreateConversation({
      id: product.seller_id,
      username: product.seller_name.toLowerCase().replace(/\s+/g, '_'),
      displayName: product.seller_name,
      avatar: product.seller_avatar,
      online: true,
      isVerified: false,
    })
    navigate('chat', { chat: { username: product.seller_name.toLowerCase().replace(/\s+/g, '_'), id: product.seller_id, avatar: product.seller_avatar, displayName: product.seller_name } })
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      {/* Sticky top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,10,0.9)', backdropFilter: 'blur(12px)', padding: '10px 18px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('business')} style={{ background: 'rgba(7,17,36,0.7)', border: `1px solid rgba(37,99,235,0.1)`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
            <ArrowLeft size={18} />
          </motion.button>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '1px', fontFamily: 'Michroma, sans-serif', flex: 1 }}>Product</span>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 18px' }}>
        {/* Image carousel */}
        {product.images?.length > 0 && (
          <div style={{ padding: '20px 0 16px' }}>
            <ProductCarousel images={product.images} />
          </div>
        )}

        {/* Info */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: catColor, background: `${catColor}15`, padding: '3px 10px', borderRadius: 6 }}>{product.category}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: condColor.text, background: condColor.bg, padding: '3px 10px', borderRadius: 6, textTransform: 'capitalize' }}>{product.condition}</span>
          </div>

          <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: C.green }}>${product.price.toFixed(2)}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.muted }}>
              <Package size={13} /> {product.stock} in stock
            </div>
            {product.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.muted }}>
                <MapPin size={13} /> {product.location}
              </div>
            )}
          </div>
        </div>

        {/* Published by / Seller */}
        {seller && (
          <div onClick={() => navigate('profile', { author: { id: seller.id, name: seller.display_name, handle: seller.username, avatar: seller.avatar_url, verified: seller.is_verified } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: seller.avatar_url ? `url(${seller.avatar_url}) center/cover` : 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {!seller.avatar_url && (seller.display_name?.[0]?.toUpperCase() || '?')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{seller.display_name}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>@{seller.username}</p>
            </div>
            <span style={{ fontSize: 11, color: C.muted }}>Seller</span>
          </div>
        )}

        {/* Description */}
        <div style={{ padding: '16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: C.text }}>Description</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#c9cdd4', lineHeight: 1.7 }}>{product.description}</p>
        </div>

        {/* Reviews */}
        <ReviewSection itemType="product" itemId={product.id} user={user} />
      </div>

      {/* Sticky bottom CTA */}
      {!isOwn && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(5,5,10,0.95)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${C.border}`, padding: '12px 18px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleMessage} style={{ width: '100%', padding: '12px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MessageSquare size={16} /> Message Seller
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}
