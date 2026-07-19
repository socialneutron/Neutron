import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MessageSquare, Users, FileText, Star, MapPin, Calendar, Plus } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import RegisterTalentModal from './RegisterTalentModal'
import ListingActions from './ListingActions'

export interface TalentUser {
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
  // Talent-specific fields
  is_talent?: boolean
  talent_title?: string
  talent_rate?: number
  talent_skills?: string[]
  talent_portfolio?: string
  talent_availability?: string
}

interface FindTalentProps {
  navigate: (page: string, params?: any) => void
  userId?: string
}

export default function FindTalent({ navigate, userId }: FindTalentProps) {
  const [users, setUsers] = useState<TalentUser[]>([])
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<TalentUser | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const { getOrCreateConversation } = useChatStore()

  useEffect(() => {
    // Load users from mock DB
    const loadUsers = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase.from('users').select('*')
        if (data) {
          // Filter to users with posts (content creators)
          const creators = data.filter((u: any) => (u.posts_count || 0) > 0)
            .map((u: any) => ({
              id: u.id,
              username: u.username || '',
              display_name: u.display_name || '',
              avatar_url: u.avatar_url || '',
              bio: u.bio || '',
              location: u.location || '',
              interests: u.interests || [],
              posts_count: u.posts_count || 0,
              followers_count: u.followers_count || 0,
              following_count: u.following_count || 0,
              created_at: u.created_at || '',
            }))
          setUsers(creators)
        }
      } catch {
        // Fallback empty
      }
    }
    loadUsers()
  }, [])

  const filtered = users.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.display_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q) ||
      u.interests?.some(i => i.toLowerCase().includes(q))
  })

  const handleMessage = (user: TalentUser) => {
    getOrCreateConversation({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatar: user.avatar_url,
      online: true,
      isVerified: false,
    })
    navigate('chat', { chat: { username: user.username, id: user.id, avatar: user.avatar_url, displayName: user.display_name } })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px 11px 38px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.07)', background: '#0d1220',
    color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>Find Talent</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Discover content creators and connect with them directly
          </p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
            borderRadius: 10, border: '1px solid #7c3aed', background: 'rgba(124,58,237,0.12)',
            color: '#7c3aed', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.12)'}
        >
          <Plus size={14} /> Register as Talent
        </button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color="#6b7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search by name, bio, or interest..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 24, padding: '14px 18px',
        borderRadius: 12, background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9ca3af' }}>
          <Users size={14} color="#2563eb" />
          <span><strong style={{ color: '#fff' }}>{filtered.length}</strong> creators found</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(user => (
          <motion.div
            key={user.id}
            whileHover={{ y: -2, borderColor: 'rgba(37,99,235,0.3)' }}
            style={{
              background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
              transition: 'border-color 0.2s', cursor: 'pointer',
            }}
            onClick={() => navigate('talentDetail', { talentUser: user })}
          >
            {/* User Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.display_name}&background=2563eb&color=fff&size=80`}
                alt={user.display_name}
                style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{user.display_name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>@{user.username}</div>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {user.bio}
              </p>
            )}

            {/* Interests */}
            {user.interests.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {user.interests.slice(0, 3).map(interest => (
                  <span key={interest} style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    background: 'rgba(37,99,235,0.1)', color: '#2563eb',
                  }}>
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
              <span><strong style={{ color: '#fff' }}>{user.posts_count}</strong> posts</span>
              <span><strong style={{ color: '#fff' }}>{user.followers_count}</strong> followers</span>
              {user.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={10} /> {user.location}
                </span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleMessage(user) }}
                style={{
                  flex: 1, padding: '9px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <MessageSquare size={13} /> Message
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('profile', { author: { id: user.id, name: user.display_name, handle: user.username, avatar: user.avatar_url } }) }}
                style={{
                  padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)',
                  background: 'transparent', color: '#9ca3af', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                View Profile
              </button>
            </div>
            {userId && userId !== user.id && (
              <ListingActions listingId={user.id} listingType="talent" userId={userId} />
            )}
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px', color: '#6b7280',
        }}>
          <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No creators found</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or register as talent</p>
        </div>
      )}

      {showRegister && (
        <RegisterTalentModal
          onClose={() => setShowRegister(false)}
          onSubmit={(data) => {
            // In a real app, this would save to the DB
            console.log('Talent registered:', data)
            setShowRegister(false)
          }}
        />
      )}
    </div>
  )
}
