import { supabase } from '../lib/supabase'
import type { User } from '../types/database'

async function resolveAuthor(post: any): Promise<User> {
  const author = post.author as any
  if (author && author.username) return author
  const { data: user } = await supabase.from('users').select('*').eq('id', post.author_id).maybeSingle()
  if (user) return user as User
  return {
    id: post.author_id || '',
    username: post.author_username || 'unknown',
    display_name: post.author_display_name || post.author_username || 'Unknown',
    avatar_url: post.author_avatar || '',
    banner_url: '', bio: '', website: '', location: '',
    is_verified: false, followers_count: 0, following_count: 0, posts_count: 0,
    created_at: post.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

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
    if (!data?.length) return []

    const resolved = await Promise.all(data.map(async p => ({ ...p, author: await resolveAuthor(p) })))

    if (!currentUserId) return resolved as any[]

    const postIds = resolved.map(p => p.id)
    const [likesRes, bookmarksRes, repostsRes] = await Promise.all([
      supabase.from('likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds),
      supabase.from('bookmarks').select('post_id').eq('user_id', currentUserId).in('post_id', postIds),
      supabase.from('reposts').select('post_id').eq('user_id', currentUserId).in('post_id', postIds),
    ])

    const likedSet = new Set(likesRes.data?.map(l => l.post_id))
    const bookmarkedSet = new Set(bookmarksRes.data?.map(b => b.post_id))
    const repostedSet = new Set(repostsRes.data?.map(r => r.post_id))

    return resolved.map(p => ({
      ...p,
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
