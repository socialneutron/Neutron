import api from '../lib/api'

export const backendSearchService = {
  async search(query: string, type?: string, limit = 20) {
    const res = await api.get('/search', { q: query, type, limit })
    return res.data || { users: [], posts: [] }
  },
}
