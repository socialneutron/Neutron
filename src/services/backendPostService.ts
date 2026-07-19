import api from '../lib/api'

export const backendPostService = {
  async getFeed(page = 0, limit = 20) {
    const res = await api.get('/posts/feed', { page, limit })
    return res.data?.posts || []
  },

  async getTrending(page = 0, limit = 20) {
    const res = await api.get('/posts/trending', { page, limit })
    return res.data?.posts || []
  },

  async getById(postId: string) {
    const res = await api.get(`/posts/${postId}`)
    return res.data?.post || null
  },

  async getByHashtag(hashtag: string, page = 0, limit = 20) {
    const res = await api.get(`/posts/hashtag/${hashtag}`, { page, limit })
    return res.data?.posts || []
  },

  async create(data: { caption?: string; visibility?: string; location?: string }) {
    const res = await api.post('/posts', data)
    return res.data?.post || null
  },

  async update(postId: string, data: { caption?: string; visibility?: string }) {
    const res = await api.put(`/posts/${postId}`, data)
    return res.data?.post || null
  },

  async delete(postId: string) {
    await api.delete(`/posts/${postId}`)
    return true
  },

  async toggleLike(postId: string) {
    const res = await api.post(`/posts/${postId}/like`)
    return res.data
  },

  async toggleSave(postId: string) {
    const res = await api.post(`/posts/${postId}/save`)
    return res.data
  },

  async toggleRepost(postId: string) {
    const res = await api.post(`/posts/${postId}/repost`)
    return res.data
  },
}
