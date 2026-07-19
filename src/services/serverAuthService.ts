const AUTH_API = '/auth-api'

interface AuthResult {
  error?: string
  errorType?: string
  userId?: string
  requires2FA?: boolean
}

interface ServerUser {
  id: string
  username: string
  email: string
  profilePicture?: string
  bio?: string
  emailVerified: boolean
  accountStatus: string
  createdAt: string
}

interface AuthResponse {
  user: ServerUser
  accessToken: string
  refreshToken: string
}

// In-memory access token (never persisted to localStorage)
let _accessToken: string | null = null
let _refreshToken: string | null = null
let _user: ServerUser | null = null

function isServerAvailable(): boolean {
  return navigator.onLine
}

async function serverRequest<T = any>(
  method: string,
  path: string,
  body?: any,
  includeAuth = false
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (includeAuth && _accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`
  }

  const res = await fetch(`${AUTH_API}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.error?.message || data?.message || data?.error || `Request failed: ${res.status}`
    const errorType = data?.error?.code || ''
    const err = new Error(message) as any
    err.status = res.status
    err.errorType = errorType
    err.data = data
    throw err
  }

  return data?.data || data
}

function storeTokens(accessToken: string, refreshToken: string) {
  _accessToken = accessToken
  _refreshToken = refreshToken
}

function clearTokens() {
  _accessToken = null
  _refreshToken = null
  _user = null
}

export function getAccessToken(): string | null {
  return _accessToken
}

export function getStoredUser(): ServerUser | null {
  return _user
}

export const serverAuthService = {
  async checkUsername(username: string): Promise<{ available: boolean | null }> {
    try {
      const result = await serverRequest<{ available: boolean | null }>('GET', `/auth/check-username?q=${encodeURIComponent(username)}`)
      return result
    } catch {
      return { available: null }
    }
  },

  async signup(
    email: string,
    password: string,
    username: string,
    _interests?: string[]
  ): Promise<AuthResult> {
    try {
      const result = await serverRequest<AuthResponse>('POST', '/auth/signup', {
        username,
        email,
        password,
        confirmPassword: password,
      })
      // Server returns user + tokens, but user is not yet verified
      // Don't auto-login — show email verification notice
      return { userId: result.user.id }
    } catch (err: any) {
      if (err.errorType === 'EMAIL_NOT_VERIFIED') {
        return { error: err.message, errorType: 'EMAIL_NOT_VERIFIED' }
      }
      return { error: err.message }
    }
  },

  async login(emailOrUsername: string, password: string, rememberMe = false): Promise<AuthResult> {
    try {
      const result = await serverRequest<AuthResponse>('POST', '/auth/login', {
        emailOrUsername,
        password,
        rememberMe,
      })
      storeTokens(result.accessToken, result.refreshToken)
      _user = result.user
      return { userId: result.user.id }
    } catch (err: any) {
      if (err.errorType === 'EMAIL_NOT_VERIFIED') {
        return { error: err.message, errorType: 'EMAIL_NOT_VERIFIED' }
      }
      return { error: err.message }
    }
  },

  async logout(): Promise<void> {
    try {
      if (_refreshToken) {
        await serverRequest('POST', '/auth/logout', { refreshToken: _refreshToken }, true)
      }
    } catch {
      // Ignore logout errors
    }
    clearTokens()
  },

  async refreshAccessToken(): Promise<boolean> {
    if (!_refreshToken) return false
    try {
      const result = await serverRequest<AuthResponse>('POST', '/auth/refresh-token', {
        refreshToken: _refreshToken,
      })
      storeTokens(result.accessToken, result.refreshToken)
      _user = result.user
      return true
    } catch {
      clearTokens()
      return false
    }
  },

  async oauthLogin(providerData: {
    provider: string
    providerUserId: string
    email: string
    displayName: string
    avatar: string
  }): Promise<AuthResult> {
    try {
      const result = await serverRequest<AuthResponse>('POST', '/auth/oauth-login', {
        provider: providerData.provider,
        providerUserId: providerData.providerUserId,
        email: providerData.email,
        displayName: providerData.displayName,
        avatar: providerData.avatar,
      })
      storeTokens(result.accessToken, result.refreshToken)
      _user = result.user
      return { userId: result.user.id }
    } catch (err: any) {
      return { error: err.message }
    }
  },

  async forgotPassword(email: string): Promise<{ error?: string }> {
    try {
      await serverRequest('POST', '/auth/forgot-password', { email })
      return {}
    } catch (err: any) {
      return { error: err.message }
    }
  },

  async resetPassword(token: string, password: string): Promise<{ error?: string }> {
    try {
      await serverRequest('POST', '/auth/reset-password', { token, password, confirmPassword: password })
      return {}
    } catch (err: any) {
      return { error: err.message }
    }
  },

  async verifyEmail(token: string): Promise<{ error?: string }> {
    try {
      await serverRequest('POST', '/auth/verify-email', { token })
      return {}
    } catch (err: any) {
      return { error: err.message }
    }
  },

  async getProfile(): Promise<ServerUser | null> {
    if (!_accessToken) return null
    try {
      const result = await serverRequest<{ user: ServerUser }>('GET', '/user/profile', undefined, true)
      _user = result.user
      return result.user
    } catch {
      return null
    }
  },
}
