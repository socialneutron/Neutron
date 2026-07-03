import { supabase } from '../lib/supabase'

export const repostService = {
  async toggle(userId: string, postId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('reposts')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()

    if (existing) {
      await supabase.from('reposts').delete().eq('id', existing.id)
      await supabase.rpc('decrement_count', { table_name: 'posts', column_name: 'reposts_count', row_id: postId })
      return false
    } else {
      await supabase.from('reposts').insert({ user_id: userId, post_id: postId })
      await supabase.rpc('increment_count', { table_name: 'posts', column_name: 'reposts_count', row_id: postId })
      return true
    }
  },

  async isReposted(userId: string, postId: string): Promise<boolean> {
    const { data } = await supabase
      .from('reposts')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()
    return !!data
  },
}
