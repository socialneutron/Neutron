import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Shield, CheckCircle } from 'lucide-react'
import { requestPasswordReset, maskEmail } from '../../services/authService'

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Check Your Email</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px' }}>
            We sent a password reset link to <strong style={{ color: '#e5e7eb' }}>{maskEmail(email)}</strong>. The link expires in 15 minutes.
          </p>
          <button onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: '#00D2FF', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            Back to Sign In
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '20px' }}>
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(0,210,255,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <button onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', padding: 0 }}>
          <ArrowLeft size={14} /> Back to Sign In
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Shield size={36} color="#00D2FF" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Reset Your Password</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Enter your email and we'll send you a reset link</p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }} htmlFor="forgot-email">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none' }} />
              <input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} required />
            </div>
          </div>

          <button type="submit" disabled={!email.trim() || loading} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: !email.trim() || loading ? 'rgba(0,210,255,0.3)' : 'linear-gradient(135deg, #00D2FF, #7928CA)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
