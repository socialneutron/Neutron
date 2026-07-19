import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Upload, Search, Library } from 'lucide-react'
import BookCard from './BookCard'
import CurrentlyReading from './CurrentlyReading'
import UploadPdfModal from './UploadPdfModal'
import { useEbookStore } from '../../stores/ebookStore'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { useBookReaderStore } from '../../stores/bookReaderStore'
import type { UserEbook } from '../../types/database'

const C = {
  bg: '#020617',
  card: '#0f172a',
  accent: '#00D2FF',
  accentHov: '#00b8d9',
  green: '#22c55e',
  purple: '#7c3aed',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

interface MyBooksViewProps {
  onOpenReader?: (ebook: UserEbook) => void
}

export default function MyBooksView({ onOpenReader }: MyBooksViewProps) {
  const { user } = useSupabaseAuth()
  const { userEbooks, fetchUserEbooks } = useEbookStore()
  const { setCurrentBookId, setTotalPages } = useBookReaderStore()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchUserEbooks(user.id)
    }
  }, [user?.id])

  const currentlyReading = userEbooks
    .filter(ue => ue.progress > 0 && ue.progress < 100)
    .sort((a, b) => new Date(b.last_read_at).getTime() - new Date(a.last_read_at).getTime())

  const filteredBooks = userEbooks.filter(ue => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const title = ue.ebook?.title || ''
    const author = ue.ebook?.author || ''
    return title.toLowerCase().includes(query) || author.toLowerCase().includes(query)
  })

  const handleReadBook = (userEbook: UserEbook) => {
    setCurrentBookId(userEbook.ebook_id)
    // TODO: Open book reader
    console.log('Opening book:', userEbook.ebook?.title)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>My Library</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
            {userEbooks.length} {userEbooks.length === 1 ? 'book' : 'books'} · {currentlyReading.length} currently reading
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
            borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #00D2FF, #7928CA)',
            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            transition: 'opacity 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Upload size={14} /> Upload PDF
        </button>
      </div>

      {/* Currently Reading */}
      {currentlyReading.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
            Currently Reading
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentlyReading.map(userEbook => (
              <CurrentlyReading
                key={userEbook.id}
                userEbook={userEbook}
                onContinue={() => handleReadBook(userEbook)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {userEbooks.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={16} color={C.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search your books..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px 11px 38px', borderRadius: 10,
              border: `1px solid ${C.border}`, background: '#0d1220',
              color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
      )}

      {/* All Books */}
      <div>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
          All Books
        </h3>
        {filteredBooks.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {filteredBooks.map(userEbook => (
              <BookCard
                key={userEbook.id}
                userEbook={userEbook}
                onRead={() => handleReadBook(userEbook)}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: C.muted }}>
            <Library size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Your library is empty</p>
            <p style={{ fontSize: 13, marginBottom: 20 }}>Upload a PDF or get free books from the E-Book Store</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowUploadModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                  borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #00D2FF, #7928CA)',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Upload size={16} /> Upload PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadPdfModal onClose={() => setShowUploadModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}