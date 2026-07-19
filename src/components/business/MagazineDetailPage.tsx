import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, BookOpen, Download } from 'lucide-react'
import { useEbookStore } from '../../stores/ebookStore'
import { useListingReviewStore } from '../../stores/listingReviewStore'
import MagazineCoverPreview from './MagazineCoverPreview'
import ReviewSection from './ReviewSection'
import ClaimButton from './ClaimButton'
import type { Ebook } from '../../types/database'

const C = {
  bg: '#05050A',
  card: '#111827',
  accent: '#00D2FF',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

const CATEGORY_COLORS: Record<string, string> = {
  'Self-Help': '#22c55e',
  'Business': '#2563eb',
  'Productivity': '#7c3aed',
  'Finance': '#f59e0b',
  'Technology': '#06b6d4',
  'Fiction': '#ec4899',
  'News': '#ef4444',
  'Lifestyle': '#f97316',
  'Science': '#10b981',
  'Entertainment': '#e879f9',
  'Scientific Papers': '#6366f1',
}

interface Props {
  ebook: Ebook | undefined
  navigate: (page: string, params?: any) => void
  user: any
}

export default function MagazineDetailPage({ ebook, navigate, user }: Props) {
  const { userEbooks, fetchUserEbooks } = useEbookStore()
  const { getAverage, loadReviews } = useListingReviewStore()
  const [publisher, setPublisher] = useState<any>(null)

  const userEbook = useMemo(
    () => userEbooks.find(ue => ue.ebook_id === ebook?.id),
    [userEbooks, ebook?.id]
  )

  const { average, count: reviewCount } = useMemo(
    () => ebook ? getAverage('ebook', ebook.id) : { average: 0, count: 0 },
    [ebook, getAverage]
  )

  useEffect(() => {
    if (ebook?.id) loadReviews('ebook', ebook.id)
  }, [ebook?.id])

  useEffect(() => {
    if (user?.id) fetchUserEbooks(user.id)
  }, [user?.id])

  useEffect(() => {
    if (ebook?.published_by) {
      import('../../lib/supabase').then(({ supabase }) =>
        supabase.from('users').select('*').eq('id', ebook.published_by).single()
      ).then(({ data }) => setPublisher(data))
    }
  }, [ebook?.published_by])

  if (!ebook) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Magazine not found</p>
        <button onClick={() => navigate('business')} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid rgba(0,210,255,0.25)`, background: 'rgba(0,210,255,0.06)', color: C.accent, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Back to Store
        </button>
      </div>
    )
  }

  const catColor = CATEGORY_COLORS[ebook.category] || '#6b7280'
  const isOwn = user?.id === ebook.published_by

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      {/* Sticky top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,10,0.9)', backdropFilter: 'blur(12px)', padding: '10px 18px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('business')} style={{ background: 'rgba(7,17,36,0.7)', border: `1px solid rgba(0,210,255,0.1)`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted, flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </motion.button>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '1px', fontFamily: 'Michroma, sans-serif', flex: 1 }}>Magazine</span>
          {userEbook && (
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: 6 }}>In Library</span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 18px' }}>
        {/* Cover Preview */}
        <div style={{ padding: '24px 0 16px', display: 'flex', justifyContent: 'center' }}>
          <MagazineCoverPreview ebook={ebook} />
        </div>

        {/* Info */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: catColor, background: `${catColor}15`, padding: '3px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 10 }}>{ebook.category}</span>
          <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>{ebook.title}</h1>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: C.muted }}>by {ebook.author}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={14} fill={s <= Math.round(average) ? '#f59e0b' : 'none'} stroke={s <= Math.round(average) ? '#f59e0b' : '#6b7280'} />
              ))}
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginLeft: 4 }}>{average > 0 ? average.toFixed(1) : 'N/A'}</span>
              <span style={{ fontSize: 12, color: C.muted }}>({reviewCount} reviews)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.muted }}>
              <BookOpen size={14} /> {ebook.pages} pages
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.muted }}>
              <Download size={14} /> {(ebook.sales_count || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Published by */}
        {publisher && (
          <div onClick={() => navigate('profile', { author: { id: publisher.id, name: publisher.display_name, handle: publisher.username, avatar: publisher.avatar_url, verified: publisher.is_verified } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: publisher.avatar_url ? `url(${publisher.avatar_url}) center/cover` : 'linear-gradient(135deg, #00D2FF, #7928CA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
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
        <div style={{ padding: '16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: C.text }}>About this magazine</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#c9cdd4', lineHeight: 1.7 }}>{ebook.description}</p>
        </div>

        {/* Reviews */}
        <ReviewSection itemType="ebook" itemId={ebook.id} user={user} />
      </div>

      {/* Sticky claim button */}
      <ClaimButton ebook={ebook} user={user} navigate={navigate} />
    </div>
  )
}
