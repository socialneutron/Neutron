import api from '../lib/api'

export const backendLikeService = {
  async toggle(userId: string, postId: string): Promise<boolean> {
    const res = await api.post(`/posts/${postId}/like`)
    return res.data?.isLiked ?? false
  },

  async toggleComment(userId: string, commentId: string, postId: string): Promise<boolean> {
    const res = await api.post(`/comments/${commentId}/like`)
    return res.data?.isLiked ?? false
  },

  async isLiked(userId: string, postId: string): Promise<boolean> {
    const res = await api.get(`/posts/${postId}`)
    return res.data?.post?.isLiked ?? false
  },

  async getUserLikedPosts(userId: string, postIds: string[]): Promise<Set<string>> {
    return new Set()
  },

  async getUserLikedComments(userId: string, commentIds: string[]): Promise<Set<string>> {
    return new Set()
  },
}
