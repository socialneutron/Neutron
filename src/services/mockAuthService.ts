import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'

const LS_SESSION_KEY = 'neutron_session'

function generateId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function generateToken(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ iat: Date.now(), exp: Date.now() + 86400000, jti: generateId() }))
  return `${header}.${payload}.mock-signature`
}

export interface AuthResult {
  error?: string
  requires2FA?: boolean
  userId?: string
  email?: string
}

export interface AuthSession {
  userId: string
  token: string
  expiresAt: string
  mfaVerified: boolean
}

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    username: string
    display_name: string
    avatar_url: string
  }
  app_metadata: {}
  aud: string
  created_at: string
}

export const mockAuthService = {
  async signup(email: string, password: string, username: string, interests?: string[]): Promise<AuthResult> {
    const { data: existing } = await supabase.from('users').select('id').eq('username', username).maybeSingle()
    if (existing) return { error: 'Username already taken' }

    const { data: emailExist } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
    if (emailExist) return { error: 'Email already registered' }

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = generateId()

    await supabase.from('users').insert({
      id: userId,
      username,
      display_name: username,
      email,
      avatar_url: '',
      banner_url: '',
      bio: '',
      website: '',
      location: '',
      is_verified: false,
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      password_hash: passwordHash,
      two_factor_enabled: false,
      two_factor_hash: null,
      two_factor_expires_at: null,
      two_factor_attempts: 0,
      auth_provider: 'email',
      last_login: new Date().toISOString(),
      status: 'active',
    })

    if (interests && interests.length > 0) {
      for (const category of interests) {
        await supabase.from('user_interests').insert({
          user_id: userId,
          category,
          score: 0.8,
        })
      }
    }

    const token = generateToken()
    const expiresAt = new Date(Date.now() + 86400000).toISOString()
    await supabase.from('sessions').insert({
      id: generateId(),
      user_id: userId,
      token,
      device: navigator.userAgent,
      ip: 'local',
      expires_at: expiresAt,
    })

    const session: AuthSession = { userId, token, expiresAt, mfaVerified: true }
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session))

    return { userId, email }
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single()
    if (!user) return { error: 'Invalid email or password' }
    if (user.status === 'locked') return { error: 'Account is locked. Try again later.' }

    const valid = await bcrypt.compare(password, user.password_hash || '')
    if (!valid) return { error: 'Invalid email or password' }

    if (user.two_factor_enabled) {
      const otp = generateOTP()
      const otpHash = await bcrypt.hash(otp, 10)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

      await supabase.from('users').update({
        two_factor_hash: otpHash,
        two_factor_expires_at: expiresAt,
        two_factor_attempts: 0,
      }).eq('id', user.id)

      console.log(`[2FA] Code for ${email}: ${otp}`)
      return { requires2FA: true, userId: user.id, email }
    }

    return this._createSession(user)
  },

  async verify2FA(userId: string, code: string): Promise<AuthResult> {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single()
    if (!user) return { error: 'User not found' }
    if (!user.two_factor_enabled) return { error: '2FA not enabled' }
    if (!user.two_factor_hash) return { error: 'No pending 2FA code' }

    if (user.two_factor_attempts >= 5) {
      await supabase.from('users').update({ two_factor_attempts: 0, two_factor_hash: null, two_factor_expires_at: null }).eq('id', userId)
      return { error: 'Too many attempts. Please login again.' }
    }

    if (user.two_factor_expires_at && new Date(user.two_factor_expires_at) < new Date()) {
      await supabase.from('users').update({ two_factor_hash: null, two_factor_expires_at: null }).eq('id', userId)
      return { error: 'Code expired. Please login again.' }
    }

    const valid = await bcrypt.compare(code, user.two_factor_hash)
    if (!valid) {
      await supabase.from('users').update({ two_factor_attempts: (user.two_factor_attempts || 0) + 1 }).eq('id', userId)
      return { error: `Invalid code. ${5 - (user.two_factor_attempts || 0) - 1} attempts remaining.` }
    }

    await supabase.from('users').update({
      two_factor_hash: null,
      two_factor_expires_at: null,
      two_factor_attempts: 0,
    }).eq('id', userId)

    return this._createSession(user)
  },

  async resend2FA(userId: string): Promise<AuthResult> {
    const { data: user } = await supabase.from('users').select('email').eq('id', userId).single()
    if (!user) return { error: 'User not found' }

    const otp = generateOTP()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('users').update({
      two_factor_hash: otpHash,
      two_factor_expires_at: expiresAt,
      two_factor_attempts: 0,
    }).eq('id', userId)

    console.log(`[2FA] Resent code for ${user.email}: ${otp}`)
    return { email: user.email }
  },

  async oauthLogin(data: {
    provider: string
    providerUserId: string
    email: string
    displayName: string
    avatar: string
  }): Promise<AuthResult> {
    const { data: existing } = await supabase.from('users').select('*').eq('email', data.email).maybeSingle()

    if (existing) {
      await supabase.from('users').update({
        auth_provider: data.provider,
        last_login: new Date().toISOString(),
      }).eq('id', existing.id)

      return this._createSession(existing)
    }

    const userId = generateId()
    const username = data.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) || `user_${userId.slice(0, 8)}`

    await supabase.from('users').insert({
      id: userId,
      username,
      display_name: data.displayName,
      email: data.email,
      avatar_url: data.avatar,
      banner_url: '',
      bio: '',
      website: '',
      location: '',
      is_verified: false,
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      password_hash: null,
      two_factor_enabled: false,
      two_factor_hash: null,
      two_factor_expires_at: null,
      two_factor_attempts: 0,
      auth_provider: data.provider,
      last_login: new Date().toISOString(),
      status: 'active',
    })

    const { data: newUser } = await supabase.from('users').select('*').eq('id', userId).single()
    if (newUser) return this._createSession(newUser)
    return { userId, email: data.email }
  },

  async enable2FA(userId: string): Promise<{ success: boolean; message?: string }> {
    const otp = generateOTP()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('users').update({
      two_factor_enabled: true,
      two_factor_hash: otpHash,
      two_factor_expires_at: expiresAt,
      two_factor_attempts: 0,
    }).eq('id', userId)

    console.log(`[2FA] Setup code for user ${userId}: ${otp}`)
    return { success: true, message: `Verification code sent. For demo: ${otp}` }
  },

  async disable2FA(userId: string): Promise<{ success: boolean }> {
    await supabase.from('users').update({
      two_factor_enabled: false,
      two_factor_hash: null,
      two_factor_expires_at: null,
      two_factor_attempts: 0,
    }).eq('id', userId)
    return { success: true }
  },

  async logout(): Promise<void> {
    const session = this.getSession()
    if (session) {
      await supabase.from('sessions').delete().eq('user_id', session.userId)
    }
    localStorage.removeItem(LS_SESSION_KEY)
  },

  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(LS_SESSION_KEY)
      if (!raw) return null
      const session: AuthSession = JSON.parse(raw)
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(LS_SESSION_KEY)
        return null
      }
      return session
    } catch {
      return null
    }
  },

  async getCurrentUser(): Promise<{ user: AuthUser | null; profile: any | null }> {
    const session = this.getSession()
    if (!session) return { user: null, profile: null }

    const { data: profile } = await supabase.from('users').select('*').eq('id', session.userId).single()
    if (!profile) {
      localStorage.removeItem(LS_SESSION_KEY)
      return { user: null, profile: null }
    }

    const user: AuthUser = {
      id: profile.id,
      email: profile.email || '',
      user_metadata: {
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url || '',
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: profile.created_at,
    }

    return { user, profile }
  },

  enterDemo(): { user: AuthUser; profile: any } {
    const profile = {
      id: 'demo-user-id',
      username: 'pratham',
      display_name: 'Pratham',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      banner_url: '',
      bio: 'Building high-performance dark-themed decentralized applications and state architectures.',
      website: '',
      location: 'Global',
      is_verified: false,
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      email: 'demo@neutron.app',
      auth_provider: 'demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const user: AuthUser = {
      id: 'demo-user-id',
      email: 'demo@neutron.app',
      user_metadata: {
        username: 'pratham',
        display_name: 'Pratham',
        avatar_url: profile.avatar_url,
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: profile.created_at,
    }

    const session: AuthSession = { userId: 'demo-user-id', token: 'demo-token', expiresAt: new Date(Date.now() + 86400000).toISOString(), mfaVerified: true }
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session))

    return { user, profile }
  },

  async forgotPassword(email: string): Promise<{ error?: string; resetToken?: string }> {
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single()
    if (!user) return { error: 'No account found with this email' }

    const resetToken = generateId()
    const expiresAt = new Date(Date.now() + 3600000).toISOString()

    console.log(`[Password Reset] Token for ${email}: ${resetToken}`)
    return { resetToken }
  },

  async resetPassword(_token: string, newPassword: string): Promise<{ error?: string }> {
    const session = this.getSession()
    if (!session) return { error: 'Not authenticated' }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await supabase.from('users').update({ password_hash: passwordHash }).eq('id', session.userId)
    return {}
  },

  async updateProfile(userId: string, updates: Record<string, any>): Promise<{ error?: string }> {
    await supabase.from('users').update(updates).eq('id', userId)
    return {}
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ error?: string }> {
    const session = this.getSession()
    if (!session) return { error: 'Not authenticated' }

    const { data: user } = await supabase.from('users').select('password_hash').eq('id', session.userId).single()
    if (!user || !user.password_hash) return { error: 'No password set for this account' }

    const valid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!valid) return { error: 'Current password is incorrect' }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await supabase.from('users').update({ password_hash: passwordHash }).eq('id', session.userId)
    return {}
  },
}
