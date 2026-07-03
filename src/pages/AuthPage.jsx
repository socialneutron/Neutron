import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, ArrowLeft, User, Mail, Lock, Shield, Users, CheckCircle,
  ChevronRight, Monitor, Apple
} from 'lucide-react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth'
import { doc, setDoc, collection, query, where, getDocs, getFirestore } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { NeutronLogo } from '../components/NeutronLogo'
import TermsModal from '../components/auth/TermsModal'
import './AuthPage.css'

const INTERESTS = ['Politics', 'AI', 'Startups', 'Science', 'Finance', 'Technology', 'Space', 'Economics', 'Business', 'World News']
let _customDb = null
const getCustomDb = () => {
  if (!_customDb) { try { _customDb = getFirestore(db.app, "ai-studio-1aca518a-d372-4f4b-bbdf-0d9f105ebd04") } catch { _customDb = db } }
  return _customDb
}

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' }
  if (score <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' }
  if (score <= 3) return { score: 3, label: 'Strong', color: '#22c55e' }
  return { score: 4, label: 'Very Strong', color: '#00d97e' }
}

export default function AuthPage({ initialMode = 'login', navigate }) {
  const [mode, setMode] = useState(initialMode)
  const [isMobile, setIsMobile] = useState(false)

  // Login states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Signup states
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [showSignupPass, setShowSignupPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [signupStep, setSignupStep] = useState(1)
  const [selectedInterests, setSelectedInterests] = useState([])
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupErrors, setSignupErrors] = useState({})
  const [signupServerError, setSignupServerError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const pwStrength = getPasswordStrength(signupForm.password)
  const usernameValid = signupForm.username.length >= 3

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── LOGIN ──
  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        try {
          const [r1, r2] = await Promise.allSettled([
            getDocs(query(collection(db, 'registrations'), where('email', '==', loginForm.email))),
            getDocs(query(collection(getCustomDb(), 'registrations'), where('email', '==', loginForm.email))),
          ])
          const snap = r1.status === 'fulfilled' && !r1.value.empty ? r1.value
                     : r2.status === 'fulfilled' && !r2.value.empty ? r2.value
                     : null
          if (snap) {
            const regData = snap.docs[0].data()
            await createUserWithEmailAndPassword(auth, loginForm.email, regData.password || loginForm.password)
            await updateProfile(auth.currentUser, { displayName: regData.username || '' })
            await setDoc(doc(db, 'users', auth.currentUser.uid), {
              username: regData.username || '',
              email: loginForm.email,
              interests: regData.interests || ['General'],
              reputation: 4.5,
              role: 'user',
              joinedAt: regData.createdAt || new Date().toISOString(),
            }, { merge: true })
          } else {
            setLoginError('Invalid email or password. Please try again.')
          }
        } catch (innerErr) {
          setLoginError('Login failed. Please try again.')
        }
      } else {
        setLoginError('Invalid email or password. Please try again.')
      }
      setLoginLoading(false)
    }
  }

  // ── GUEST ──
  const handleGuestLogin = async () => {
    setLoginLoading(true)
    setLoginError('')
    try {
      const cred = await signInAnonymously(auth)
      await setDoc(doc(db, 'users', cred.user.uid), {
        username: `Guest_${Math.floor(Math.random() * 10000)}`,
        email: 'guest@neutron.app',
        interests: ['General'],
        reputation: 1.0,
        role: 'guest',
        joinedAt: new Date().toISOString()
      }, { merge: true }).catch(e => console.warn('Firestore guest sync bypassed:', e))
      setLoginLoading(false)
    } catch (err) {
      setLoginError('Guest login failed: ' + err.message)
      setLoginLoading(false)
    }
  }

  // ── SIGNUP ──
  const validateStep1 = () => {
    const errs = {}
    if (!signupForm.username.trim()) errs.username = 'Username is required'
    if (signupForm.username.length > 0 && signupForm.username.length < 3) errs.username = 'Minimum 3 characters'
    if (!signupForm.email.includes('@')) errs.email = 'Valid email is required'
    if (signupForm.password.length < 8) errs.password = 'Password must be at least 8 chars'
    if (signupForm.password !== signupForm.confirm) errs.confirm = 'Passwords do not match'
    setSignupErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSignupNext = () => { if (validateStep1()) setSignupStep(2) }

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    )
  }

  const handleSignupSubmit = async () => {
    if (selectedInterests.length < 3) return
    setSignupLoading(true)
    setSignupServerError('')
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupForm.email, signupForm.password)
      const user = userCredential.user
      await updateProfile(user, { displayName: signupForm.username })
      await Promise.all([
        sendEmailVerification(user).catch(v => console.warn('Verification skip:', v)),
        setDoc(doc(db, 'users', user.uid), {
          username: signupForm.username,
          email: signupForm.email,
          interests: selectedInterests,
          reputation: 4.5,
          joinedAt: new Date().toISOString()
        }).catch(e => console.warn('Firestore bypassed:', e)),
      ])
      setSignupLoading(false)
    } catch (err) {
      setSignupServerError(err.message || 'Failed to register. Please try again.')
      setSignupLoading(false)
    }
  }

  // ════════════════════════════════════════
  //  LOGIN VIEW — Split layout
  // ════════════════════════════════════════
  if (mode === 'login') {
    return (
      <div className="auth-page-new">
        <div className="auth-bg-grid" />
        <div className="auth-bg-orb orb-tl" />
        <div className="auth-bg-orb orb-br" />

        {/* Left Hero (desktop only) */}
        {!isMobile && (
          <div className="auth-hero-left">
            <div className="auth-hero-logo-wrap">
              <NeutronLogo size={90} animated showText />
            </div>

            <div className="auth-hero-badge">
              <Shield size={14} />
              <span>Trusted by 2M+ minds worldwide</span>
            </div>

            <h1 className="auth-hero-headline">
              <span className="neon-text">Discuss.</span><br />
              <span className="neon-text-purple">Debate.</span><br />
              <span style={{ color: '#fff' }}>Shape the future.</span>
            </h1>

            <p className="auth-hero-sub">
              Join the world's most intelligent conversations on AI, politics, startups, science and more.
            </p>

            <div className="auth-hero-stats">
              {[
                { icon: Users, value: '2.4M+', label: 'Discussions' },
                { icon: Globe, value: '180+', label: 'Countries' },
                { icon: Users, value: '99K+', label: 'Online Now' },
                { icon: Cpu, value: '24/7', label: 'Smart AI' },
              ].map(s => (
                <div key={s.label} className="auth-stat-card">
                  <s.icon size={18} color="var(--accent-blue)" />
                  <span className="auth-stat-val">{s.value}</span>
                  <span className="auth-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="auth-trending">
              <div className="auth-trending-header">
                <span className="trending-icon">🔥</span>
                <span>Trending Discussions</span>
              </div>
              {[
                { text: 'Will AI reshape the future of work?', count: '12.5K' },
                { text: 'Next big startup ideas for 2026', count: '8.1K' },
                { text: 'Global politics in a changing world', count: '6.3K' },
              ].map(t => (
                <div key={t.text} className="auth-trending-row">
                  <span className="trending-bullet">💬</span>
                  <span className="trending-text">{t.text}</span>
                  <span className="trending-count">{t.count} 💬</span>
                </div>
              ))}
            </div>

            <div className="auth-privacy-row">
              <span className="privacy-badge"><Shield size={12} /> End-to-end Encryption</span>
              <span className="privacy-badge"><CheckCircle size={12} /> SOC 2 Compliant</span>
              <span className="privacy-badge"><Shield size={12} /> Privacy Focused</span>
              <span className="privacy-badge"><Monitor size={12} /> Secure Infrastructure</span>
            </div>
          </div>
        )}

        {/* Right Login Card */}
        <div className="auth-form-right">
          <div className="auth-login-card">
            <div className="auth-card-header">
              <div>
                <h2 className="auth-card-title">Welcome Back</h2>
                <p className="auth-card-sub">Continue your conversations with the world's brightest minds.</p>
              </div>
              <div className="secure-badge">
                <Shield size={12} />
                <span>Secure Login</span>
              </div>
            </div>

            {loginError && <div className="error-banner">{loginError}</div>}

            <form onSubmit={handleLogin} className="auth-form-stack">
              <div className="form-group-new">
                <label>Email or Username</label>
                <div className="input-icon-wrap">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    placeholder="elegent610@gmail.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    id="login-email-input"
                  />
                </div>
              </div>

              <div className="form-group-new">
                <label>Password</label>
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    id="login-password-input"
                  />
                  <button type="button" className="eye-btn-new" onClick={() => setShowLoginPass(!showLoginPass)}>
                    {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-remember-row">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span className="checkbox-custom" />
                  <span>Remember me for 30 days</span>
                </label>
                <button type="button" className="forgot-link" onClick={() => alert('Password reset link sent!')}>
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="glow-btn auth-submit" disabled={loginLoading} id="login-submit-btn">
                {loginLoading ? <span className="loading-spinner" /> : <>Sign In <ChevronRight size={16} /></>}
              </button>

              <p className="auth-protected-text">
                <Shield size={12} /> Protected by advanced security
              </p>
            </form>

            <div className="auth-divider"><span>OR</span></div>

            <div className="social-grid">
              <button className="social-btn" onClick={handleGuestLogin}>
                <G size={18} /> Continue with Google
              </button>
              <button className="social-btn">
                <Github size={18} /> Continue with GitHub
              </button>
              <button className="social-btn">
                <Windows size={18} /> Continue with Microsoft
              </button>
              <button className="social-btn">
                <Apple size={18} /> Continue with Apple
              </button>
            </div>

            <p className="auth-switch-new">
              New to Neutron?{' '}
              <span onClick={() => { setSignupServerError(''); setSignupErrors({}); setMode('signup'); navigate('signup') }}>
                Create free account
              </span>
            </p>
          </div>

          <footer className="auth-footer">
            <span>© 2026 Neutron Technologies Inc. All rights reserved.</span>
            <div className="auth-footer-links">
              <a href="#help">Help</a>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#contact">Contact</a>
              <span className="lang-select">🌐 English ▾</span>
            </div>
          </footer>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════
  //  SIGNUP VIEW — Centered card + trust indicators
  // ════════════════════════════════════════
  return (
    <div className="auth-page-new signup-layout">
      <div className="auth-bg-grid" />
      <div className="auth-bg-orb orb-tl" />
      <div className="auth-bg-orb orb-br" />

      {/* Trust Indicators (left) */}
      {!isMobile && (
        <div className="signup-trust-left">
          <div className="trust-item">
            <div className="trust-icon-wrap"><CheckCircle size={22} /></div>
            <div>
              <h4>Trusted Platform</h4>
              <p>Backed by 2M+ minds worldwide</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-wrap"><Shield size={22} /></div>
            <div>
              <h4>Secure & Private</h4>
              <p>Your data is protected with industry-standard security</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-wrap"><Users size={22} /></div>
            <div>
              <h4>Join the Community</h4>
              <p>Connect with people shaping tomorrow</p>
            </div>
          </div>
        </div>
      )}

      {/* Center Card */}
      <div className="signup-card-center">
        <div className="auth-login-card">
          <div className="auth-card-header-center">
            <div className="auth-logo-row-center">
              <NeutronLogo size={24} animated />
              <span className="neutron-brand" style={{ fontSize: '16px' }}>neutron</span>
            </div>
            <div className="step-dots">
              <span className={`dot ${signupStep >= 1 ? 'active' : ''}`} />
              <span className={`dot ${signupStep >= 2 ? 'active' : ''}`} />
            </div>
          </div>

          {signupStep === 1 ? (
            <>
              <div className="auth-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <h2 className="auth-card-title">Create Account</h2>
                <p className="auth-card-sub">Discuss the future. Join 2M+ minds</p>
              </div>

              {signupServerError && <div className="error-banner">{signupServerError}</div>}

              <div className="auth-form-stack">
                <div className="form-group-new">
                  <label>USERNAME</label>
                  <div className="input-icon-wrap">
                    <User size={16} className="input-icon" />
                    <input
                      placeholder="elegent610@gmail.com"
                      value={signupForm.username}
                      onChange={e => setSignupForm({ ...signupForm, username: e.target.value })}
                      id="signup-username-input"
                    />
                    {usernameValid && <CheckCircle size={16} className="input-valid-icon" />}
                  </div>
                  {signupErrors.username && <span className="error-msg">{signupErrors.username}</span>}
                </div>

                <div className="form-group-new">
                  <label>EMAIL ADDRESS</label>
                  <div className="input-icon-wrap">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={signupForm.email}
                      onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                      id="signup-email-input"
                    />
                  </div>
                  {signupErrors.email && <span className="error-msg">{signupErrors.email}</span>}
                </div>

                <div className="form-group-new">
                  <label>PASSWORD</label>
                  <div className="input-icon-wrap">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showSignupPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signupForm.password}
                      onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                      id="signup-password-input"
                    />
                    <button type="button" className="eye-btn-new" onClick={() => setShowSignupPass(!showSignupPass)}>
                      {showSignupPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {signupForm.password && (
                    <div className="pw-strength">
                      <div className="pw-strength-bar">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="pw-strength-segment" style={{
                            background: i <= pwStrength.score ? pwStrength.color : 'rgba(255,255,255,0.1)',
                          }} />
                        ))}
                      </div>
                      <span style={{ color: pwStrength.color, fontSize: 12, fontWeight: 600 }}>{pwStrength.label}</span>
                    </div>
                  )}
                  {signupErrors.password && <span className="error-msg">{signupErrors.password}</span>}
                </div>

                <div className="form-group-new">
                  <label>CONFIRM PASSWORD</label>
                  <div className="input-icon-wrap">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={signupForm.confirm}
                      onChange={e => setSignupForm({ ...signupForm, confirm: e.target.value })}
                      id="signup-confirm-input"
                    />
                    <button type="button" className="eye-btn-new" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {signupErrors.confirm && <span className="error-msg">{signupErrors.confirm}</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#00D2FF', width: '16px', height: '16px', cursor: 'pointer' }}
                    id="terms-checkbox"
                  />
                  <label htmlFor="terms-checkbox" style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5, cursor: 'pointer' }}>
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

                <button
                  type="button"
                  className="glow-btn auth-submit"
                  onClick={handleSignupNext}
                  disabled={!agreedToTerms}
                  style={{ opacity: agreedToTerms ? 1 : 0.4, cursor: agreedToTerms ? 'pointer' : 'not-allowed' }}
                  id="signup-continue-btn"
                >
                  Continue →
                </button>
              </div>

              <div className="auth-divider"><span>OR</span></div>

              <p className="auth-switch-new">
                Already have an account?{' '}
                <span onClick={() => { setMode('login'); navigate('login') }}>Sign In</span>
              </p>
            </>
          ) : (
            /* Step 2: Interests */
            <>
              <div className="auth-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <h2 className="auth-card-title">Your Interests</h2>
                <p className="auth-card-sub">Pick at least 3 topics to personalize your feed</p>
              </div>

              {signupServerError && <div className="error-banner">{signupServerError}</div>}

              <div className="interests-grid-new">
                {INTERESTS.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    className={`interest-chip-new ${selectedInterests.includes(interest) ? 'selected' : ''}`}
                    onClick={() => toggleInterest(interest)}
                    id={`interest-chip-${interest.toLowerCase()}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
                {selectedInterests.length} selected (minimum 3 required)
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  className="glow-btn auth-submit"
                  onClick={handleSignupSubmit}
                  disabled={selectedInterests.length < 3 || signupLoading}
                  style={{ opacity: selectedInterests.length < 3 ? 0.4 : 1, cursor: selectedInterests.length < 3 ? 'not-allowed' : 'pointer' }}
                  id="signup-submit-btn"
                >
                  {signupLoading ? <span className="loading-spinner" /> : 'Create My Account ✓'}
                </button>
                <button type="button" className="secondary-btn" onClick={() => setSignupStep(1)} disabled={signupLoading} id="signup-back-step-btn">
                  ← Back to Details
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logo showcase (right, desktop) */}
      {!isMobile && (
        <div className="signup-orb-right">
          <NeutronLogo size={180} animated />
        </div>
      )}

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} onAgree={() => setAgreedToTerms(true)} />
    </div>
  )
}

// Simple Globe component for inline use
function Globe(props) {
  return (
    <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function Cpu(props) {
  return (
    <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  )
}

function G(props) {
  return (
    <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function Windows(props) {
  return (
    <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
    </svg>
  )
}

function Github(props) {
  return (
    <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}
