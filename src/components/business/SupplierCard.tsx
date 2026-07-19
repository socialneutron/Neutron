import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, MapPin, Mail, Phone, Globe, MessageSquare, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import ProductCarousel from '../ui/ProductCarousel'
import Lightbox from '../ui/Lightbox'
import SavedIcon from './SavedIcon'
import ListingActions from './ListingActions'
import type { Company } from '../../types/database'

const CAT_COLORS: Record<string, string> = {
  'Raw Materials': '#2563eb',
  'Logistics & Storage': '#7c3aed',
  'Manufacturing': '#059669',
  'Services': '#d97706',
  'Technology': '#06b6d4',
}

interface SupplierCardProps {
  company: Company
  onMessage: (company: Company) => void
  navigate?: (page: string, params?: any) => void
  isSaved?: boolean
  onSave?: () => void
  onClick?: (company: Company) => void
  userId?: string
  isOwn?: boolean
}

export default function SupplierCard({ company, onMessage, navigate, isSaved = false, onSave, onClick, userId, isOwn }: SupplierCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const color = CAT_COLORS[company.category] || '#2563eb'

  return (
    <>
      <motion.div
        whileHover={{ y: -3, borderColor: `${color}40` }}
        onClick={() => onClick ? onClick(company) : navigate?.('supplierDetail', { company })}
        style={{
          background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transition: 'border-color 0.2s',
        }}
      >
        {/* Image Carousel */}
        {(company.images || []).length > 0 && (
          <ProductCarousel
            images={company.images || []}
            alt={company.name}
            height={180}
            onImageClick={(idx) => setLightboxIndex(idx)}
          />
        )}

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: `${color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color, flexShrink: 0,
            }}            >
              {company.logo || company.name?.[0] || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {company.name}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{company.handle}</div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, color, background: `${color}15`,
              padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
            }}>
              {company.category}
            </span>
          </div>

          {/* Rating + Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontWeight: 600, color: '#fff' }}>{(company.rating || 0).toFixed(1)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9ca3af' }}>
              <MapPin size={11} />
              <span>{company.location || 'N/A'}</span>
            </div>
          </div>

          {/* Description */}
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
            {company.description}
          </p>

          {/* Commodities */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(expanded ? (company.commodities || []) : (company.commodities || []).slice(0, 3)).map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 8, background: '#0d1220',
              }}>
                {c.image && (
                  <img src={c.image} alt={c.item} style={{
                    width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0,
                  }} />
                )}
                <span style={{ flex: 1, fontSize: 12, color: '#9ca3af' }}>{c.item}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{c.price}</span>
              </div>
            ))}
          </div>

          {(company.commodities || []).length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '6px', border: 'none', background: 'transparent',
                color: '#6b7280', fontSize: 11, cursor: 'pointer',
              }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Show less' : `+${(company.commodities || []).length - 3} more`}
            </button>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => onMessage(company)}
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
              <MessageSquare size={14} /> Message
            </button>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
                  background: 'transparent', color: '#9ca3af', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={13} /> Site
              </a>
            )}
          </div>

          {/* Contact Row */}
          <div style={{
            display: 'flex', gap: 12, paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <a href={`mailto:${company.email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 11, textDecoration: 'none' }}>
              <Mail size={11} /> Email
            </a>
            <a href={`tel:${company.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 11, textDecoration: 'none' }}>
              <Phone size={11} /> Call
            </a>
          </div>

          {!isOwn && userId && (
            <ListingActions listingId={company.id} listingType="company" userId={userId} />
          )}
        </div>
      </motion.div>

      {lightboxIndex !== null && (
        <Lightbox
          images={company.images || []}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
