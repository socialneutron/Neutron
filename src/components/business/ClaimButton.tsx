import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, Loader2, BookOpen, AlertCircle } from 'lucide-react'
import { useEbookStore } from '../../stores/ebookStore'
import type { Ebook } from '../../types/database'

const C = {
  accent: '#2563eb',
  green: '#22c55e',
  text: '#f1f5f9',
  muted: '#6b7280',
  error: '#ef4444',
  border: 'rgba(255,255,255,0.07)',
}

type ClaimState = 'idle' | 'claiming' | 'just-claimed' | 'error'

interface Props {
  ebook: Ebook
  user: any
  navigate: (page: string, params?: any) => void
}

export default function ClaimButton({ ebook, user, navigate }: Props) {
  const { userEbooks, purchaseEbook } = useEbookStore()
  const [claimState, setClaimState] = useState<ClaimState>('idle')
  const [error, setError] = useState('')

  const isOwned = !!userEbooks.find(ue => ue.ebook_id === ebook.id)
  const isLoggedIn = !!user

  const handleClaim = async () => {
    if (!isLoggedIn) {
      navigate('login')
      return
    }

    setClaimState('claiming')
    setError('')

    try {
      await purchaseEbook(user.id, ebook.id)
      setClaimState('just-claimed')
      setTimeout(() => setClaimState('idle'), 2500)
    } catch (err: any) {
      setClaimState('error')
      setError(err?.message || 'Failed to claim magazine. Please try again.')
    }
  }

  const handleOpen = () => {
    navigate('business')
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: 'rgba(5,5,10,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.border}`,
        padding: '12px 18px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Error message */}
      <AnimatePresence>
        {claimState === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <AlertCircle size={14} color={C.error} />
            <span style={{ fontSize: 12, color: C.error, flex: 1 }}>{error}</span>
            <button
              onClick={() => { setClaimState('idle'); setError('') }}
              style={{
                fontSize: 12,
                color: C.error,
                fontWeight: 700,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={isOwned ? handleOpen : handleClaim}
        disabled={claimState === 'claiming'}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 14,
          border: 'none',
          background: isOwned
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : claimState === 'just-claimed'
              ? '#22c55e'
              : 'linear-gradient(135deg, #2563eb, #7c3aed)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 800,
          cursor: claimState === 'claiming' ? 'not-allowed' : 'pointer',
          opacity: claimState === 'claiming' ? 0.8 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: 'inherit',
          letterSpacing: '0.02em',
        }}
      >
        <AnimatePresence mode="wait">
          {claimState === 'claiming' ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Claiming...
            </motion.span>
          ) : isOwned ? (
            <motion.span
              key="open"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <BookOpen size={18} /> Open Magazine
            </motion.span>
          ) : claimState === 'just-claimed' ? (
            <motion.span
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Check size={18} /> Added to Library
            </motion.span>
          ) : (
            <motion.span
              key="get"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <ShoppingCart size={18} />
              {!isLoggedIn
                ? 'Log in to Get Free Magazine'
                : ebook.price === 0
                  ? 'Get Free Magazine'
                  : `Buy for $${ebook.price}`}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
