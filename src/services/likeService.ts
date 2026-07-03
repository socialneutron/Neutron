import { supabase } from '../lib/supabase'

export const likeService = {
  async toggle(userId: string, postId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id)
      await supabase.rpc('decrement_count', { table_name: 'posts', column_name: 'likes_count', row_id: postId })
      return false
    } else {
      await supabase.from('likes').insert({ user_id: userId, post_id: postId })
      await supabase.rpc('increment_count', { table_name: 'posts', column_name: 'likes_count', row_id: postId })
      return true
    }
  },

  async toggleComment(userId: string, commentId: string, postId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .maybeSingle()

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id)
      await supabase.rpc('decrement_count', { table_name: 'comments', column_name: 'likes_count', row_id: commentId })
      return false
    } else {
      await supabase.from('likes').insert({ user_id: userId, comment_id: commentId })
      await supabase.rpc('increment_count', { table_name: 'comments', column_name: 'likes_count', row_id: commentId })
      return true
    }
  },

  async isLiked(userId: string, postId: string): Promise<boolean> {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()
    return !!data
  },

  async getUserLikedPosts(userId: string, postIds: string[]): Promise<Set<string>> {
    if (!postIds.length) return new Set()
    const { data } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)
    return new Set(data?.map(l => l.post_id) || [])
  },

  async getUserLikedComments(userId: string, commentIds: string[]): Promise<Set<string>> {
    if (!commentIds.length) return new Set()
    const { data } = await supabase
      .from('likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', commentIds)
    return new Set(data?.map(l => l.comment_id) || [])
  },
}
