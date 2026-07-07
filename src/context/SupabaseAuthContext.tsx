import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { User } from '../types/database'

interface AuthContextType {
  session: Session | null
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  enterDemo: () => void
}

const DEMO_USER: SupabaseUser = {
  id: 'demo-user-id',
  email: 'demo@neutron.app',
  user_metadata: {
    username: 'pratham',
    display_name: 'Pratham',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as any

const DEMO_PROFILE: User = {
  id: 'demo-user-id',
  username: 'pratham',
  display_name: 'Pratham',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  banner_url: '',
  bio: 'Building high-performance dark-themed decentralized applications and state architectures.',
  website: '',
  location: 'Global',
  is_verified: true,
  followers_count: 842,
  following_count: 156,
  posts_count: 24,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const SupabaseAuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, loading: true, isConfigured: false,
  signIn: async () => ({}), signUp: async () => ({}),
  signOut: async () => {}, refreshProfile: async () => {}, enterDemo: () => {},
})

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single()
    if (data) setProfile(data)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      enterDemo()
      return
    }

    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [fetchProfile])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured. Click "Enter Demo" to explore.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }

  const signUp = async (email: string, password: string, username: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured. Click "Enter Demo" to explore.' }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username, display_name: username } },
    })
    return error ? { error: error.message } : {}
  }

  const signOut = async () => { if (isSupabaseConfigured) await supabase.auth.signOut() }

  const refreshProfile = async () => { if (user) await fetchProfile(user.id) }

  const enterDemo = () => {
    setSession({ user: DEMO_USER } as any)
    setUser(DEMO_USER)
    setProfile(DEMO_PROFILE)
    setLoading(false)
  }

  return (
    <SupabaseAuthContext.Provider value={{ session, user, profile, loading, isConfigured: isSupabaseConfigured, signIn, signUp, signOut, refreshProfile, enterDemo }}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export const useSupabaseAuth = () => useContext(SupabaseAuthContext)
