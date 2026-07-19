import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, MapPin, Mail, Phone, Globe, MessageSquare, ExternalLink } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import ReviewSection from './ReviewSection'
import ProductCarousel from '../ui/ProductCarousel'
import type { Company } from '../../types/database'

const C = {
  bg: '#05050A',
  card: '#111827',
  accent: '#2563eb',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

const CAT_COLORS: Record<string, string> = {
  'Raw Materials': '#2563eb',
  'Logistics & Storage': '#7c3aed',
  'Manufacturing': '#059669',
  'Services': '#d97706',
  'Technology': '#06b6d4',
}

interface Props {
  company: Company | undefined
  navigate: (page: string, params?: any) => void
  user: any
}

export default function SupplierDetailPage({ company, navigate, user }: Props) {
  const [publisher, setPublisher] = useState<any>(null)
  const { getOrCreateConversation } = useChatStore()

  useEffect(() => {
    if (company?.registered_by) {
      import('../../lib/supabase').then(({ supabase }) =>
        supabase.from('users').select('*').eq('id', company.registered_by).single()
      ).then(({ data }) => setPublisher(data))
    }
  }, [company?.registered_by])

  if (!company) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Company not found</p>
        <button onClick={() => navigate('business')} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.accent}`, background: 'rgba(37,99,235,0.12)', color: C.accent, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Back to Business
        </button>
      </div>
    )
  }

  const catColor = CAT_COLORS[company.category] || '#6b7280'
  const isOwn = user?.id === company.registered_by

  const handleMessage = () => {
    getOrCreateConversation({
      id: company.id,
      username: company.handle.replace('@', ''),
      displayName: company.name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=2563eb&color=fff&size=150`,
      online: true,
      isVerified: true,
    })
    navigate('chat', { chat: { username: company.handle.replace('@', ''), id: company.id, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=2563eb&color=fff&size=150`, displayName: company.name } })
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      {/* Sticky top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,10,0.9)', backdropFilter: 'blur(12px)', padding: '10px 18px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('business')} style={{ background: 'rgba(7,17,36,0.7)', border: `1px solid rgba(37,99,235,0.1)`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
            <ArrowLeft size={18} />
          </motion.button>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '1px', fontFamily: 'Michroma, sans-serif', flex: 1 }}>Supplier</span>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 18px' }}>
        {/* Image carousel */}
        {company.images?.length > 0 && (
          <div style={{ padding: '20px 0 16px' }}>
            <ProductCarousel images={company.images} />
          </div>
        )}

        {/* Info */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: catColor, background: `${catColor}15`, padding: '3px 10px', borderRadius: 6 }}>{company.category}</span>
            {company.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{company.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>{company.name}</h1>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: C.muted }}>{company.handle}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 13, color: C.muted }}>
            {company.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {company.location}</span>}
          </div>
        </div>

        {/* Published by */}
        {publisher && (
          <div onClick={() => navigate('profile', { author: { id: publisher.id, name: publisher.display_name, handle: publisher.username, avatar: publisher.avatar_url, verified: publisher.is_verified } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: publisher.avatar_url ? `url(${publisher.avatar_url}) center/cover` : 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {!publisher.avatar_url && (publisher.display_name?.[0]?.toUpperCase() || '?')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{publisher.display_name}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>@{publisher.username}</p>
            </div>
            <span style={{ fontSize: 11, color: C.muted }}>Published by</span>
          </div>
        )}

        {/* Description */}
        <div style={{ padding: '16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: C.text }}>About</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#c9cdd4', lineHeight: 1.7 }}>{company.description}</p>
        </div>

        {/* Commodities / Price List */}
        {company.commodities?.length > 0 && (
          <div style={{ padding: '16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: C.text }}>Price List</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {company.commodities.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{c.item}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{c.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div style={{ padding: '16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: C.text }}>Contact</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {company.email && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted }}><Mail size={14} /> {company.email}</div>}
            {company.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted }}><Phone size={14} /> {company.phone}</div>}
            {company.website && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted }}><Globe size={14} /> {company.website}</div>}
          </div>
        </div>

        {/* Reviews */}
        <ReviewSection itemType="company" itemId={company.id} user={user} />
      </div>

      {/* Sticky bottom CTA */}
      {!isOwn && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(5,5,10,0.95)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${C.border}`, padding: '12px 18px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', gap: 10, maxWidth: 700, margin: '0 auto' }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleMessage} style={{ flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MessageSquare size={16} /> Message
            </motion.button>
            {company.website && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.open(company.website, '_blank')} style={{ padding: '12px 20px', borderRadius: 10, border: `1px solid ${C.accent}`, background: 'rgba(37,99,235,0.12)', color: C.accent, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ExternalLink size={16} /> Site
              </motion.button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
