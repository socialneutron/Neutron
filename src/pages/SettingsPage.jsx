import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Moon, Sun, Lock, Bell, Shield, UserX, ChevronRight, Eye,
  Zap, Globe, Palette, HelpCircle, LogOut, Camera, Upload, Sparkles,
  Trash2, Edit3, Check, X, ChevronDown, User, AtSign, MessageCircle,
  Hash, Link as LinkIcon, ExternalLink, Smartphone, Key,
  MessageSquare, ShoppingBag, Wallet, BarChart3, FileText, Download,
  AlertTriangle, Star, Clock, Users, Send, Coins, TrendingUp, Image, Copy, Mail
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserAvatar } from '../stores/userAvatarStore'
import './SettingsPage.css'

const ACCENT_COLORS = [
  { name: 'Cyber Cyan', hex: '#00D2FF' },
  { name: 'Neon Purple', hex: '#7928CA' },
  { name: 'Volt Green', hex: '#00E676' },
  { name: 'Plasma Pink', hex: '#FF0080' },
  { name: 'Solar Gold', hex: '#FFD600' },
  { name: 'Infrared Red', hex: '#FF3D00' },
]

function AvatarMenu({ open, onClose, onUpload, onGenerate, onRemove }) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            marginTop: 8, zIndex: 9999, minWidth: 220,
            background: 'rgba(12,12,18,0.92)', backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
            padding: 6, boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <MenuBtn icon={Upload} label="Upload New Photo" onClick={onUpload} />
          <MenuBtn icon={Sparkles} label="Generate AI Avatar" onClick={onGenerate} accent />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />
          <MenuBtn icon={Trash2} label="Remove Current Photo" onClick={onRemove} danger />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MenuBtn({ icon: Icon, label, onClick, accent, danger }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '10px 12px', borderRadius: 10, border: 'none',
        background: 'transparent', color: danger ? '#ff4757' : accent ? '#A78BFA' : '#E5E5E5',
        fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'relative', width: 48, height: 28, borderRadius: 100,
        background: on
          ? `linear-gradient(135deg, var(--accent-blue), var(--accent-purple))`
          : 'rgba(255,255,255,0.1)',
        border: on ? 'none' : '1px solid var(--glass-border)',
        cursor: 'pointer', transition: 'all 0.3s ease', flexShrink: 0,
        boxShadow: on ? '0 0 12px rgba(0,210,255,0.3)' : 'none',
      }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute', top: 3, left: 3, width: 20, height: 20,
          borderRadius: '50%', background: on ? '#fff' : 'rgba(255,255,255,0.4)',
          transform: on ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </button>
  )
}

function InlineField({ label, icon: Icon, value, onChange, placeholder, multiline }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])

  const save = () => {
    if (draft.trim()) onChange(draft.trim())
    else setDraft(value)
    setEditing(false)
  }

  return (
    <div style={{
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-secondary)' }}>
          {label}
        </span>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              borderRadius: 8, border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,210,255,0.08)'; e.currentTarget.style.color = 'var(--accent-blue)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <Edit3 size={12} /> Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setDraft(value); setEditing(false) }}
              style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={12} /> Cancel
            </button>
            <button onClick={save}
              style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={12} /> Save
            </button>
          </div>
        )}
      </div>
      {editing ? (
        multiline ? (
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1px solid rgba(0,210,255,0.3)', background: 'rgba(255,255,255,0.04)',
              color: '#E5E5E5', fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
              resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value); setEditing(false) } if (e.key === 'Enter' && !e.shiftKey) save() }}
          />
        ) : (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1px solid rgba(0,210,255,0.3)', background: 'rgba(255,255,255,0.04)',
              color: '#E5E5E5', fontSize: 15, fontWeight: 500, fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value); setEditing(false) } if (e.key === 'Enter') save() }}
          />
        )
      ) : (
        <p style={{ fontSize: 15, fontWeight: 500, color: '#E5E5E5', margin: 0, lineHeight: 1.4 }}>
          {value || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{placeholder}</span>}
        </p>
      )}
    </div>
  )
}

