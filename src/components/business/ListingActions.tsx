import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, ThumbsUp, EyeOff, Flag } from 'lucide-react'
import { useSavedListingsStore } from '../../stores/savedListingsStore'
import { useHiddenListingsStore } from '../../stores/hiddenListingsStore'
import ReportModal from './ReportModal'
import type { ListingType } from '../../types/savedListing'

const C = {
  muted: '#6b7280',
  accent: '#2563eb',
  amber: '#f59e0b',
  red: '#ef4444',
  green: '#22c55e',
}

interface Props {
  listingId: string
  listingType: ListingType
  userId: string
  onInterested?: (id: string) => void
  style?: React.CSSProperties
}

const INTERESTED_KEY = 'neutron-interested'

function getInterested(): string[] {
  try {
    return JSON.parse(localStorage.getItem(INTERESTED_KEY) || '[]')
  } catch { return [] }
}

function toggleInterested(id: string): boolean {
  const list = getInterested()
  const idx = list.indexOf(id)
  if (idx !== -1) { list.splice(idx, 1); localStorage.setItem(INTERESTED_KEY, JSON.stringify(list)); return false }
  else { list.push(id); localStorage.setItem(INTERESTED_KEY, JSON.stringify(list)); return true }
}

function isInterested(id: string): boolean {
  return getInterested().includes(id)
}

export default function ListingActions({ listingId, listingType, userId, onInterested, style }: Props) {
  const { toggleSave, isSaved } = useSavedListingsStore()
  const { hide, isHidden } = useHiddenListingsStore()
  const [saved, setSaved] = useState(() => isSaved(userId, listingId, listingType))
  const [interested, setInterested] = useState(() => isInterested(listingId))
  const [hidden, setHidden] = useState(() => isHidden(listingId))
  const [reportOpen, setReportOpen] = useState(false)

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nowSaved = toggleSave(userId, listingId, listingType)
    setSaved(nowSaved)
  }

  const handleInterested = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nowInterested = toggleInterested(listingId)
    setInterested(nowInterested)
    onInterested?.(listingId)
  }

  const handleNotInterested = (e: React.MouseEvent) => {
    e.stopPropagation()
    hide(listingId)
    setHidden(true)
  }

  const handleUndoHide = (e: React.MouseEvent) => {
    e.stopPropagation()
    useHiddenListingsStore.getState().unhide(listingId)
    setHidden(false)
  }

  const handleReport = (reason: string, details: string) => {
    console.log('Report submitted:', { listingId, listingType, reason, details })
  }

  if (hidden) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', ...style }}>
        <span style={{ fontSize: 11, color: C.muted }}>Hidden from your feed</span>
        <button onClick={handleUndoHide} style={{
          fontSize: 11, color: C.accent, background: 'none',
          border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0,
        }}>Undo</button>
      </div>
    )
  }

  const btnStyle = (active: boolean, color: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 8, border: 'none',
    background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
    color: active ? color : C.muted,
    cursor: 'pointer', transition: 'all 0.15s', padding: 0,
  })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...style }}>
        <motion.button whileTap={{ scale: 0.85 }} onClick={handleSave} style={btnStyle(saved, C.amber)} title={saved ? 'Unsave' : 'Save'}>
          <Bookmark size={14} fill={saved ? C.amber : 'none'} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={handleInterested} style={btnStyle(interested, C.green)} title={interested ? 'Not interested' : 'Interested'}>
          <ThumbsUp size={14} fill={interested ? C.green : 'none'} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={handleNotInterested} style={btnStyle(false, C.muted)} title="Not interested">
          <EyeOff size={14} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); setReportOpen(true) }} style={btnStyle(false, C.red)} title="Report">
          <Flag size={14} />
        </motion.button>
      </div>
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={handleReport} />
    </>
  )
}
