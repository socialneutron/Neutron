import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Lock, Bell, Shield, UserX, ChevronRight, Eye, Sun, Moon,
  Zap, Globe, Palette, LogOut, Camera, Upload, Sparkles,
  Trash2, X, User, AtSign, MessageCircle,
  Link as LinkIcon, Smartphone, Key,
  MessageSquare, Heart, Users, Mail, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSupabaseAuth } from '../context/SupabaseAuthContext'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserAvatar } from '../stores/userAvatarStore'
import { supabase } from '../lib/supabase'
import SettingDetailSheet from '../components/SettingDetailSheet'
import './SettingsPage.css'

const ACCENT_COLORS = [
  { name: 'Cyber Cyan', hex: '#00D2FF' },
  { name: 'Neon Purple', hex: '#7928CA' },
  { name: 'Volt Green', hex: '#00E676' },
  { name: 'Plasma Pink', hex: '#FF0080' },
  { name: 'Solar Gold', hex: '#FFD600' },
  { name: 'Infrared Red', hex: '#FF3D00' },
]

const BUSINESS_TABS = [
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'talent', label: 'Find Talent' },
  { id: 'products', label: 'Products' },
  { id: 'magazines', label: 'Magazines' },
]

const ZOOM_OPTIONS = [
  { id: 'fit', label: 'Fit' },
  { id: '75', label: '75%' },
  { id: '100', label: '100%' },
  { id: '125', label: '125%' },
]

const ACCOUNT_MODES = [
  { id: 'private', label: 'Private', desc: 'Your posts and profile are only visible to approved followers. People must send a follow request to see your content.' },
  { id: 'public', label: 'Public', desc: 'Your posts and profile are visible to everyone, with global reach. Suited for creators and public figures.' },
  { id: 'company', label: 'Company', desc: 'For businesses. Company accounts cannot post to the social feed. You can only publish listings under Business → Suppliers and Products.', warning: 'Once enabled:\n✗ Cannot create social feed posts\n✗ Cannot register as Talent\n✗ Cannot publish Magazines\n✓ Can manage Suppliers listings\n✓ Can manage Products listings' },
]

// ── Helper Components ──

function AvatarMenu({ open, onClose, onUpload, onGenerate, onRemove }) {
  const menuRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div ref={menuRef} initial={{ opacity: 0, scale: 0.92, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -6 }} transition={{ duration: 0.18 }}
          style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            marginTop: 8, zIndex: 9999, minWidth: 220,
            background: 'rgba(12,12,18,0.92)', backdropFilter: 'blur(24px)',
            border: '1px solid var(--glass-border)', borderRadius: 16,
            padding: 6, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}>
          <MenuBtn icon={Upload} label="Upload Photo" onClick={onUpload} />
          <MenuBtn icon={Sparkles} label="Generate AI Avatar" accent onClick={onGenerate} />
          <MenuBtn icon={Trash2} label="Remove Photo" danger onClick={onRemove} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MenuBtn({ icon: Icon, label, onClick, accent, danger }) {
  const color = danger ? '#ff6b6b' : accent ? 'var(--accent-blue)' : 'var(--text-secondary)'
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '11px 14px', borderRadius: 12, border: 'none',
      background: 'transparent', color, fontSize: 14, fontWeight: 500,
      cursor: 'pointer', transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={16} /> {label}
    </button>
  )
}

function Toggle({ on, onToggle }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onToggle() }}
      className={`toggle-switch ${on ? 'toggle-on' : ''}`}>
      <motion.div className="toggle-thumb" layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </div>
  )
}

