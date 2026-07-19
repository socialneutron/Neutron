import api from '../lib/api'

export const backendNotificationService = {
  async getForUser(page = 0, limit = 20) {
    const res = await api.get('/notifications', { page, limit })
    return res.data?.notifications || []
  },

  async markAllAsRead() {
    await api.put('/notifications/read-all')
    return true
  },

  async delete(notificationId: string) {
    await api.delete(`/notifications/${notificationId}`)
    return true
  },
}
