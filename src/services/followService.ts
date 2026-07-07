import { supabase } from '../lib/supabase'
import type { User } from '../types/database'
import { notificationService } from './notificationService'

export const followService = {
  async toggle(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle()

    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id)
      await supabase.rpc('decrement_count', { table_name: 'users', column_name: 'followers_count', row_id: followingId })
      await supabase.rpc('decrement_count', { table_name: 'users', column_name: 'following_count', row_id: followerId })
      return false
    } else {
      await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
      await supabase.rpc('increment_count', { table_name: 'users', column_name: 'followers_count', row_id: followingId })
      await supabase.rpc('increment_count', { table_name: 'users', column_name: 'following_count', row_id: followerId })
      // Fire-and-forget notification
      notificationService.create(followingId, followerId, 'follow').catch(() => {})
      return true
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle()
    return !!data
  },

  async getFollowers(userId: string, page = 0, limit = 50): Promise<User[]> {
    const from = page * limit
    const { data: follows, error } = await supabase
      .from('follows')
      .select('follower:users!follows_follower_id_fkey(*)')
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []
    return (follows?.map(f => f.follower) || []) as any
  },

  async getFollowing(userId: string, page = 0, limit = 50): Promise<User[]> {
    const from = page * limit
    const { data: follows, error } = await supabase
      .from('follows')
      .select('following:users!follows_following_id_fkey(*)')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []
    return (follows?.map(f => f.following) || []) as any
  },
}