export default function SettingsPage({ navigate, onLogout }) {
  const { user } = useAuth()
  const S = useSettingsStore()
  const U = useUserAvatar()
  const fileInputRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [accentOpen, setAccentOpen] = useState(false)

  const displayName = U.displayName || user?.username || 'Pratham'
  const email = user?.email || 'pratham@neutron.app'
  const avatarLetter = displayName[0]?.toUpperCase() || 'P'
  const reputation = user?.reputation || 4.9

  const handleFileUpload = () => fileInputRef.current?.click()
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      U.setAvatar(ev.target?.result)
      setMenuOpen(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleGenerateAI = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
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
      ctx.arc(
        40 + Math.random() * 120,
        40 + Math.random() * 120,
        8 + Math.random() * 30,
        0, Math.PI * 2
      )
      ctx.fillStyle = `hsla(${hue1 + Math.random() * 90}, 70%, 70%, ${0.15 + Math.random() * 0.2})`
      ctx.fill()
    }
    ctx.font = 'bold 72px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 8
    ctx.fillText(avatarLetter, 100, 104)
    U.setAvatar(canvas.toDataURL())
    setMenuOpen(false)
    setAiModalOpen(false)
  }

  const handleRemove = () => {
    U.setAvatar(null)
    setMenuOpen(false)
  }

  const SectionHeader = ({ icon: Icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 4px', marginTop: 8 }}>
      <Icon size={13} color="var(--accent-blue)" />
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)' }}>
        {title}
      </span>
    </div>
  )

  const Row = ({ icon: Icon, label, children, badge, onClick }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '15px 16px', cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
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
          {badge && (
            <span style={{
              display: 'inline-block', background: 'rgba(0,210,255,0.1)',
              border: '1px solid rgba(0,210,255,0.25)', borderRadius: 100,
              padding: '1px 8px', fontSize: 10, fontWeight: 700, color: 'var(--accent-blue)',
              textTransform: 'uppercase', letterSpacing: 0.5, width: 'fit-content',
            }}>{badge}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {children}
      </div>
    </div>
  )

  return (
    <div className="settings-page">
      <input
        ref={fileInputRef} type="file" accept="image/*" hidden
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="settings-header">
        <button className="icon-btn" onClick={() => navigate('profile')} id="settings-back-btn">
          <ArrowLeft size={20} />
        </button>
        <h2 className="settings-title">Settings</h2>
      </div>

      {/* ── MODULE 0: Profile Identity Manager ── */}
      <div style={{ margin: '20px 20px 0', padding: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ position: 'relative' }}
            onMouseEnter={() => {}}
          >
            {/* Avatar with hover mask */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 64, height: 64, borderRadius: 20, cursor: 'pointer',
                background: U.avatar
                  ? `url(${U.avatar}) center/cover`
                  : `linear-gradient(135deg, var(--accent-blue), var(--accent-purple))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 900, color: '#fff', flexShrink: 0,
                boxShadow: '0 0 20px rgba(0,210,255,0.2)', overflow: 'hidden',
              }}
            >
              {!U.avatar && avatarLetter}
              {/* Hover overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: 20,
                  background: 'rgba(0,0,0,0.6)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Camera size={22} color="#fff" />
              </motion.div>
            </motion.div>

            <AvatarMenu
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              onUpload={handleFileUpload}
              onGenerate={() => { setMenuOpen(false); setAiModalOpen(true) }}
              onRemove={handleRemove}
            />
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#E5E5E5' }}>{displayName}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{email}</p>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)',
            borderRadius: 12, padding: '8px 12px', fontSize: 12, fontWeight: 700,
            color: 'var(--accent-blue)',
          }}>
            <span>🔷</span>
            <span>{reputation} Rep</span>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <QuickAction icon={LinkIcon} label="neutron.app/@pratham" sub />
          <QuickAction icon={AtSign} label="pratham" />
        </div>
      </div>

      {/* AI Avatar Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 99999, padding: 20,
            }}
            onClick={() => setAiModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(12,12,18,0.95)', backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
                padding: 28, maxWidth: 360, width: '100%', textAlign: 'center',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #7928CA, #FF0080)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Sparkles size={28} color="#fff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#E5E5E5' }}>Generate AI Avatar</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
                Create a unique, algorithmically generated profile picture with vibrant gradients and abstract geometry.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setAiModalOpen(false)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleGenerateAI}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7928CA, #FF0080)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  ✨ Generate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="settings-content">

        {/* ══════════════════════════════════════════
            MODULE A: Account Management
            ══════════════════════════════════════════ */}
        <div>
          <SectionHeader icon={User} title="Account Management" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <InlineField
              label="Display Name"
              icon={User}
              value={U.displayName}
              onChange={U.setDisplayName}
              placeholder="Your display name"
            />
            <InlineField
              label="Bio"
              icon={Edit3}
              value={U.bio}
              onChange={U.setBio}
              placeholder="Tell the world about yourself..."
              multiline
            />
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <Globe size={15} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>Username</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@pratham</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Mail} label="Email" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{email}</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Smartphone} label="Phone Number" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Not set</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Clock} label="Date of Birth" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Not set</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Shield} label="Identity Verification" badge="Not Verified">
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Verify your identity</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MODULE B: Appearance
            ══════════════════════════════════════════ */}
        <div>
          <SectionHeader icon={Palette} title="Appearance & Theme" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ padding: '15px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  {S.darkMode ? <Moon size={15} /> : <Sun size={15} />}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>Dark Mode</span>
              </div>
              <Toggle on={S.darkMode} onToggle={() => S.setDarkMode(!S.darkMode)} />
            </div>

            <div
              onClick={() => setAccentOpen(!accentOpen)}
              style={{ padding: '15px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <Palette size={15} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>Accent Color</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{S.accentColor}</span>
                <motion.div animate={{ rotate: accentOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} color="var(--text-secondary)" />
                </motion.div>
              </div>
            </div>

            <AnimatePresence>
              {accentOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '8px 16px 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => S.setAccentColor(c.name, c.hex)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          padding: '10px 12px', borderRadius: 12, border: S.accentColor === c.name
                            ? `2px solid ${c.hex}` : '2px solid transparent',
                          background: S.accentColor === c.name ? `${c.hex}11` : 'rgba(255,255,255,0.04)',
                          cursor: 'pointer', minWidth: 72, transition: 'all 0.2s',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: c.hex,
                          boxShadow: S.accentColor === c.name ? `0 0 12px ${c.hex}66` : 'none',
                          border: S.accentColor === c.name ? '2px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                        }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: S.accentColor === c.hex ? '#fff' : 'var(--text-secondary)' }}>
                          {c.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ padding: '15px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <Eye size={15} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#E5E5E5' }}>Text Size</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Medium</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MODULE C: Privacy
            ══════════════════════════════════════════ */}
        <div>
          <SectionHeader icon={Lock} title="Privacy" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            {/* Account Type Selector */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,210,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={16} color="#00D2FF" />
                </div>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Profile Visibility</span>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>Choose how your profile is visible to others</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { id: 'private', label: 'Private', desc: 'For standard users. Restricts your feed to approved followers.' },
                  { id: 'public', label: 'Public', desc: 'For influencers and creators. Open feed broadcast with global reach.' },
                  { id: 'company', label: 'Company', desc: 'For corporate business entities. Unlocks b2b tooling, product catalogs, and supplier registration.' },
                ].map(opt => {
                  const isActive = S.accountType === opt.id;
                  return (
                    <button key={opt.id} onClick={() => S.setAccountType(opt.id)}
                      style={{
                        flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        border: isActive ? '2px solid #00D2FF' : '1px solid var(--glass-border)',
                        background: isActive ? 'rgba(0,210,255,0.06)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.15s',
                      }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isActive ? '#00D2FF' : 'var(--text-primary)', marginBottom: 4 }}>{opt.label}</span>
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Row icon={Eye} label="Read Receipts" badge="Broadcasts view state in chat">
              <Toggle on={S.privacy.readReceipts} onToggle={() => S.togglePrivacy('readReceipts')} />
            </Row>
            <Row icon={Globe} label="Show Online Status">
              <Toggle on={S.privacy.showOnline} onToggle={() => S.togglePrivacy('showOnline')} />
            </Row>
            <Row icon={Users} label="Who Can Tag You" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Everyone</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={UserX} label="Blocked Accounts" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>0</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={AlertTriangle} label="Restricted Accounts" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>0</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Zap} label="AI Personalization">
              <Toggle on={S.privacy.aiPersonalize} onToggle={() => S.togglePrivacy('aiPersonalize')} />
            </Row>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MODULE D: Security
            ══════════════════════════════════════════ */}
        <div>
          <SectionHeader icon={Shield} title="Security" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Lock} label="Change Password" onClick={() => {}}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Key} label="Two-Factor Authentication" badge="Recommended">
              <Toggle on={false} onToggle={() => {}} />
            </Row>
            <Row icon={Smartphone} label="Active Sessions" onClick={() => navigate('sessions')}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>2 devices</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Clock} label="Login Activity" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>View history</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Shield} label="Security Center" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage app permissions</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MODULE E: Notifications
            ══════════════════════════════════════════ */}
        <div>
          <SectionHeader icon={Bell} title="Notifications" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Bell} label="Mentions & Replies">
              <Toggle on={S.notifications.mentions} onToggle={() => S.toggleNotification('mentions')} />
            </Row>
            <Row icon={Heart} label="Likes & Reactions">
              <Toggle on={S.notifications.likes} onToggle={() => S.toggleNotification('likes')} />
            </Row>
            <Row icon={User} label="New Followers">
              <Toggle on={S.notifications.follows} onToggle={() => S.toggleNotification('follows')} />
            </Row>
            <Row icon={MessageCircle} label="Comments & Reposts">
              <Toggle on={S.notifications.mentions} onToggle={() => {}} />
            </Row>
            <Row icon={Send} label="Direct Messages">
              <Toggle on={true} onToggle={() => {}} />
            </Row>
            <Row icon={ShoppingBag} label="Marketplace Updates">
              <Toggle on={true} onToggle={() => {}} />
            </Row>
            <Row icon={Zap} label="Breaking News Alerts">
              <Toggle on={S.notifications.breaking} onToggle={() => S.toggleNotification('breaking')} />
            </Row>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Mail} label="Email Notifications" onClick={() => {}}>
              <Toggle on={false} onToggle={() => {}} />
            </Row>
            <Row icon={Smartphone} label="Push Notifications" onClick={() => {}}>
              <Toggle on={true} onToggle={() => {}} />
            </Row>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MODULE F: Messages
            ══════════════════════════════════════════ */}
        <div>
          <SectionHeader icon={MessageSquare} title="Messages" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Eye} label="Read Receipts" badge="Who sees when you read">
              <Toggle on={S.privacy.readReceipts} onToggle={() => S.togglePrivacy('readReceipts')} />
            </Row>
            <Row icon={Edit3} label="Typing Indicator">
              <Toggle on={true} onToggle={() => {}} />
            </Row>
            <Row icon={MessageSquare} label="Auto-save Drafts">
              <Toggle on={true} onToggle={() => {}} />
            </Row>
            <Row icon={Users} label="Who Can Message You" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Everyone</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MODULE G: Marketplace & Escrow
            ══════════════════════════════════════════ */}
        <div>
          <SectionHeader icon={ShoppingBag} title="Marketplace & Escrow" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Wallet} label="Escrow Notifications" onClick={() => {}}>
              <Toggle on={true} onToggle={() => {}} />
            </Row>
            <Row icon={Star} label="Show Seller Ratings" onClick={() => {}}>
              <Toggle on={true} onToggle={() => {}} />
            </Row>
            <Row icon={Coins} label="Payment Methods" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Clock} label="Transaction History" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>View all</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Zap} label="Auto-release Funds" badge="After 7 days">
              <Toggle on={true} onToggle={() => {}} />
            </Row>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MODULE H: Creator Studio
            ══════════════════════════════════════════ */}
        <div>
          <SectionHeader icon={BarChart3} title="Creator Studio" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Coins} label="Monetization" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Setup</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Clock} label="Content Scheduling" onClick={() => {}}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={BarChart3} label="Analytics Visibility" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Public</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={TrendingUp} label="Brand Partnerships" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Opt in</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Image} label="Media Quality" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Auto (HD)</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MODULE I: Data & Support
            ══════════════════════════════════════════ */}
        <div>
          <SectionHeader icon={HelpCircle} title="Data & Support" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={Download} label="Export Your Data" onClick={() => {}}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Download archive</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Copy} label="Download Content Archive" onClick={() => {}}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={HelpCircle} label="Help Center" onClick={() => {}}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={AlertTriangle} label="Report a Bug" onClick={() => {}}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MODULE J: Legal
            ══════════════════════════════════════════ */}
        <div>
          <SectionHeader icon={FileText} title="Legal" />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', marginTop: 10 }}>
            <Row icon={FileText} label="Terms of Service" onClick={() => {}}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Lock} label="Privacy Policy" onClick={() => {}}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Users} label="Community Guidelines" onClick={() => {}}>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
            <Row icon={Globe} label="About Neutron">
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>v1.0.0</span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </Row>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            DANGER ZONE
            ══════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
          <button
            className="danger-btn" id="logout-btn"
            onClick={() => { if (onLogout) onLogout(); else navigate('welcome') }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: 14, borderRadius: 14, border: '1px solid rgba(255,107,107,0.3)',
              background: 'rgba(255,107,107,0.06)', color: '#ff6b6b',
              fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.06)'}
          >
            <LogOut size={16} /> Sign Out
          </button>
          <button
            className="delete-account-btn" id="delete-account-btn"
            style={{
              padding: 13, borderRadius: 14, border: 'none', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ff4757'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Delete Account
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', opacity: 0.6 }}>
          Neutron v1.0.0 · Made with ⚡ for the future
        </p>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, sub }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
      borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
      fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,210,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,210,255,0.2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'var(--glass-border)' }}
    >
      <Icon size={12} />
      <span style={{ fontWeight: 500 }}>{label}</span>
      {sub && <ExternalLink size={10} style={{ marginLeft: 2, opacity: 0.5 }} />}
    </div>
  )
}

function Heart(props) {
  return (
    <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
