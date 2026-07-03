import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Smartphone, Mail, Key, Copy, CheckCircle, ArrowLeft, Download } from 'lucide-react'
import { verify2FA } from '../../services/authService'

const METHODS = [
  { id: 'totp', label: 'Authenticator App', icon: Smartphone },
  { id: 'email', label: 'Email OTP', icon: Mail },
  { id: 'sms', label: 'SMS OTP', icon: Key },
]

export default function TwoFactorVerify({ onNavigate, params }) {
  const userId = params?.userId || 'user_unknown'
  const [method, setMethod] = useState('totp')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  const backupCodes = ['X7K9-M2P4', 'R3T8-W1Q6', 'B5N2-V8J1', 'L9D4-C6F7', 'H2G8-K3S5', 'A1P6-T9W3', 'M4R7-Z2X8', 'E6Q1-Y5B0', 'N3F9-C7V2', 'J8K4-L2T6']

  const handleVerify = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      await verify2FA(userId, code.trim())
      onNavigate('home', { verified: true })
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const copyBackupCodes = () => {
    navigator.clipboard?.writeText(backupCodes.join('\n'))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '20px' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(121,40,202,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: '480px',
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)',
          borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
          padding: '36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        <button onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', padding: 0 }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Shield size={36} color="#00D2FF" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Two-Factor Authentication</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Enter the verification code from your authenticator app</p>
        </div>

        {/* Method Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {METHODS.map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid ' + (method === m.id ? 'rgba(0,210,255,0.4)' : 'rgba(255,255,255,0.08)'),
                background: method === m.id ? 'rgba(0,210,255,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'center',
              }}
            >
              <m.icon size={18} color={method === m.id ? '#00D2FF' : '#6b7280'} style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: '10px', color: method === m.id ? '#00D2FF' : '#6b7280', fontWeight: 600 }}>{m.label}</div>
            </button>
          ))}
        </div>

        {method === 'totp' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ width: '120px', height: '120px', margin: '0 auto 12px', background: 'linear-gradient(135deg, #1a1a3e, #0d0d2b)', borderRadius: '12px', border: '1px solid rgba(0,210,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '10px', color: '#4b5563', textAlign: 'center', lineHeight: 1.4 }}>
                  <div style={{ width: '80px', height: '80px', margin: '0 auto', background: 'repeating-linear-gradient(0deg, #00D2FF22 0px, #00D2FF22 2px, transparent 2px, transparent 4px), repeating-linear-gradient(90deg, #00D2FF22 0px, #00D2FF22 2px, transparent 2px, transparent 4px)', borderRadius: '8px' }} />
                  <span style={{ color: '#00D2FF', fontSize: '8px', marginTop: '4px', display: 'block' }}>SCAN QR</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Scan with your authenticator app</p>
              <p style={{ margin: '4px 0 0', fontSize: '11px', fontFamily: 'monospace', color: '#4b5563', letterSpacing: '0.1em' }}>JBSWY3DPEHPK3PXP</p>
            </div>
          </div>
        )}

        {method === 'email' && (
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', textAlign: 'center' }}>
            A verification code has been sent to your registered email.
          </p>
        )}

        {method === 'sms' && (
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', textAlign: 'center' }}>
            A verification code has been sent to your registered phone number.
          </p>
        )}

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            autoComplete="one-time-code"
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e5e7eb', fontSize: '20px', fontFamily: 'monospace', textAlign: 'center', outline: 'none', letterSpacing: '8px', boxSizing: 'border-box' }}
            aria-label="Verification code"
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>
          <input type="checkbox" checked={trustDevice} onChange={e => setTrustDevice(e.target.checked)} style={{ accentColor: '#00D2FF', width: '16px', height: '16px' }} />
          Trust this device for 30 days
        </label>

        <button
          onClick={handleVerify}
          disabled={code.length !== 6 || loading}
          style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: code.length !== 6 || loading ? 'rgba(0,210,255,0.3)' : 'linear-gradient(135deg, #00D2FF, #7928CA)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', marginBottom: '16px' }}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        {/* Backup Codes */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
          <button onClick={() => setShowBackupCodes(!showBackupCodes)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', textAlign: 'left', padding: 0 }}>
            <Key size={14} /> {showBackupCodes ? 'Hide' : 'Use'} Recovery Codes
          </button>
          <AnimatePresence>
            {showBackupCodes && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '10px 0 8px' }}>Use one of these 10 single-use backup codes to sign in:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                  {backupCodes.map(c => (
                    <div key={c} style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af', textAlign: 'center', letterSpacing: '0.1em' }}>
                      {c}
                    </div>
                  ))}
                </div>
                <button onClick={copyBackupCodes} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Copy size={13} /> Copy Codes
                </button>
                <button onClick={() => { const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'neutron-backup-codes.txt'; a.click() }} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                  <Download size={13} /> Download
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
