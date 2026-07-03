const delay = (ms) => new Promise(r => setTimeout(r, ms))

// Mock user store
let users = []
let sessions = []
let otpStore = {}
let passwordResetTokens = {}

export async function loginUser(emailOrUsername, password) {
  await delay(800)
  const user = users.find(u => u.email === emailOrUsername || u.username === emailOrUsername)
  if (!user || user.password !== password) {
    throw new Error('Invalid credentials. Please check your email/username and password.')
  }
  if (!user.emailVerified) {
    throw new Error('EMAIL_NOT_VERIFIED')
  }
  const session = {
    id: `sess_${Date.now()}`,
    userId: user.id,
    deviceName: navigator.userAgent?.substring(0, 60) || 'Unknown Browser',
    os: navigator.platform || 'Unknown OS',
    location: 'San Francisco, CA',
    ip: '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
    lastActive: new Date().toISOString(),
    isCurrent: true,
    isTrusted: false,
  }
  sessions.push(session)
  return { user: { ...user, password: undefined }, session, requires2FA: user.twoFactorEnabled }
}

export async function registerUser(username, email, password) {
  await delay(1000)
  if (users.find(u => u.email === email)) throw new Error('An account with this email already exists.')
  if (users.find(u => u.username === username)) throw new Error('This username is already taken.')
  const user = {
    id: `user_${Date.now()}`,
    username,
    email,
    password,
    emailVerified: false,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    backupCodes: [],
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  return { user: { ...user, password: undefined } }
}

export async function sendOtp(email) {
  await delay(500)
  const code = String(Math.floor(100000 + Math.random() * 900000))
  otpStore[email] = { code, expiresAt: Date.now() + 300000, attempts: 0 }
  console.log(`[OTP] Verification code for ${email}: ${code}`)
  return { masked: email.replace(/(?<=^.|@).(?=.*@)/g, '*') }
}

export async function verifyOtp(email, code) {
  await delay(600)
  const record = otpStore[email]
  if (!record) throw new Error('No verification code found. Request a new one.')
  if (Date.now() > record.expiresAt) {
    delete otpStore[email]
    throw new Error('Verification code has expired. Request a new one.')
  }
  if (record.attempts >= 5) {
    delete otpStore[email]
    throw new Error('Too many incorrect attempts. Request a new code.')
  }
  if (record.code !== code) {
    record.attempts++
    throw new Error('Incorrect code. Please try again.')
  }
  delete otpStore[email]
  const user = users.find(u => u.email === email)
  if (user) user.emailVerified = true
  return { verified: true }
}

export async function verify2FA(userId, code) {
  await delay(700)
  const user = users.find(u => u.id === userId)
  if (!user) throw new Error('User not found.')
  if (code === '123456' || (user.backupCodes && user.backupCodes.includes(code))) {
    if (user.backupCodes?.includes(code)) {
      user.backupCodes = user.backupCodes.filter(c => c !== code)
    }
    return { verified: true }
  }
  throw new Error('Invalid verification code.')
}

export async function requestPasswordReset(email) {
  await delay(600)
  const user = users.find(u => u.email === email)
  if (!user) throw new Error('No account found with this email address.')
  const token = `reset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  passwordResetTokens[token] = { email, expiresAt: Date.now() + 900000, used: false }
  console.log(`[Password Reset] Token for ${email}: ${token}`)
  return { token, masked: email.replace(/(?<=^.|@).(?=.*@)/g, '*') }
}

export async function resetPassword(token, newPassword) {
  await delay(700)
  const record = passwordResetTokens[token]
  if (!record) throw new Error('Invalid or expired reset link.')
  if (record.used) throw new Error('This reset link has already been used.')
  if (Date.now() > record.expiresAt) throw new Error('Reset link has expired.')
  const user = users.find(u => u.email === record.email)
  if (!user) throw new Error('User not found.')
  user.password = newPassword
  record.used = true
  delete passwordResetTokens[token]
  return { success: true }
}

export async function enable2FA(userId) {
  await delay(500)
  const user = users.find(u => u.id === userId)
  if (!user) throw new Error('User not found.')
  const secret = 'JBSWY3DPEHPK3PXP'
  const backupCodes = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  )
  user.twoFactorEnabled = true
  user.twoFactorSecret = secret
  user.backupCodes = backupCodes
  return { secret, backupCodes, qrUrl: `otpauth://totp/Neutron:${user.email}?secret=${secret}&issuer=Neutron` }
}

export async function disable2FA(userId) {
  await delay(400)
  const user = users.find(u => u.id === userId)
  if (user) {
    user.twoFactorEnabled = false
    user.twoFactorSecret = null
    user.backupCodes = []
  }
  return { success: true }
}

export async function getSessions(userId) {
  await delay(300)
  return sessions.filter(s => s.userId === userId)
}

export async function revokeSession(sessionId) {
  await delay(400)
  sessions = sessions.filter(s => s.id !== sessionId)
  return { success: true }
}

export async function revokeAllOtherSessions(userId, currentSessionId) {
  await delay(600)
  sessions = sessions.filter(s => s.userId !== userId || s.id === currentSessionId)
  return { success: true }
}

export function getPasswordStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong']
  const colors = ['', '#ef4444', '#f59e0b', '#22c55e', '#00CFFF']
  return { score: Math.min(score, 4), label: labels[Math.min(score, 4)], color: colors[Math.min(score, 4)] }
}

export function maskEmail(email) {
  if (!email) return ''
  const [name, domain] = email.split('@')
  return name[0] + '*****' + name[name.length - 1] + '@' + domain
}
