import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'

const DEFAULT_PROFILE = {
  uid: 'local_default',
  username: 'Pratham',
  handle: '@Pratham',
  email: 'pratham@neutron.app',
  bio: 'Global macro analyst · AI researcher · Exploring the intersection of technology, geopolitics and finance. Building the future one thread at a time.',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  reputation: 4.9,
  achievements: [
    { icon: '🔥', label: 'Hot Debater', desc: '10+ viral posts' },
    { icon: '🎯', label: 'Truth Seeker', desc: 'Fact-checked 50 posts' },
    { icon: '⚡', label: 'Early Adopter', desc: 'Joined Week 1' },
    { icon: '🏆', label: 'Top Contributor', desc: 'AI Hub — This Month' },
  ],
  interests: ['AI', 'Geopolitics', 'Finance', 'Startups', 'Space'],
  stats: {
    posts: 1240,
    followers: 48200,
    following: 892,
    repScore: 9821,
  },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeSnapshot = null

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        unsubscribeSnapshot = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (userDoc) => {
            if (userDoc.exists()) {
              const data = userDoc.data()
              setUser({
                ...DEFAULT_PROFILE,
                ...data,
                uid: firebaseUser.uid,
              })
            } else {
              setUser({
                ...DEFAULT_PROFILE,
                uid: firebaseUser.uid,
                email: firebaseUser.email || DEFAULT_PROFILE.email,
                username: firebaseUser.displayName || DEFAULT_PROFILE.username,
              })
            }
            setLoading(false)
          },
          () => {
            setUser({
              ...DEFAULT_PROFILE,
              uid: firebaseUser.uid,
              email: firebaseUser.email || DEFAULT_PROFILE.email,
              username: firebaseUser.displayName || DEFAULT_PROFILE.username,
            })
            setLoading(false)
          }
        )
      } else {
        setUser({ ...DEFAULT_PROFILE })
        setLoading(false)
        if (unsubscribeSnapshot) unsubscribeSnapshot()
      }
    })

    return () => {
      unsubscribe()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, setUser, DEFAULT_PROFILE }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
