import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AccountType = 'private' | 'public' | 'company'
type BusinessTab = 'suppliers' | 'talent' | 'products' | 'magazines'
type ZoomLevel = 'fit' | '75' | '100' | '125'

interface SettingsState {
  darkMode: boolean
  accentColor: string
  accentHex: string
  accountType: AccountType

  notifications: {
    mentions: boolean
    likes: boolean
    follows: boolean
    comments: boolean
    email: boolean
    push: boolean
    toasts: boolean
  }

  chat: {
    readReceipts: boolean
    typingIndicator: boolean
    showOnline: boolean
  }

  privacy: {
    aiPersonalize: boolean
  }

  business: {
    defaultTab: BusinessTab
  }

  workflow: {
    defaultZoom: ZoomLevel
  }

  setDarkMode: (on: boolean) => void
  setAccentColor: (name: string, hex: string) => void
  setAccountType: (type: AccountType) => void
  toggleNotification: (key: keyof SettingsState['notifications']) => void
  toggleChat: (key: keyof SettingsState['chat']) => void
  togglePrivacy: (key: keyof SettingsState['privacy']) => void
  setBusinessDefaultTab: (tab: BusinessTab) => void
  setWorkflowDefaultZoom: (zoom: ZoomLevel) => void
  reset: () => void
}

const INITIAL = {
  darkMode: true,
  accentColor: 'Cyber Cyan',
  accentHex: '#00D2FF',
  accountType: 'private' as const,
  notifications: { mentions: true, likes: true, follows: false, comments: true, email: false, push: true, toasts: true },
  chat: { readReceipts: true, typingIndicator: true, showOnline: true },
  privacy: { aiPersonalize: true },
  business: { defaultTab: 'suppliers' as const },
  workflow: { defaultZoom: 'fit' as const },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...INITIAL,

      setDarkMode: (on) => set({ darkMode: on }),
      setAccentColor: (name, hex) => set({ accentColor: name, accentHex: hex }),
      setAccountType: (type) => set({ accountType: type }),

      toggleNotification: (key) => set((s) => ({
        notifications: { ...s.notifications, [key]: !s.notifications[key] },
      })),

      toggleChat: (key) => set((s) => ({
        chat: { ...s.chat, [key]: !s.chat[key] },
      })),

      togglePrivacy: (key) => set((s) => ({
        privacy: { ...s.privacy, [key]: !s.privacy[key] },
      })),

      setBusinessDefaultTab: (tab) => set({ business: { defaultTab: tab } }),
      setWorkflowDefaultZoom: (zoom) => set({ workflow: { defaultZoom: zoom } }),

      reset: () => set(INITIAL),
    }),
    { name: 'neutron-settings' }
  )
)
