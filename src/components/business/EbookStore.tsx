import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BookOpen, BookMarked, ShoppingCart, Plus } from 'lucide-react'
import EbookCard from './EbookCard'
import PublishModal from './PublishModal'
import { useEbookStore } from '../../stores/ebookStore'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import type { Ebook } from '../../types/database'

const CATEGORIES = ['All', 'News', 'Business', 'Technology', 'Lifestyle', 'Science', 'Entertainment', 'Scientific Papers']

const C = {
  bg: '#0b0f1a',
  card: '#111827',
  accent: '#2563eb',
  accentHov: '#1d4ed8',
  green: '#22c55e',
  purple: '#7c3aed',
  cyan: '#06b6d4',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

interface EbookStoreProps {
  navigate?: (page: string, params?: any) => void
}

export default function EbookStore({ navigate }: EbookStoreProps) {
  const { user } = useSupabaseAuth()
  const {
    ebooks,
    userEbooks,
    activeCategory,
    searchQuery,
    isLoading,
    setActiveCategory,
    fetchEbooks,
    searchEbooks,
    purchaseEbook,
    fetchUserEbooks,
  } = useEbookStore()

  const [searchInput, setSearchInput] = useState('')
  const [showPublishModal, setShowPublishModal] = useState(false)

  useEffect(() => {
    fetchEbooks()
    if (user?.id) {
      fetchUserEbooks(user.id)
    }
  }, [user?.id])

  const filteredEbooks = useMemo(() => {
    let result = ebooks

    if (activeCategory && activeCategory !== 'All') {
      result = result.filter(e => e.category === activeCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.author.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query)
      )
    }

    return result
  }, [ebooks, activeCategory, searchQuery])

  const handleSearch = () => {
    searchEbooks(searchInput)
  }

  const handlePurchase = async (ebook: Ebook) => {
    if (user?.id) {
      await purchaseEbook(user.id, ebook.id)
    }
  }

  const handleRead = (ebook: Ebook) => {
    navigate?.('magazineDetail', { ebook })
  }

  const handleDetail = (ebook: Ebook) => {
    navigate?.('magazineDetail', { ebook })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px 11px 38px', borderRadius: 10,
    border: `1px solid ${C.border}`, background: '#0d1220',
    color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>Magazine Store</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
            Free magazines to boost your knowledge and skills
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowPublishModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              transition: 'opacity 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Plus size={14} /> Publish
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.1)' }}>
            <BookMarked size={16} color={C.green} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
              {userEbooks.length} {userEbooks.length === 1 ? 'magazine' : 'magazines'} in library
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color={C.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search magazines by title, author, or topic..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
            style={inputStyle}
          />
        </div>
        <button
          onClick={handleSearch}
          style={{
            padding: '11px 20px', borderRadius: 10, border: 'none',
            background: C.accent, color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentHov}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
        >
          <Search size={14} /> Search
        </button>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: 'none',
              background: activeCategory === cat ? C.accent : 'rgba(255,255,255,0.05)',
              color: activeCategory === cat ? '#fff' : C.muted,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>
          {searchQuery.trim() ? `Results for "${searchQuery}"` : activeCategory !== 'All' ? `${activeCategory} Magazines` : 'All Magazines'}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
          {filteredEbooks.length} {filteredEbooks.length === 1 ? 'magazine' : 'magazines'} found
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {filteredEbooks.map(ebook => (
          <EbookCard
            key={ebook.id}
            ebook={ebook}
            userEbook={userEbooks.find(ue => ue.ebook_id === ebook.id)}
            onPurchase={handlePurchase}
            onRead={handleRead}
            onDetail={handleDetail}
          />
        ))}
      </div>

      {filteredEbooks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: C.muted }}>
          <BookOpen size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No magazines found</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or category filter</p>
        </div>
      )}

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <PublishModal onClose={() => setShowPublishModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}