import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserAvatarState {
  avatar: string | null
  banner: string | null
  displayName: string
  bio: string
  setAvatar: (avatar: string | null) => void
  setBanner: (banner: string | null) => void
  setDisplayName: (name: string) => void
  setBio: (bio: string) => void
}

export const useUserAvatar = create<UserAvatarState>()(
  persist(
    (set) => ({
      avatar: null,
      banner: null,
      displayName: 'Pratham',
      bio: 'Building high-performance dark-themed decentralized applications and state architectures.',
      setAvatar: (avatar) => set({ avatar }),
      setBanner: (banner) => set({ banner }),
      setDisplayName: (displayName) => set({ displayName }),
      setBio: (bio) => set({ bio }),
    }),
    {
      name: 'neutron-user-avatar',
    }
  )
)
