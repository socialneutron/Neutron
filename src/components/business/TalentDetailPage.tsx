import { motion } from 'framer-motion'
import { ArrowLeft, Star, MapPin, MessageSquare, Users, FileText, Calendar, Globe } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import ReviewSection from './ReviewSection'

const C = {
  bg: '#05050A',
  card: '#111827',
  accent: '#7c3aed',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

const AVAILABILITY: Record<string, { color: string; label: string }> = {
  available: { color: '#22c55e', label: 'Available' },
  busy: { color: '#f59e0b', label: 'Busy' },
  unavailable: { color: '#ef4444', label: 'Unavailable' },
}

interface TalentUser {
  id: string
  username: string
  display_name: string
  avatar_url: string
  bio: string
  location: string
  interests: string[]
  posts_count: number
  followers_count: number
  following_count: number
  created_at: string
  is_talent?: boolean
  talent_title?: string
  talent_rate?: number
  talent_skills?: string[]
  talent_portfolio?: string
  talent_availability?: string
}

interface Props {
  talentUser: TalentUser | undefined
  navigate: (page: string, params?: any) => void
  user: any
}

export default function TalentDetailPage({ talentUser, navigate, user }: Props) {
  const { getOrCreateConversation } = useChatStore()

  if (!talentUser) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Talent profile not found</p>
        <button onClick={() => navigate('business')} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.accent}`, background: 'rgba(124,58,237,0.12)', color: C.accent, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Back to Business
        </button>
      </div>
    )
  }

  const isOwn = user?.id === talentUser.id
  const avail = AVAILABILITY[talentUser.talent_availability || 'available'] || AVAILABILITY.available

  const handleMessage = () => {
    getOrCreateConversation({
      id: talentUser.id,
      username: talentUser.username,
      displayName: talentUser.display_name,
      avatar: talentUser.avatar_url,
      online: true,
      isVerified: false,
    })
    navigate('chat', { chat: { username: talentUser.username, id: talentUser.id, avatar: talentUser.avatar_url, displayName: talentUser.display_name } })
  }

  const handleViewProfile = () => {
    navigate('profile', { author: { id: talentUser.id, name: talentUser.display_name, handle: talentUser.username, avatar: talentUser.avatar_url, verified: false } })
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      {/* Sticky top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,10,0.9)', backdropFilter: 'blur(12px)', padding: '10px 18px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('business')} style={{ background: 'rgba(7,17,36,0.7)', border: `1px solid rgba(124,58,237,0.1)`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
            <ArrowLeft size={18} />
          </motion.button>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '1px', fontFamily: 'Michroma, sans-serif', flex: 1 }}>Talent</span>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 18px' }}>
        {/* Avatar + Name */}
        <div style={{ padding: '28px 0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: talentUser.avatar_url ? `url(${talentUser.avatar_url}) center/cover` : 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 16, border: '3px solid rgba(124,58,237,0.3)' }}>
            {!talentUser.avatar_url && (talentUser.display_name?.[0]?.toUpperCase() || '?')}
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: C.text }}>{talentUser.display_name}</h1>
          <p style={{ margin: '0 0 8px', fontSize: 14, color: C.muted }}>@{talentUser.username}</p>
          {talentUser.talent_title && (
            <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: C.accent }}>{talentUser.talent_title}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {talentUser.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.muted }}><MapPin size={13} /> {talentUser.location}</span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: avail.color }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: avail.color, display: 'inline-block' }} />
              {avail.label}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { icon: FileText, value: talentUser.posts_count, label: 'Posts' },
            { icon: Users, value: talentUser.followers_count, label: 'Followers' },
            { icon: Users, value: talentUser.following_count, label: 'Following' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 8px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <s.icon size={16} color={C.accent} />
              <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{s.value}</span>
              <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Published by (self) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: talentUser.avatar_url ? `url(${talentUser.avatar_url}) center/cover` : 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {!talentUser.avatar_url && (talentUser.display_name?.[0]?.toUpperCase() || '?')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{talentUser.display_name}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>@{talentUser.username}</p>
          </div>
          {isOwn && <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>You</span>}
        </div>

        {/* Bio */}
        {talentUser.bio && (
          <div style={{ padding: '16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: C.text }}>About</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#c9cdd4', lineHeight: 1.7 }}>{talentUser.bio}</p>
          </div>
        )}

        {/* Skills */}
        {talentUser.talent_skills?.length > 0 && (
          <div style={{ padding: '16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: C.text }}>Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {talentUser.talent_skills.map(skill => (
                <span key={skill} style={{ fontSize: 12, fontWeight: 600, color: C.accent, background: 'rgba(124,58,237,0.1)', padding: '4px 10px', borderRadius: 6 }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Rate + Portfolio */}
        <div style={{ padding: '16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: C.text }}>Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {talentUser.talent_rate && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: C.muted }}>Hourly Rate</span>
                <span style={{ fontWeight: 700, color: C.green }}>${talentUser.talent_rate}/hr</span>
              </div>
            )}
            {talentUser.talent_portfolio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Globe size={13} color={C.muted} />
                <a href={talentUser.talent_portfolio} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: 'none' }}>{talentUser.talent_portfolio}</a>
              </div>
            )}
          </div>
        </div>

        {/* Interests */}
        {talentUser.interests?.length > 0 && (
          <div style={{ padding: '16px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: C.text }}>Interests</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {talentUser.interests.map(interest => (
                <span key={interest} style={{ fontSize: 12, fontWeight: 600, color: C.text, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6 }}>{interest}</span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <ReviewSection itemType="talent" itemId={talentUser.id} user={user} />
      </div>

      {/* Sticky bottom CTA */}
      {!isOwn && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(5,5,10,0.95)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${C.border}`, padding: '12px 18px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', gap: 10, maxWidth: 700, margin: '0 auto' }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleMessage} style={{ flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MessageSquare size={16} /> Message
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleViewProfile} style={{ padding: '12px 20px', borderRadius: 10, border: `1px solid ${C.accent}`, background: 'rgba(124,58,237,0.12)', color: C.accent, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} /> Profile
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}
