import api from '../lib/api'

export const backendUserService = {
  async getProfile(username: string) {
    const res = await api.get(`/users/${username}`)
    return res.data?.user || null
  },

  async updateProfile(data: { displayName?: string; bio?: string; website?: string; location?: string; username?: string }) {
    const res = await api.put('/users/profile', data)
    return res.data?.user || null
  },

  async toggleFollow(userId: string) {
    const res = await api.post(`/users/${userId}/follow`)
    return res.data
  },

  async getFollowers(userId: string, page = 0, limit = 20) {
    const res = await api.get(`/users/${userId}/followers`, { page, limit })
    return res.data?.followers || []
  },

  async getFollowing(userId: string, page = 0, limit = 20) {
    const res = await api.get(`/users/${userId}/following`, { page, limit })
    return res.data?.following || []
  },

  async getUserPosts(userId: string, page = 0, limit = 20) {
    const res = await api.get(`/users/${userId}/posts`, { page, limit })
    return res.data?.posts || []
  },

  async search(query: string, limit = 20) {
    const res = await api.get('/search', { q: query, type: 'users', limit })
    return res.data?.users || []
  },
}
