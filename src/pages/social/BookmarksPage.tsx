import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Bookmark as BookmarkIcon } from 'lucide-react'
import { useSupabaseAuth } from '../../context/SupabaseAuthContext'
import { bookmarkService } from '../../services'
import type { Bookmark, PostWithAuthor } from '../../types/database'
import PostCard from '../../components/social/PostCard'

const C = {
  bg: '#05050A', card: '#090914', cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', text: '#f1f5f9', muted: '#6b7280',
}

interface BookmarksPageProps {
  navigate: (page: string, params?: any) => void
}

export default function BookmarksPage({ navigate }: BookmarksPageProps) {
  const { user } = useSupabaseAuth()
  const [bookmarks, setBookmarks] = useState<(Bookmark & { post: PostWithAuthor })[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await bookmarkService.getUserBookmarks(user.id)
      setBookmarks(data as any)
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { load().catch(() => {}) }, [load])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 90 }}>
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.cardBdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('home')} style={{ background: 'rgba(7,17,36,0.7)', border: '1px solid rgba(0,210,255,0.1)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Bookmarks</h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: C.cyan, borderRadius: '50%' }} />
        </div>
      ) : bookmarks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
          <BookmarkIcon size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 14 }}>No bookmarks yet</p>
          <p style={{ margin: '6px 0 0', fontSize: 12 }}>Save posts to read later</p>
        </div>
      ) : (
        <AnimatePresence>
          {bookmarks.map((b, i) => b.post && (
            <PostCard key={b.id} post={b.post} navigate={navigate} delay={i * 0.05} />
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}
