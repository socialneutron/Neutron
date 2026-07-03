import { supabase } from '../lib/supabase'
import type { Comment, CommentWithAuthor } from '../types/database'

export const commentService = {
  async getByPost(postId: string, page = 0, limit = 50): Promise<CommentWithAuthor[]> {
    const from = page * limit
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:users!comments_author_id_fkey(*)')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
      .range(from, from + limit - 1)
    if (error) return []
    return (data || []) as any
  },

  async getReplies(parentId: string): Promise<CommentWithAuthor[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:users!comments_author_id_fkey(*)')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true })
    if (error) return []
    return (data || []) as any
  },

  async create(authorId: string, postId: string, body: string, parentId?: string): Promise<Comment | null> {
    const { data, error } = await supabase
      .from('comments')
      .insert({ author_id: authorId, post_id: postId, body, parent_id: parentId || null })
      .select()
      .single()
    if (error) return null
    await supabase.rpc('increment_count', { table_name: 'posts', column_name: 'comments_count', row_id: postId })
    return data
  },

  async delete(commentId: string, postId: string): Promise<boolean> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
    if (!error) await supabase.rpc('decrement_count', { table_name: 'posts', column_name: 'comments_count', row_id: postId })
    return !error
  },

  async count(postId: string): Promise<number> {
    const { count } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId)
    return count || 0
  },
}
