import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ArrowLeft, Mail, CheckCircle, Clock } from 'lucide-react'
import { sendOtp, verifyOtp, maskEmail } from '../../services/authService'

export default function VerifyOtp({ onNavigate, params }) {
  const email = params?.email || ''
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [masked, setMasked] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputsRef = useRef([])

  useEffect(() => {
    if (email) sendOtpCode()
  }, [])

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return }
    const iv = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(iv)
  }, [timer])

  const sendOtpCode = async () => {
    try {
      const result = await sendOtp(email)
      setMasked(result.masked)
      setTimer(60)
      setCanResend(false)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
    if (newCode.every(c => c !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    pasted.split('').forEach((char, i) => { if (i < 6) newCode[i] = char })
    setCode(newCode)
    if (pasted.length === 6) {
      handleVerify(pasted)
    } else {
      inputsRef.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  const handleVerify = async (otp) => {
    setLoading(true)
    setError('')
    try {
      await verifyOtp(email, otp)
      setSuccess(true)
      setTimeout(() => onNavigate('login', { verified: true }), 1500)
    } catch (err) {
      setError(err.message)
      setCode(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
          <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>Email Verified!</h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Redirecting to sign in...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '20px' }}>
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(0,210,255,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: '420px',
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)',
          borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
          padding: '36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        <button onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', padding: 0 }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Mail size={32} color="#00D2FF" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Verify Your Email</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            We sent a 6-digit code to <strong style={{ color: '#e5e7eb' }}>{maskEmail(email)}</strong>
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }} onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => inputsRef.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoFocus={i === 0}
              aria-label={`Digit ${i + 1}`}
              style={{
                width: '52px', height: '58px', textAlign: 'center', fontSize: '22px', fontWeight: 700,
                background: digit ? 'rgba(0,210,255,0.1)' : 'rgba(0,0,0,0.3)',
                border: '2px solid ' + (digit ? 'rgba(0,210,255,0.4)' : 'rgba(255,255,255,0.1)'),
                borderRadius: '12px', color: '#fff', outline: 'none',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => handleVerify(code.join(''))}
          disabled={code.some(c => !c) || loading}
          style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: code.some(c => !c) || loading ? 'rgba(0,210,255,0.3)' : 'linear-gradient(135deg, #00D2FF, #7928CA)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', marginBottom: '16px' }}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={sendOtpCode}
            disabled={!canResend}
            style={{ background: 'none', border: 'none', color: canResend ? '#00D2FF' : '#4b5563', fontSize: '13px', fontWeight: 600, cursor: canResend ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Clock size={13} />
            {canResend ? 'Resend Code' : `Resend in ${timer}s`}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
