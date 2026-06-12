import { useState, useEffect } from 'react'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
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
import './AuthPage.css'

const INTERESTS = ['Politics', 'AI', 'Startups', 'Science', 'Finance', 'Technology', 'Space', 'Economics', 'Business', 'World News']

// Reference the custom Firestore database where the pre-registration app stores registrations
const customDb = getFirestore(db.app, "ai-studio-1aca518a-d372-4f4b-bbdf-0d9f105ebd04");

export default function AuthPage({ initialMode = 'login', navigate }) {
  const [isFlipped, setIsFlipped] = useState(initialMode === 'signup')
  
  // Login Form States
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Signup Form States
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [showSignupPass, setShowSignupPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [signupStep, setSignupStep] = useState(1) // 1: Info, 2: Interests
  const [selectedInterests, setSelectedInterests] = useState([])
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupErrors, setSignupErrors] = useState({})
  const [signupServerError, setSignupServerError] = useState('')

  // Sync mode with flip state when initialMode changes
  useEffect(() => {
    setIsFlipped(initialMode === 'signup')
  }, [initialMode])

  // Handle mode switches with card flipping
  const switchToSignup = () => {
    setLoginError('')
    setIsFlipped(true)
    navigate('signup')
  }

  const switchToLogin = () => {
    setSignupServerError('')
    setSignupErrors({})
    setIsFlipped(false)
    setSignupStep(1)
    navigate('login')
  }

  // --- LOGIN LOGIC ---
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      // Successful login handled by auth listener
    } catch (err) {
      console.error('Login error:', err);
      // If user not found, attempt to import from pre-registration
      if (err.code === 'auth/user-not-found') {
        try {
          // Look up registration entry (check default db first, fallback to customDb)
          let q = query(collection(db, 'registrations'), where('email', '==', loginForm.email));
          let snap = await getDocs(q);
          if (snap.empty) {
            q = query(collection(customDb, 'registrations'), where('email', '==', loginForm.email));
            snap = await getDocs(q);
          }
          if (!snap.empty) {
            const regData = snap.docs[0].data();
            // Create Firebase auth user with stored password (assuming stored plaintext for demo)
            await createUserWithEmailAndPassword(auth, loginForm.email, regData.password || loginForm.password);
            // Update profile with stored username
            await updateProfile(auth.currentUser, { displayName: regData.username || '' });
            // Optionally copy user data to users collection (similar to seed listener)
            await setDoc(doc(db, 'users', auth.currentUser.uid), {
              username: regData.username || '',
              email: loginForm.email,
              interests: regData.interests || ['General'],
              reputation: 4.5,
              role: 'user',
              joinedAt: regData.createdAt || new Date().toISOString(),
            }, { merge: true });
          } else {
            setLoginError('Invalid email or password. Please try again.');
          }
        } catch (innerErr) {
          console.error('Pre-registration import error:', innerErr);
          setLoginError('Login failed. Please try again.');
        }
      } else {
        setLoginError('Invalid email or password. Please try again.');
      }
      setLoginLoading(false);
    }
  };

  // --- GUEST LOGIN LOGIC ---
  const handleGuestLogin = async () => {
    setLoginLoading(true)
    setSignupLoading(true)
    setLoginError('')
    setSignupServerError('')
    try {
      const userCredential = await signInAnonymously(auth)
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: `Guest_${Math.floor(Math.random() * 10000)}`,
          email: 'guest@neutron.app',
          interests: ['General'],
          reputation: 1.0,
          role: 'guest',
          joinedAt: new Date().toISOString()
        }, { merge: true })
      } catch (firestoreErr) {
        console.warn("Firestore guest sync bypassed (expected if database '(default)' is not created):", firestoreErr)
      }
    } catch (err) {
      setLoginError('Guest login failed: ' + err.message)
      setSignupServerError('Guest login failed: ' + err.message)
      setLoginLoading(false)
      setSignupLoading(false)
    }
  }

  // --- SIGNUP LOGIC ---
  const validateSignupStep1 = () => {
    const errs = {}
    if (!signupForm.username.trim()) errs.username = 'Username is required'
    if (signupForm.username.length > 0 && signupForm.username.length < 3) errs.username = 'Minimum 3 characters'
    if (!signupForm.email.includes('@')) errs.email = 'Valid email is required'
    if (signupForm.password.length < 8) errs.password = 'Password must be at least 8 chars'
    if (signupForm.password !== signupForm.confirm) errs.confirm = 'Passwords do not match'
    
    setSignupErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSignupNext = () => {
    if (validateSignupStep1()) {
      setSignupStep(2)
    }
  }

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
      // 1. Create firebase user credential
      const userCredential = await createUserWithEmailAndPassword(auth, signupForm.email, signupForm.password)
      const user = userCredential.user

      // 2. Set profile display name and send email verification
      await updateProfile(user, { displayName: signupForm.username })
      try {
        await sendEmailVerification(user)
      } catch (vErr) {
        console.warn("Verification email skip:", vErr)
      }

      // 3. Save interests in Firestore (wrapped in graceful offline fallback)
      try {
        await setDoc(doc(db, 'users', user.uid), {
          username: signupForm.username,
          email: signupForm.email,
          interests: selectedInterests,
          reputation: 4.5,
          joinedAt: new Date().toISOString()
        })
      } catch (firestoreErr) {
        console.warn("Firestore signup sync bypassed (expected if database is not created):", firestoreErr)
      }
    } catch (err) {
      console.error(err)
      setSignupServerError(err.message || 'Failed to register account. Please try again.')
      setSignupLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Dynamic Ambient Background Blobs */}
      <div className="auth-bg-orb orb-tl"/>
      <div className="auth-bg-orb orb-br"/>

      <div className="auth-3d-viewport">
        <div className={`auth-card ${isFlipped ? 'flipped' : ''}`}>
          
          {/* ======================================= */}
          {/*   FRONT FACE: LOGIN VIEW                */}
          {/* ======================================= */}
          <div className="auth-card-front">
            <div className="auth-header">
              <div className="auth-logo-row">
                <NeutronLogo size={24} animated={true} />
                <span className="neutron-brand" style={{ fontSize: '15px' }}>neutron</span>
              </div>
              <button 
                type="button" 
                className="icon-btn" 
                onClick={() => navigate('welcome')} 
                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                id="login-exit-btn"
              >
                <ArrowLeft size={14}/>
              </button>
            </div>

            <div className="auth-title-block">
              <h1>Welcome Back</h1>
              <p>Sign in to connect to the intelligence stream</p>
            </div>

            {loginError && <div className="error-banner">{loginError}</div>}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrap">
                  <input
                    className="glass-input"
                    type="email"
                    placeholder="name@example.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    id="login-email-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label>Password</label>
                  <span className="forgot-link" onClick={() => alert('Password reset link sent to your email!')}>
                    Forgot?
                  </span>
                </div>
                <div className="input-wrap">
                  <input
                    className="glass-input"
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="Your password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    id="login-password-input"
                  />
                  <button 
                    type="button" 
                    className="eye-btn" 
                    onClick={() => setShowLoginPass(!showLoginPass)}
                  >
                    {showLoginPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="glow-btn" 
                style={{ marginTop: '6px', padding: '14px' }}
                disabled={loginLoading}
                id="login-submit-btn"
              >
                {loginLoading ? <span className="loading-spinner"/> : 'Sign In →'}
              </button>
            </form>

            <div className="divider"><span>or continuation</span></div>

            <div className="social-buttons">
              <button 
                type="button" 
                className="guest-action-btn"
                onClick={handleGuestLogin}
                disabled={loginLoading}
                id="login-guest-btn"
              >
                👤 Continue as Guest / Demo
              </button>
            </div>

            <p className="auth-switch">
              New to Neutron? <span onClick={switchToSignup}>Create free account</span>
            </p>
          </div>

          {/* ======================================= */}
          {/*   BACK FACE: SIGNUP VIEW                */}
          {/* ======================================= */}
          <div className="auth-card-back">
            <div className="auth-header">
              <div className="auth-logo-row">
                <NeutronLogo size={24} animated={true} />
                <span className="neutron-brand" style={{ fontSize: '15px' }}>neutron</span>
              </div>
              <div className="step-dots">
                <span className={`dot ${signupStep >= 1 ? 'active' : ''}`}/>
                <span className={`dot ${signupStep >= 2 ? 'active' : ''}`}/>
              </div>
            </div>

            {signupStep === 1 ? (
              // Stage 1: Basic registration details
              <>
                <div className="auth-title-block">
                  <h1>Create Account</h1>
                  <p>Discuss the future. Join 2M+ minds</p>
                </div>

                {signupServerError && <div className="error-banner">{signupServerError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label>Username</label>
                    <div className="input-wrap">
                      <input
                        className={`glass-input ${signupErrors.username ? 'input-error' : ''}`}
                        placeholder="@username"
                        value={signupForm.username}
                        onChange={e => setSignupForm({ ...signupForm, username: e.target.value })}
                        id="signup-username-input"
                      />
                    </div>
                    {signupErrors.username && <span className="error-msg">{signupErrors.username}</span>}
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrap">
                      <input
                        className={`glass-input ${signupErrors.email ? 'input-error' : ''}`}
                        type="email"
                        placeholder="you@domain.com"
                        value={signupForm.email}
                        onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                        id="signup-email-input"
                      />
                    </div>
                    {signupErrors.email && <span className="error-msg">{signupErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-wrap">
                      <input
                        className={`glass-input ${signupErrors.password ? 'input-error' : ''}`}
                        type={showSignupPass ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={signupForm.password}
                        onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                        id="signup-password-input"
                      />
                      <button 
                        type="button" 
                        className="eye-btn" 
                        onClick={() => setShowSignupPass(!showSignupPass)}
                      >
                        {showSignupPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    {signupErrors.password && <span className="error-msg">{signupErrors.password}</span>}
                  </div>

                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="input-wrap">
                      <input
                        className={`glass-input ${signupErrors.confirm ? 'input-error' : ''}`}
                        type={showConfirmPass ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={signupForm.confirm}
                        onChange={e => setSignupForm({ ...signupForm, confirm: e.target.value })}
                        id="signup-confirm-input"
                      />
                      <button 
                        type="button" 
                        className="eye-btn" 
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                      >
                        {showConfirmPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    {signupErrors.confirm && <span className="error-msg">{signupErrors.confirm}</span>}
                  </div>

                  <button 
                    type="button" 
                    className="glow-btn" 
                    style={{ marginTop: '8px', padding: '14px' }}
                    onClick={handleSignupNext}
                    id="signup-continue-btn"
                  >
                    Continue →
                  </button>
                </div>

                <div className="divider"><span>or continuation</span></div>

                <button 
                  type="button" 
                  className="guest-action-btn"
                  onClick={handleGuestLogin}
                  id="signup-guest-btn"
                >
                  👤 Guest / Demo mode
                </button>

                <p className="auth-switch">
                  Already have an account? <span onClick={switchToLogin}>Sign In</span>
                </p>
              </>
            ) : (
              // Stage 2: Pick interests
              <>
                <div className="interests-title-block">
                  <h1>Your Interests</h1>
                  <p>Pick at least 3 topics to personalized your intelligence stream</p>
                </div>

                {signupServerError && <div className="error-banner">{signupServerError}</div>}

                <div className="interests-grid">
                  {INTERESTS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      className={`interest-chip ${selectedInterests.includes(interest) ? 'selected' : ''}`}
                      onClick={() => toggleInterest(interest)}
                      id={`interest-chip-${interest.toLowerCase()}`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
                    {selectedInterests.length} selected (minimum 3 required)
                  </p>

                  <button
                    type="button"
                    className="glow-btn"
                    onClick={handleSignupSubmit}
                    disabled={selectedInterests.length < 3 || signupLoading}
                    style={{ 
                      opacity: selectedInterests.length < 3 ? 0.4 : 1,
                      cursor: selectedInterests.length < 3 ? 'not-allowed' : 'pointer',
                      padding: '14px' 
                    }}
                    id="signup-submit-btn"
                  >
                    {signupLoading ? <span className="loading-spinner"/> : 'Create My Account ✓'}
                  </button>

                  <button 
                    type="button" 
                    className="secondary-btn" 
                    style={{ padding: '12px', fontSize: '14px' }}
                    onClick={() => setSignupStep(1)}
                    disabled={signupLoading}
                    id="signup-back-step-btn"
                  >
                    ← Back to Details
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