function InlineField({ label, icon: Icon, value, onChange, multiline, placeholder }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const save = () => { onChange(draft); setEditing(false) }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '15px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)',
          border: '1px solid var(--glass-border)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0,
        }}>
          <Icon size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</span>
          {editing ? (
            multiline ? (
              <textarea value={draft} onChange={e => setDraft(e.target.value)} autoFocus rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px 10px', color: '#E5E5E5', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value); setEditing(false) } if (e.key === 'Enter' && !e.shiftKey) save() }}
              />
            ) : (
              <input value={draft} onChange={e => setDraft(e.target.value)} autoFocus
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px 10px', color: '#E5E5E5', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value); setEditing(false) } if (e.key === 'Enter') save() }}
              />
            )
          ) : (
            <p style={{ fontSize: 15, fontWeight: 500, color: '#E5E5E5', margin: 0, lineHeight: 1.4 }}>
              {value || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{placeholder}</span>}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
        {editing ? (
          <>
            <button onClick={() => { setDraft(value); setEditing(false) }} style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Cancel</button>
            <button onClick={save} style={{ fontSize: 12, color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '4px 8px' }}>Save</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid var(--glass-border)',
            background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Edit</button>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 4px', marginTop: 8 }}>
      <Icon size={13} color="var(--accent-blue)" />
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)' }}>{title}</span>
    </div>
  )
}

function Row({ icon: Icon, label, children, badge, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '15px 16px', cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.15s', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)',
          border: '1px solid var(--glass-border)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0,
        }}>
          <Icon size={15} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>{label}</span>
          {badge && <span className="settings-badge">{badge}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, sub }) {
  return (
    <div style={{
      flex: sub ? 1.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '8px 0', borderRadius: 10,
      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)',
      fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500,
    }}>
      <Icon size={12} /> {label}
    </div>
  )
}

// ── Main Component ──

