import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Lock, Shield, CheckCircle, ArrowLeft } from 'lucide-react'
import { resetPassword, getPasswordStrength } from '../../services/authService'

export default function ResetPassword({ onNavigate, params }) {
  const token = params?.token || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const strength = getPasswordStrength(password)
  const passwordsMatch = confirm === '' || password === confirm

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || !passwordsMatch) return
    setLoading(true)
    setError('')
    try {
      await resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Password Reset Successful!</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px' }}>Your password has been updated. You can now sign in with your new password.</p>
          <button onClick={() => onNavigate('login')} style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #00D2FF, #7928CA)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            Sign In
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '20px' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(121,40,202,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <button onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', padding: 0 }}>
          <ArrowLeft size={14} /> Back to Sign In
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Lock size={36} color="#00D2FF" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Create New Password</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Your new password must be different from previous ones</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }} htmlFor="reset-password">New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
              <input id="reset-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password" autoComplete="new-password" style={{ width: '100%', padding: '12px 44px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 0 }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginBottom: '4px' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: (strength.score / 4) * 100 + '%' }} transition={{ duration: 0.4 }} style={{ height: '100%', background: strength.color, borderRadius: '99px' }} />
                </div>
                <span style={{ fontSize: '11px', color: strength.color, fontWeight: 600 }}>Password Strength: {strength.label}</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }} htmlFor="reset-confirm">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
              <input id="reset-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid ' + (confirm && !passwordsMatch ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'), borderRadius: '10px', color: '#e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} required />
            </div>
            {confirm && !passwordsMatch && <div style={{ marginTop: '4px', fontSize: '11px', color: '#ef4444' }}>Passwords do not match</div>}
          </div>

          <button type="submit" disabled={!password || !passwordsMatch || loading} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: !password || !passwordsMatch || loading ? 'rgba(0,210,255,0.3)' : 'linear-gradient(135deg, #00D2FF, #7928CA)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
