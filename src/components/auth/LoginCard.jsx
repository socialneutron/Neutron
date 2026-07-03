import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Shield, Mail, Lock, TrendingUp, Globe, MessageCircle } from 'lucide-react'
import { loginUser } from '../../services/authService'

const METRICS = [
  { value: '2.4M+', label: 'Discussions' },
  { value: '180+', label: 'Countries' },
  { value: '99K', label: 'Online Now' },
  { value: '4.9★', label: 'Avg Rating' },
]

const TRENDING = [
  { tag: '#AGI2025', posts: '14.2K', color: '#00d2ff' },
  { tag: '#USElection', posts: '8.7K', color: '#a855f7' },
  { tag: '#MarsBase', posts: '3.4K', color: '#22c55e' },
]

const TRUST_BADGES = ['SOC 2', 'GDPR', 'ISO 27001', 'CCPA']

const OAUTH_PROVIDERS = [
  { id: 'google', label: 'Google', icon: 'G', color: '#fff', bg: 'rgba(255,255,255,0.06)' },
  { id: 'github', label: 'GitHub', icon: 'GH', color: '#fff', bg: 'rgba(255,255,255,0.06)' },
  { id: 'microsoft', label: 'Microsoft', icon: 'M', color: '#fff', bg: 'rgba(255,255,255,0.06)' },
  { id: 'apple', label: 'Apple', icon: '⌂', color: '#fff', bg: 'rgba(255,255,255,0.06)' },
]

export default function LoginCard({ onNavigate, onSuccess }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleKeyDown = (e) => setCapsLock(e.getModifierState('CapsLock'))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!identifier.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const result = await loginUser(identifier.trim(), password)
      if (result.requires2FA) {
        onNavigate('2fa', { userId: result.user.id })
      } else {
        onSuccess(result.user)
      }
    } catch (err) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        onNavigate('verify', { email: identifier.includes('@') ? identifier : '' })
      } else {
        setError(err.message)
      }
    }
    setLoading(false)
  }

  const handleOAuth = (provider) => {
    console.log(`[OAuth] ${provider} login clicked`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-15%', left: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(0,210,255,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(121,40,202,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Left Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', maxWidth: '520px' }}>
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <button onClick={() => onNavigate('landing')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px', padding: 0 }}>
            ← Back
          </button>
          <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#fff', lineHeight: 1.15, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Discuss. <span style={{ background: 'linear-gradient(135deg, #00D2FF, #7928CA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Debate.</span> Shape the future.
          </h1>
          <p style={{ fontSize: '15px', color: '#6b7280', margin: '0 0 36px', maxWidth: '380px' }}>
            Join millions discussing the ideas that define tomorrow.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {METRICS.map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg, #00D2FF, #7928CA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{m.value}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>{m.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <TrendingUp size={13} color="#00D2FF" />
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trending Discussions</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {TRENDING.map(t => (
              <span key={t.tag} style={{ padding: '5px 12px', borderRadius: '99px', background: t.color + '12', border: '1px solid ' + t.color + '25', fontSize: '12px', color: t.color, fontWeight: 600 }}>
                {t.tag} <span style={{ fontSize: '10px', opacity: 0.6 }}>{t.posts}</span>
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Shield size={14} color="#4b5563" />
            <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trusted Infrastructure</span>
            {TRUST_BADGES.map(b => (
              <span key={b} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '9px', color: '#4b5563', fontWeight: 700, fontFamily: 'monospace' }}>
                {b}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Column - Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            width: '100%', maxWidth: '420px',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '36px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>Welcome Back</div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Sign in to continue to Neutron</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10, x: -10 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0 }} style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={14} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }} htmlFor="login-identifier">
                Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username"
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  aria-label="Email or Username"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }} htmlFor="login-password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyDown}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ width: '100%', padding: '12px 44px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  aria-label="Password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 0 }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {capsLock && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={11} /> Caps Lock is on
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#9ca3af' }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: '#00D2FF', width: '16px', height: '16px' }} />
                Remember me for 30 days
              </label>
              <button type="button" onClick={() => onNavigate('forgot-password')} style={{ background: 'none', border: 'none', color: '#00D2FF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={!identifier.trim() || !password || loading}
              style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: !identifier.trim() || !password || loading ? 'rgba(0,210,255,0.3)' : 'linear-gradient(135deg, #00D2FF, #7928CA)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', marginBottom: '20px' }}
              aria-label="Sign in"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ position: 'relative', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            <span style={{ position: 'relative', top: '-10px', background: '#0d1117', padding: '0 12px', fontSize: '12px', color: '#4b5563' }}>or continue with</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {OAUTH_PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => handleOAuth(p.id)}
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: p.bg, color: p.color, cursor: 'pointer', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}
                aria-label={`Sign in with ${p.label}`}
              >
                {p.icon}
              </button>
            ))}
          </div>

          <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', marginTop: '20px', marginBottom: 0 }}>
            Don't have an account?{' '}
            <button onClick={() => onNavigate('signup')} style={{ background: 'none', border: 'none', color: '#00D2FF', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '13px' }}>
              Sign Up
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