export default function SettingsPage({ navigate, onLogout }) {
  const { user } = useAuth()
  const { user: sbUser } = useSupabaseAuth()
  const S = useSettingsStore()
  const U = useUserAvatar()
  const fileInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [accentOpen, setAccentOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteUsername, setDeleteUsername] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Detail sheets
  const [detailSheet, setDetailSheet] = useState(null)
  const [accountModeSheet, setAccountModeSheet] = useState(null)
  const [companyConfirm, setCompanyConfirm] = useState(false)

  // Wire dark mode
  useEffect(() => {
    const root = document.documentElement
    if (S.darkMode) {
      root.style.setProperty('--bg-deep', '#020617')
      root.style.setProperty('--bg-medium', '#071124')
      root.style.setProperty('--bg-light', '#0A1328')
      root.style.setProperty('--bg-color', '#020617')
      root.style.setProperty('--text-primary', '#FFFFFF')
      root.style.setProperty('--text-secondary', '#D1D5DB')
      root.style.setProperty('--text-muted', '#94A3B8')
      root.style.setProperty('--glass-bg', 'rgba(7, 17, 36, 0.6)')
      root.style.setProperty('--glass-border', 'rgba(0, 207, 255, 0.1)')
      root.style.setProperty('--glass-border-hover', 'rgba(0, 207, 255, 0.25)')
      document.body.style.backgroundColor = '#020617'
      document.body.style.color = '#FFFFFF'
    } else {
      root.style.setProperty('--bg-deep', '#F8FAFC')
      root.style.setProperty('--bg-medium', '#F1F5F9')
      root.style.setProperty('--bg-light', '#E2E8F0')
      root.style.setProperty('--bg-color', '#F8FAFC')
      root.style.setProperty('--text-primary', '#0F172A')
      root.style.setProperty('--text-secondary', '#475569')
      root.style.setProperty('--text-muted', '#94A3B8')
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.8)')
      root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.08)')
      root.style.setProperty('--glass-border-hover', 'rgba(0, 0, 0, 0.15)')
      document.body.style.backgroundColor = '#F8FAFC'
      document.body.style.color = '#0F172A'
    }
  }, [S.darkMode])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', S.accentHex)
    root.style.setProperty('--accent-blue', S.accentHex)
    root.style.setProperty('--accent', S.accentHex)
    root.style.setProperty('--accent-glow', `${S.accentHex}33`)
  }, [S.accentHex])

  const activeUser = user || sbUser
  const displayName = U.displayName || activeUser?.username || activeUser?.displayName || 'User'
  const email = activeUser?.email || 'user@neutron.app'
  const username = activeUser?.username || displayName?.toLowerCase().replace(/\s+/g, '_')
  const avatarLetter = displayName[0]?.toUpperCase() || 'U'
  const reputation = activeUser?.reputation || 4.9

  // Avatar handlers
  const handleFileUpload = () => fileInputRef.current?.click()
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { U.setAvatar(ev.target?.result); setMenuOpen(false) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  const handleGenerateAI = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 200; canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const hue1 = Math.random() * 360
    const hue2 = hue1 + 40 + Math.random() * 60
    const grad = ctx.createLinearGradient(0, 0, 200, 200)
    grad.addColorStop(0, `hsl(${hue1}, 80%, 55%)`)
    grad.addColorStop(1, `hsl(${hue2}, 80%, 45%)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 200, 200)
    for (let i = 0; i < 12; i++) {
      ctx.beginPath()
      ctx.arc(40 + Math.random() * 120, 40 + Math.random() * 120, 8 + Math.random() * 30, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${hue1 + Math.random() * 90}, 70%, 70%, ${0.15 + Math.random() * 0.2})`
      ctx.fill()
    }
    ctx.font = 'bold 72px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8
    ctx.fillText(avatarLetter, 100, 104)
    U.setAvatar(canvas.toDataURL())
    setMenuOpen(false); setAiModalOpen(false)
  }
  const handleRemove = () => { U.setAvatar(null); setMenuOpen(false) }

  // Banner handlers
  const handleBannerUpload = () => bannerInputRef.current?.click()
  const handleBannerChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => U.setBanner(ev.target?.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  const handleBannerRemove = () => U.setBanner(null)

  // Account mode handlers
  const handleAccountModeSelect = (mode) => {
    if (mode === 'company' && S.accountType !== 'company') {
      setCompanyConfirm(true)
    } else {
      S.setAccountType(mode)
      setAccountModeSheet(null)
    }
  }
  const confirmCompanySwitch = () => {
    S.setAccountType('company')
    setCompanyConfirm(false)
    setAccountModeSheet(null)
  }

  // Delete account
  const handleDeleteAccount = async () => {
    if (!deleteUsername.trim() || deleteUsername !== `@${username}`) return
    setDeleting(true)
    try {
      const userId = activeUser?.uid || activeUser?.id
      if (userId) {
        await supabase.from('posts').delete().eq('author_id', userId)
        await supabase.from('users').delete().eq('id', userId)
      }
      await onLogout?.()
    } catch (err) { console.error('Delete account failed:', err) }
    setDeleting(false); setDeleteConfirm(false); setDeleteUsername('')
  }

  // Open detail sheet helper
  const openSheet = (sheet) => setDetailSheet(sheet)

  // Get current account mode label
  const currentMode = ACCOUNT_MODES.find(m => m.id === S.accountType)

  return (
    <div className="settings-page">
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      <input ref={bannerInputRef} type="file" accept="image/*" hidden onChange={handleBannerChange} />

      {/* Header */}
      <div className="settings-header">
        <button className="icon-btn" onClick={() => navigate('profile')}><ArrowLeft size={20} /></button>
        <h2 className="settings-title">Settings</h2>
      </div>

      {/* ── Profile Identity ── */}
      <div style={{ margin: '20px 20px 0', padding: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <motion.div whileHover={{ scale: 1.03 }} onClick={() => setMenuOpen(!menuOpen)} style={{
              width: 64, height: 64, borderRadius: 20, cursor: 'pointer',
              background: U.avatar ? `url(${U.avatar}) center/cover` : `linear-gradient(135deg, var(--accent-blue), var(--accent-purple))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 900, color: '#fff', flexShrink: 0,
              boxShadow: '0 0 20px rgba(0,210,255,0.2)', overflow: 'hidden',
            }}>
              {!U.avatar && avatarLetter}
              <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} style={{
                position: 'absolute', inset: 0, borderRadius: 20,
                background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera size={22} color="#fff" />
              </motion.div>
            </motion.div>
            <AvatarMenu open={menuOpen} onClose={() => setMenuOpen(false)} onUpload={handleFileUpload} onGenerate={() => { setMenuOpen(false); setAiModalOpen(true) }} onRemove={handleRemove} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#E5E5E5' }}>{displayName}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{email}</p>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)',
            borderRadius: 12, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)',
          }}>
            <span style={{ fontSize: 14 }}>&#x25C6;</span>
            <span>{reputation} Rep</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <QuickAction icon={LinkIcon} label={`neutron.app/@${username}`} sub />
          <QuickAction icon={AtSign} label={username} />
        </div>
      </div>

      {/* ── Banner ── */}
      <div style={{ margin: '14px 20px 0', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ position: 'relative', height: 100, overflow: 'hidden' }}>
          {U.banner ? (
            <img src={U.banner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#020617', backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(0,210,255,0.12) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(123,97,255,0.12) 0%, transparent 50%)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 10, right: 12, display: 'flex', gap: 6 }}>
            <button onClick={handleBannerUpload} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Upload size={12} /> {U.banner ? 'Change' : 'Upload Banner'}
            </button>
            {U.banner && (
              <button onClick={handleBannerRemove} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Avatar Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}
            onClick={() => setAiModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'rgba(12,12,18,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 360, width: '100%', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #7928CA, #FF0080)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Sparkles size={28} color="#fff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#E5E5E5' }}>Generate AI Avatar</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>Create a unique, algorithmically generated profile picture.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setAiModalOpen(false)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleGenerateAI} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7928CA, #FF0080)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Generate</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Company Mode Confirmation */}
      <AnimatePresence>
        {companyConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}
            onClick={() => setCompanyConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'rgba(12,12,18,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} color="#f59e0b" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#E5E5E5' }}>Switch to Company Account</h3>
              </div>
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: '0 0 16px' }}>
                This will change what you can do in the app:
              </p>
              <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.8, marginBottom: 20, paddingLeft: 8 }}>
                <div>✗ Cannot create social feed posts</div>
                <div>✗ Cannot register as Talent</div>
                <div>✗ Cannot publish Magazines</div>
                <div style={{ color: '#22c55e' }}>✓ Can manage Suppliers listings</div>
                <div style={{ color: '#22c55e' }}>✓ Can manage Products listings</div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>You can switch back anytime.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setCompanyConfirm(false)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={confirmCompanySwitch} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Switch</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="settings-content">

        {/* ══ Account ══ */}
        <div>
          <SectionHeader icon={User} title="Account" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <InlineField label="Display Name" icon={User} value={U.displayName} onChange={U.setDisplayName} />
            <InlineField label="Bio" icon={MessageCircle} value={U.bio} onChange={U.setBio} multiline placeholder="Write something about yourself..." />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={AtSign} label="Username"><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>@{username}</span></Row>
            <Row icon={Mail} label="Email"><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{email}</span></Row>
          </div>
        </div>

        {/* ══ Account Mode ══ */}
        <div>
          <SectionHeader icon={Lock} title="Account Mode" />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {ACCOUNT_MODES.map(mode => {
              const isActive = S.accountType === mode.id
              return (
                <button key={mode.id} onClick={() => handleAccountModeSelect(mode.id)} style={{
                  flex: 1, padding: '14px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  border: isActive ? '2px solid #00D2FF' : '1px solid var(--glass-border)',
                  background: isActive ? 'rgba(0,210,255,0.06)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isActive ? '#00D2FF' : 'var(--text-primary)', marginBottom: 4 }}>{mode.label}</span>
                  <span style={{ display: 'block', fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{mode.id === 'company' ? 'B2B tooling' : mode.id === 'private' ? 'Approved followers only' : 'Global reach'}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ══ Appearance ══ */}
        <div>
          <SectionHeader icon={Palette} title="Appearance" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={S.darkMode ? Moon : Sun} label="Dark Mode">
              <Toggle on={S.darkMode} onToggle={() => S.setDarkMode(!S.darkMode)} />
            </Row>
            <div onClick={() => setAccentOpen(!accentOpen)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '15px 16px', cursor: 'pointer', transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <Palette size={15} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>Accent Color</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: S.accentHex, boxShadow: `0 0 8px ${S.accentHex}60` }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{S.accentColor}</span>
                <motion.div animate={{ rotate: accentOpen ? 180 : 0 }}><ChevronRight size={16} color="var(--text-secondary)" /></motion.div>
              </div>
            </div>
            <AnimatePresence>
              {accentOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px', flexWrap: 'wrap' }}>
                    {ACCENT_COLORS.map(c => (
                      <button key={c.hex} onClick={() => S.setAccentColor(c.name, c.hex)} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10,
                        border: S.accentHex === c.hex ? `2px solid ${c.hex}` : '1px solid var(--glass-border)',
                        background: S.accentHex === c.hex ? `${c.hex}15` : 'rgba(255,255,255,0.02)', cursor: 'pointer',
                      }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: c.hex, boxShadow: `0 0 8px ${c.hex}40` }} />
                        <span style={{ fontSize: 12, color: S.accentHex === c.hex ? c.hex : 'var(--text-secondary)', fontWeight: S.accentHex === c.hex ? 700 : 500 }}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ══ Notifications ══ */}
        <div>
          <SectionHeader icon={Bell} title="Notifications" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            {[
              { key: 'mentions', icon: Bell, label: 'Mentions & Replies', desc: 'Get notified when someone mentions you or replies to your posts.' },
              { key: 'likes', icon: Heart, label: 'Likes & Reactions', desc: 'Get notified when someone likes or reacts to your posts.' },
              { key: 'follows', icon: Users, label: 'New Followers', desc: 'Get notified when someone follows you.' },
              { key: 'comments', icon: MessageCircle, label: 'Comments & Reposts', desc: 'Get notified when someone comments on or reposts your content.' },
            ].map(item => (
              <Row key={item.key} icon={item.icon} label={item.label} onClick={() => openSheet(item)}>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </Row>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            {[
              { key: 'push', icon: Smartphone, label: 'Push Notifications', desc: 'Receive push notifications on your device for activity related to your account.' },
              { key: 'email', icon: Mail, label: 'Email Notifications', desc: 'Receive email digests for important activity you may have missed.' },
              { key: 'toasts', icon: Bell, label: 'In-App Toasts', desc: 'Show popup toasts inside the app when you receive new notifications.' },
            ].map(item => (
              <Row key={item.key} icon={item.icon} label={item.label} onClick={() => openSheet(item)}>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </Row>
            ))}
          </div>
        </div>

        {/* ══ Chat Settings ══ */}
        <div>
          <SectionHeader icon={MessageSquare} title="Chat Settings" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            {[
              { key: 'readReceipts', icon: Eye, label: 'Read Receipts', desc: 'Let others see when you\'ve read their messages. When off, read ticks stay gray.', store: 'chat' },
              { key: 'typingIndicator', icon: MessageSquare, label: 'Typing Indicator', desc: 'Show "typing..." status to others when you\'re composing a message.', store: 'chat' },
              { key: 'showOnline', icon: Globe, label: 'Show Online Status', desc: 'Let others see when you\'re online in chat. When off, your online dot is hidden.', store: 'chat' },
            ].map(item => (
              <Row key={item.key} icon={item.icon} label={item.label} onClick={() => openSheet(item)}>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </Row>
            ))}
          </div>
        </div>

        {/* ══ Privacy ══ */}
        <div>
          <SectionHeader icon={Lock} title="Privacy" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Zap} label="AI Personalization" onClick={() => openSheet({ key: 'aiPersonalize', icon: Zap, label: 'AI Personalization', desc: 'Let the app personalize content suggestions and recommendations based on your activity.', store: 'privacy' })}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={UserX} label="Blocked Accounts" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>0</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>
        </div>

        {/* ══ Security ══ */}
        <div>
          <SectionHeader icon={Shield} title="Security" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Lock} label="Change Password" onClick={() => {}}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Key} label="Two-Factor Authentication" badge="Recommended" onClick={() => openSheet({ key: '2fa', icon: Key, label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account. When enabled, you\'ll need to enter a code from your authenticator app when signing in.', store: null })}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Smartphone} label="Active Sessions" onClick={() => navigate('sessions')}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>
        </div>

        {/* ══ Business & Workflow ══ */}
        <div>
          <SectionHeader icon={Globe} title="Business & Workflow" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Globe} label="Default Business Tab" onClick={() => openSheet({ key: 'defaultTab', icon: Globe, label: 'Default Business Tab', desc: 'Choose which tab opens first in the Business page.', store: 'business', type: 'picker', options: BUSINESS_TABS, currentValue: S.business.defaultTab, onSelect: S.setBusinessDefaultTab })}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{S.business.defaultTab}</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Eye} label="PDF Reader Defaults" onClick={() => openSheet({ key: 'defaultZoom', icon: Eye, label: 'PDF Reader Defaults', desc: 'Default zoom level for the Workflow PDF Reader.', store: 'workflow', type: 'picker', options: ZOOM_OPTIONS, currentValue: S.workflow.defaultZoom, onSelect: S.setWorkflowDefaultZoom })}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{S.workflow.defaultZoom === 'fit' ? 'Fit' : `${S.workflow.defaultZoom}%`}</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>
        </div>

        {/* ══ Danger Zone ══ */}
        <div className="danger-zone">
          <button className="danger-btn" onClick={() => { onLogout?.(); navigate('welcome') }}>
            <LogOut size={18} /> Sign Out
          </button>
          <button className="delete-account-btn" onClick={() => setDeleteConfirm(true)}>
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}
            onClick={() => { setDeleteConfirm(false); setDeleteUsername('') }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'rgba(12,12,18,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#E5E5E5' }}>Delete Account</h3>
              </div>
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: '0 0 16px' }}>
                This will permanently delete all your data including posts, followers, and listings. This cannot be undone.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>Type <strong style={{ color: '#E5E5E5' }}>@{username}</strong> to confirm:</p>
              <input
                value={deleteUsername} onChange={e => setDeleteUsername(e.target.value)} autoFocus
                placeholder={`@${username}`}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${deleteUsername === `@${username}` ? 'rgba(239,68,68,0.5)' : 'var(--glass-border)'}`,
                  background: 'rgba(255,255,255,0.04)', color: '#E5E5E5',
                  fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 16,
                  boxSizing: 'border-box',
                }}
                onKeyDown={e => { if (e.key === 'Enter') handleDeleteAccount() }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setDeleteConfirm(false); setDeleteUsername('') }} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deleteUsername !== `@${username}`} style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                  background: deleteUsername === `@${username}` ? '#ef4444' : 'rgba(255,255,255,0.06)',
                  color: deleteUsername === `@${username}` ? '#fff' : 'var(--text-muted)',
                  fontSize: 14, fontWeight: 600, cursor: deleteUsername === `@${username}` ? 'pointer' : 'not-allowed',
                }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Detail Sheets ══ */}
      <SettingDetailSheet
        open={!!detailSheet}
        onClose={() => setDetailSheet(null)}
        title={detailSheet?.label || ''}
        description={detailSheet?.desc || ''}
      >
        {detailSheet?.type === 'picker' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {detailSheet.options.map(opt => (
              <button key={opt.id} onClick={() => { detailSheet.onSelect(opt.id); setDetailSheet(null) }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 10, border: detailSheet.currentValue === opt.id ? '2px solid #00D2FF' : '1px solid var(--glass-border)',
                background: detailSheet.currentValue === opt.id ? 'rgba(0,210,255,0.06)' : 'rgba(255,255,255,0.02)',
                color: detailSheet.currentValue === opt.id ? '#00D2FF' : '#E5E5E5',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <span style={{ textTransform: opt.id === 'fit' ? 'none' : 'capitalize' }}>{opt.label}</span>
                {detailSheet.currentValue === opt.id && <span style={{ color: '#00D2FF' }}>✓</span>}
              </button>
            ))}
          </div>
        ) : detailSheet?.store === 'chat' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>{detailSheet.label}</span>
            <Toggle on={S.chat[detailSheet.key]} onToggle={() => S.toggleChat(detailSheet.key)} />
          </div>
        ) : detailSheet?.store === 'notifications' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>{detailSheet.label}</span>
            <Toggle on={S.notifications[detailSheet.key]} onToggle={() => S.toggleNotification(detailSheet.key)} />
          </div>
        ) : detailSheet?.store === 'privacy' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>{detailSheet.label}</span>
            <Toggle on={S.privacy[detailSheet.key]} onToggle={() => S.togglePrivacy(detailSheet.key)} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>{detailSheet?.label}</span>
            <Toggle on={false} onToggle={() => {}} />
          </div>
        )}
      </SettingDetailSheet>

      {/* Footer */}
      <div className="settings-footer" style={{ padding: '20px 0' }}>Neutron v1.0.0</div>
    </div>
  )
}
