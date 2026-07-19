import api from '../lib/api'

export const backendCommentService = {
  async getByPost(postId: string, page = 0, limit = 50) {
    const res = await api.get(`/comments/post/${postId}`, { page, limit })
    return res.data?.comments || []
  },

  async create(authorId: string, postId: string, body: string, parentId?: string) {
    const res = await api.post(`/comments/post/${postId}`, { text: body, parentComment: parentId })
    return res.data?.comment || null
  },

  async delete(commentId: string, postId?: string) {
    await api.delete(`/comments/${commentId}`)
    return true
  },

  async toggleLike(commentId: string) {
    const res = await api.post(`/comments/${commentId}/like`)
    return res.data
  },
}
