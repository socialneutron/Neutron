import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Shield, Mail, User, Lock, Check, X, ArrowLeft } from 'lucide-react'
import { registerUser, getPasswordStrength } from '../../services/authService'
import TermsModal from './TermsModal'

const strengthChecks = [
  { key: 'length8', label: 'At least 8 characters' },
  { key: 'length12', label: 'At least 12 characters' },
  { key: 'upper', label: 'One uppercase letter' },
  { key: 'lower', label: 'One lowercase letter' },
  { key: 'number', label: 'One number' },
  { key: 'special', label: 'One special character' },
]

export default function RegisterCard({ onNavigate, onSuccess }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const strength = getPasswordStrength(password)
  const passwordsMatch = confirm === '' || password === confirm
  const allChecks = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]

  const handleUsernameChange = (e) => {
    const val = e.target.value
    if (/@/.test(val)) {
      setUsernameError('Username cannot contain @ symbol')
    } else {
      setUsernameError('')
    }
    if (/^[a-zA-Z0-9_]*$/.test(val) || val === '') {
      setUsername(val)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !email.trim() || !password || !passwordsMatch || usernameError) return
    setLoading(true)
    setError('')
    try {
      const result = await registerUser(username.trim(), email.trim(), password)
      onNavigate('verify', { email: email.trim() })
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '20px' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'rgba(121,40,202,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(0,210,255,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          width: '100%', maxWidth: '480px',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        <button onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', padding: 0 }}>
          <ArrowLeft size={14} /> Back to Sign In
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>Create Account</div>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Join the future of intelligent discussion</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }} htmlFor="reg-username">
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="your_username"
                autoComplete="username"
                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid ' + (usernameError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'), borderRadius: '10px', color: '#e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                aria-label="Username"
                required
              />
            </div>
            {usernameError && <div style={{ marginTop: '4px', fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={11} /> {usernameError}</div>}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }} htmlFor="reg-email">
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                aria-label="Email address"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }} htmlFor="reg-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                style={{ width: '100%', padding: '12px 44px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                aria-label="Password"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 0 }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '8px' }}>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: (strength.score / 4) * 100 + '%' }} transition={{ duration: 0.4 }} style={{ height: '100%', background: strength.color, borderRadius: '99px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: strength.color, fontWeight: 600 }}>Password Strength: {strength.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {strengthChecks.map((check, i) => (
                    <div key={check.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0' }}>
                      {allChecks[i] ? <Check size={11} color="#22c55e" /> : <X size={11} color="#6b7280" />}
                      <span style={{ fontSize: '11px', color: allChecks[i] ? '#9ca3af' : '#6b7280' }}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }} htmlFor="reg-confirm">
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
              <input
                id="reg-confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid ' + (confirm && !passwordsMatch ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'), borderRadius: '10px', color: '#e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                aria-label="Confirm password"
                required
              />
            </div>
            {confirm && !passwordsMatch && <div style={{ marginTop: '4px', fontSize: '11px', color: '#ef4444' }}>Passwords do not match</div>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#00D2FF', width: '16px', height: '16px', cursor: 'pointer' }}
                id="reg-terms-checkbox"
              />
              <label htmlFor="reg-terms-checkbox" style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5, cursor: 'pointer' }}>
                I have read and agree to the{' '}
                <span
                  onClick={(e) => { e.preventDefault(); setShowTerms(true) }}
                  style={{ color: '#00D2FF', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Terms & Conditions
                </span>
                {' '}and{' '}
                <span style={{ color: '#00D2FF', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                  Privacy Policy
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || !email.trim() || !password || !passwordsMatch || loading || !!usernameError || !agreedToTerms}
            style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: !username.trim() || !email.trim() || !password || !passwordsMatch || loading || !agreedToTerms ? 'rgba(0,210,255,0.3)' : 'linear-gradient(135deg, #00D2FF, #7928CA)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: loading || !agreedToTerms ? 'default' : 'pointer' }}
            aria-label="Create account"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', marginTop: '20px', marginBottom: 0 }}>
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: '#00D2FF', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '13px' }}>
            Sign In
          </button>
        </p>
      </motion.div>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} onAgree={() => setAgreedToTerms(true)} />
    </div>
  )
}
