import { create } from 'zustand'
import type { User } from '../types/database'
import { followService } from '../services'

interface ProfileState {
  profile: User | null
  isFollowing: boolean
  setProfile: (profile: User | null) => void
  toggleFollow: (currentUserId: string, targetUserId: string) => Promise<boolean>
  setIsFollowing: (val: boolean) => void
  updateCounts: (field: 'followers_count' | 'following_count', delta: number) => void
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isFollowing: false,

  setProfile: (profile) => set({ profile }),

  setIsFollowing: (val) => set({ isFollowing: val }),

  toggleFollow: async (currentUserId, targetUserId) => {
    const nowFollowing = await followService.toggle(currentUserId, targetUserId)
    set({ isFollowing: nowFollowing })
    if (get().profile?.id === targetUserId) {
      set((s) => ({
        profile: s.profile ? {
          ...s.profile,
          followers_count: s.profile.followers_count + (nowFollowing ? 1 : -1),
        } : null,
      }))
    }
    return nowFollowing
  },

  updateCounts: (field, delta) => set((s) => ({
    profile: s.profile ? { ...s.profile, [field]: s.profile[field] + delta } : null,
  })),
}))
