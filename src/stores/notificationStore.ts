import { create } from 'zustand'
import { notificationService } from '../services'

interface NotificationState {
  unreadCount: number
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  markAllRead: (userId: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),

  markAllRead: async (userId) => {
    await notificationService.markAllAsRead(userId)
    set({ unreadCount: 0 })
  },
}))
