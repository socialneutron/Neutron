import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { mockAuthService, type AuthSession } from '../services/mockAuthService'
import { serverAuthService, getAccessToken } from '../services/serverAuthService'
import { api } from '../lib/api'
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, OAuthProvider } from 'firebase/auth'
import firebaseApp from '../firebase'
import type { User } from '../types/database'

interface AuthContextType {
  session: Session | null
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string; errorType?: string; requires2FA?: boolean; userId?: string }>
  signUp: (email: string, password: string, username: string, interests?: string[]) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  enterDemo: () => void
  verify2FA: (userId: string, code: string) => Promise<{ error?: string }>
  resend2FA: (userId: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signInWithGitHub: () => Promise<{ error?: string }>
  signInWithApple: () => Promise<{ error?: string }>
  signInWithMicrosoft: () => Promise<{ error?: string }>
}

const SupabaseAuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, loading: true, isConfigured: true,
  signIn: async () => ({}), signUp: async () => ({}),
  signOut: async () => {}, refreshProfile: async () => {}, enterDemo: () => {},
  verify2FA: async () => ({}), resend2FA: async () => ({}),
  signInWithGoogle: async () => ({}), signInWithGitHub: async () => ({}),
  signInWithApple: async () => ({}), signInWithMicrosoft: async () => ({}),
})

