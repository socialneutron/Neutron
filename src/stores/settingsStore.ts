import { create } from 'zustand'

interface SettingsState {
  displayName: string
  bio: string
  avatar: string | null
  darkMode: boolean
  accentColor: string
  accentHex: string
  accountType: 'private' | 'public' | 'company'

  notifications: {
    mentions: boolean
    likes: boolean
    follows: boolean
    breaking: boolean
  }

  privacy: {
    privateAccount: boolean
    readReceipts: boolean
    showOnline: boolean
    aiPersonalize: boolean
  }

  setDisplayName: (name: string) => void
  setBio: (bio: string) => void
  setAvatar: (avatar: string | null) => void
  setDarkMode: (on: boolean) => void
  setAccentColor: (name: string, hex: string) => void
  setAccountType: (type: 'private' | 'public' | 'company') => void
  toggleNotification: (key: keyof SettingsState['notifications']) => void
  togglePrivacy: (key: keyof SettingsState['privacy']) => void
  reset: () => void
}

const INITIAL = {
  displayName: 'Pratham',
  bio: 'Building high-performance dark-themed decentralized applications and state architectures.',
  avatar: null,
  darkMode: true,
  accentColor: 'Cyber Cyan',
  accentHex: '#00D2FF',
  accountType: 'private' as const,
  notifications: { mentions: true, likes: true, follows: false, breaking: true },
  privacy: { privateAccount: false, readReceipts: true, showOnline: true, aiPersonalize: true },
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...INITIAL,

  setDisplayName: (name) => set({ displayName: name }),
  setBio: (bio) => set({ bio }),
  setAvatar: (avatar) => set({ avatar }),
  setDarkMode: (on) => set({ darkMode: on }),
  setAccentColor: (name, hex) => set({ accentColor: name, accentHex: hex }),
  setAccountType: (type) => set({ accountType: type }),

  toggleNotification: (key) => set((s) => ({
    notifications: { ...s.notifications, [key]: !s.notifications[key] },
  })),

  togglePrivacy: (key) => set((s) => ({
    privacy: { ...s.privacy, [key]: !s.privacy[key] },
  })),

  reset: () => set(INITIAL),
}))
