import api from '../lib/api'

export const backendRepostService = {
  async toggle(userId: string, postId: string): Promise<boolean> {
    const res = await api.post(`/posts/${postId}/repost`)
    return res.data?.reposted ?? false
  },

  async isReposted(userId: string, postId: string): Promise<boolean> {
    const res = await api.get(`/posts/${postId}`)
    return res.data?.post?.isReposted ?? false
  },
}