function mapUser(authUser: any): SupabaseUser {
  return {
    id: authUser.id,
    email: authUser.email || '',
    user_metadata: authUser.user_metadata || {},
    app_metadata: authUser.app_metadata || {},
    aud: authUser.aud || 'authenticated',
    created_at: authUser.created_at,
  } as any
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Wire api.js to use server auth token
  useEffect(() => {
    api.setAuthTokenGetter(() => getAccessToken())
  }, [])

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single()
    if (data) setProfile(data)
  }, [])

  const applySession = useCallback(async (authSession: AuthSession) => {
    const { user: authUser, profile: prof } = await mockAuthService.getCurrentUser()
    if (authUser && prof) {
      const mapped = mapUser(authUser)
      setSession({ user: mapped, access_token: authSession.token } as any)
      setUser(mapped)
      setProfile(prof as User)
    }
    setLoading(false)
  }, [])

  const applyServerUser = useCallback(async (serverUser: any) => {
    const mapped = mapUser({
      id: serverUser.id,
      email: serverUser.email,
      user_metadata: { username: serverUser.username, avatar_url: serverUser.profilePicture },
      created_at: serverUser.createdAt,
    })
    setSession({ user: mapped, access_token: getAccessToken() } as any)
    setUser(mapped)
    // Create/populate mock user from server data so the rest of the app works
    try {
      const oauthResult = await mockAuthService.oauthLogin({
        provider: 'server',
        providerUserId: serverUser.id,
        email: serverUser.email,
        displayName: serverUser.username,
        avatar: serverUser.profilePicture || '',
      })
      if (!oauthResult.error) {
        const { profile: prof } = await mockAuthService.getCurrentUser()
        if (prof) setProfile(prof as User)
      }
    } catch {
      // Mock not available
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Try server auth first, fall back to mock
    const initAuth = async () => {
      try {
        const refreshed = await serverAuthService.refreshAccessToken()
        if (refreshed) {
          const serverUser = await serverAuthService.getProfile()
          if (serverUser) {
            await applyServerUser(serverUser)
            return
          }
        }
      } catch {
        // Server unavailable, fall back to mock
      }
      // Fall back to mock auth
      const existingSession = mockAuthService.getSession()
      if (existingSession) {
        await applySession(existingSession)
      } else {
        const { user: demoUser, profile: demoProfile } = mockAuthService.enterDemo()
        setSession({ user: demoUser } as any)
        setUser(mapUser(demoUser))
        setProfile(demoProfile as User)
        setLoading(false)
      }
    }
    initAuth()
  }, [applySession, applyServerUser])

  const signIn = async (email: string, password: string) => {
    // Try server auth first
    try {
      const result = await serverAuthService.login(email, password)
      if (result.error) {
        return { error: result.error, errorType: result.errorType }
      }
      if (result.userId) {
        const serverUser = await serverAuthService.getProfile()
        if (serverUser) {
          await applyServerUser(serverUser)
          return {}
        }
      }
    } catch {
      // Server unavailable, fall back to mock
    }

    // Fall back to mock auth
    const result = await mockAuthService.login(email, password)
    if (result.error) return { error: result.error }
    if (result.requires2FA) return { requires2FA: true, userId: result.userId }
    if (result.userId) {
      const authSession = mockAuthService.getSession()
      if (authSession) await applySession(authSession)
    }
    return {}
  }

  const signUp = async (email: string, password: string, username: string, interests?: string[]) => {
    // Try server auth first
    try {
      const result = await serverAuthService.signup(email, password, username, interests)
      if (result.error) {
        return { error: result.error }
      }
      // Server signup returns userId but doesn't auto-login (email verification required)
      return {}
    } catch {
      // Server unavailable, fall back to mock
    }

    // Fall back to mock auth
    const result = await mockAuthService.signup(email, password, username, interests)
    if (result.error) return { error: result.error }
    if (result.userId) {
      const authSession = mockAuthService.getSession()
      if (authSession) await applySession(authSession)
    }
    return {}
  }

  const signOut = async () => {
    // Try server logout first
    try {
      await serverAuthService.logout()
    } catch {
      // Ignore
    }
    // Also clear mock session
    await mockAuthService.logout()
    setSession(null)
    setUser(null)
    setProfile(null)
    const { user: demoUser, profile: demoProfile } = mockAuthService.enterDemo()
    setSession({ user: demoUser } as any)
    setUser(mapUser(demoUser))
    setProfile(demoProfile as User)
  }

  const verify2FA = async (userId: string, code: string) => {
    const result = await mockAuthService.verify2FA(userId, code)
    if (result.error) return { error: result.error }
    const authSession = mockAuthService.getSession()
    if (authSession) await applySession(authSession)
    return {}
  }

  const resend2FA = async (userId: string) => {
    const result = await mockAuthService.resend2FA(userId)
    return { error: result.error }
  }

  const handleOAuthError = (error: any): string => {
    if (error.code === 'auth/popup-closed-by-user') return 'Sign-in popup was closed'
    if (error.code === 'auth/cancelled-popup-request') return 'Sign-in was cancelled'
    if (error.code === 'auth/network-request-failed') return 'Network error. Check your connection.'
    return error.message || 'OAuth sign-in failed'
  }

  const signInWithGoogle = async () => {
    try {
      const firebaseAuth = getAuth(firebaseApp)
      const result = await signInWithPopup(firebaseAuth, new GoogleAuthProvider())
      const fbUser = result.user
      const oauthData = {
        provider: 'google',
        providerUserId: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'Google User',
        avatar: fbUser.photoURL || '',
      }
      // Try server auth first
      try {
        const serverResult = await serverAuthService.oauthLogin(oauthData)
        if (!serverResult.error) {
          const serverUser = await serverAuthService.getProfile()
          if (serverUser) {
            await applyServerUser(serverUser)
            return {}
          }
        }
      } catch {
        // Server unavailable
      }
      // Fall back to mock
      const oauthResult = await mockAuthService.oauthLogin(oauthData)
      if (oauthResult.error) return { error: oauthResult.error }
      const authSession = mockAuthService.getSession()
      if (authSession) await applySession(authSession)
      return {}
    } catch (e: any) {
      return { error: handleOAuthError(e) }
    }
  }

  const signInWithGitHub = async () => {
    try {
      const firebaseAuth = getAuth(firebaseApp)
      const result = await signInWithPopup(firebaseAuth, new GithubAuthProvider())
      const fbUser = result.user
      const oauthData = {
        provider: 'github',
        providerUserId: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'GitHub User',
        avatar: fbUser.photoURL || '',
      }
      try {
        const serverResult = await serverAuthService.oauthLogin(oauthData)
        if (!serverResult.error) {
          const serverUser = await serverAuthService.getProfile()
          if (serverUser) {
            await applyServerUser(serverUser)
            return {}
          }
        }
      } catch {}
      const oauthResult = await mockAuthService.oauthLogin(oauthData)
      if (oauthResult.error) return { error: oauthResult.error }
      const authSession = mockAuthService.getSession()
      if (authSession) await applySession(authSession)
      return {}
    } catch (e: any) {
      return { error: handleOAuthError(e) }
    }
  }

  const signInWithApple = async () => {
    try {
      const firebaseAuth = getAuth(firebaseApp)
      const provider = new OAuthProvider('apple.com')
      const result = await signInWithPopup(firebaseAuth, provider)
      const fbUser = result.user
      const oauthData = {
        provider: 'apple',
        providerUserId: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'Apple User',
        avatar: fbUser.photoURL || '',
      }
      try {
        const serverResult = await serverAuthService.oauthLogin(oauthData)
        if (!serverResult.error) {
          const serverUser = await serverAuthService.getProfile()
          if (serverUser) {
            await applyServerUser(serverUser)
            return {}
          }
        }
      } catch {}
      const oauthResult = await mockAuthService.oauthLogin(oauthData)
      if (oauthResult.error) return { error: oauthResult.error }
      const authSession = mockAuthService.getSession()
      if (authSession) await applySession(authSession)
      return {}
    } catch (e: any) {
      return { error: handleOAuthError(e) }
    }
  }

  const signInWithMicrosoft = async () => {
    try {
      const firebaseAuth = getAuth(firebaseApp)
      const provider = new OAuthProvider('microsoft.com')
      const result = await signInWithPopup(firebaseAuth, provider)
      const fbUser = result.user
      const oauthData = {
        provider: 'microsoft',
        providerUserId: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'Microsoft User',
        avatar: fbUser.photoURL || '',
      }
      try {
        const serverResult = await serverAuthService.oauthLogin(oauthData)
        if (!serverResult.error) {
          const serverUser = await serverAuthService.getProfile()
          if (serverUser) {
            await applyServerUser(serverUser)
            return {}
          }
        }
      } catch {}
      const oauthResult = await mockAuthService.oauthLogin(oauthData)
      if (oauthResult.error) return { error: oauthResult.error }
      const authSession = mockAuthService.getSession()
      if (authSession) await applySession(authSession)
      return {}
    } catch (e: any) {
      return { error: handleOAuthError(e) }
    }
  }

  const refreshProfile = async () => { if (user) await fetchProfile(user.id) }

  const enterDemo = () => {
    const { user: demoUser, profile: demoProfile } = mockAuthService.enterDemo()
    setSession({ user: demoUser } as any)
    setUser(mapUser(demoUser))
    setProfile(demoProfile as User)
    setLoading(false)
  }

  return (
    <SupabaseAuthContext.Provider value={{
      session, user, profile, loading, isConfigured: true,
      signIn, signUp, signOut, refreshProfile, enterDemo,
      verify2FA, resend2FA,
      signInWithGoogle, signInWithGitHub, signInWithApple, signInWithMicrosoft,
    }}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export const useSupabaseAuth = () => useContext(SupabaseAuthContext)
