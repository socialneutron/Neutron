import { supabase } from '../lib/supabase'
import type { Bookmark } from '../types/database'

export const bookmarkService = {
  async toggle(userId: string, postId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()

    if (existing) {
      await supabase.from('bookmarks').delete().eq('id', existing.id)
      await supabase.rpc('decrement_count', { table_name: 'posts', column_name: 'bookmarks_count', row_id: postId })
      return false
    } else {
      const { error } = await supabase.from('bookmarks').insert({ user_id: userId, post_id: postId })
      if (error) {
        if (error.code === '23505') return false
        return false
      }
      await supabase.rpc('increment_count', { table_name: 'posts', column_name: 'bookmarks_count', row_id: postId })
      return true
    }
  },

  async isBookmarked(userId: string, postId: string): Promise<boolean> {
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()
    return !!data
  },

  async getUserBookmarks(userId: string, page = 0, limit = 20): Promise<Bookmark[]> {
    const from = page * limit
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*, post:posts(*, author:users!posts_author_id_fkey(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []
    return (data || []) as any
  },

  async removeByPost(userId: string, postId: string): Promise<boolean> {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)
    return !error
  },
}
