import { supabase } from '../lib/supabase'
import type { User } from '../types/database'

export const userService = {
  async getProfile(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    if (error) return null
    return data
  },

  async getProfileById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
    return !error
  },

  async searchUsers(query: string, limit = 20): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit)
    if (error) return []
    return data || []
  },

  async getUserPosts(userId: string, currentUserId?: string, page = 0, limit = 20) {
    const from = page * limit
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []

    if (!currentUserId || !data?.length) return (data || []) as any

    const postIds = data.map(p => p.id)
    const [likesRes, bookmarksRes, repostsRes] = await Promise.all([
      supabase.from('likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds),
      supabase.from('bookmarks').select('post_id').eq('user_id', currentUserId).in('post_id', postIds),
      supabase.from('reposts').select('post_id').eq('user_id', currentUserId).in('post_id', postIds),
    ])

    const likedSet = new Set(likesRes.data?.map(l => l.post_id))
    const bookmarkedSet = new Set(bookmarksRes.data?.map(b => b.post_id))
    const repostedSet = new Set(repostsRes.data?.map(r => r.post_id))

    return data.map(p => ({
      ...p,
      author: p.author as any,
      is_liked: likedSet.has(p.id),
      is_bookmarked: bookmarkedSet.has(p.id),
      is_reposted: repostedSet.has(p.id),
    })) as any[]
  },

  async getUserStats(userId: string) {
    const [posts, followers, following] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    return {
      posts: posts.count || 0,
      followers: followers.count || 0,
      following: following.count || 0,
    }
  },
}
