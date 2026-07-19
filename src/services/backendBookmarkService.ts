import api from '../lib/api'

export const backendBookmarkService = {
  async toggle(userId: string, postId: string): Promise<boolean> {
    const res = await api.post(`/posts/${postId}/save`)
    return res.data?.isSaved ?? false
  },

  async isBookmarked(userId: string, postId: string): Promise<boolean> {
    const res = await api.get(`/posts/${postId}`)
    return res.data?.post?.isSaved ?? false
  },

  async getUserBookmarks(userId: string, page = 0, limit = 20) {
    const res = await api.get('/users/me/saved', { page, limit })
    return res.data?.bookmarks || []
  },

  async removeByPost(userId: string, postId: string): Promise<boolean> {
    await api.post(`/posts/${postId}/save`)
    return true
  },
}
