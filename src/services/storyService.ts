import { supabase } from '../lib/supabase'

export const storyService = {
  async create(userId: string, mediaId: string): Promise<any | null> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase.from('stories').insert({
      user_id: userId,
      media_id: mediaId,
      expires_at: expiresAt,
    }).select('*, media:media(*)').single()
    if (error) return null
    return data
  },

  async getActiveStories(userId?: string): Promise<any[]> {
    const now = new Date().toISOString()
    let query = supabase
      .from('stories')
      .select('*, author:users!stories_user_id_fkey(*), media:media(*)')
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
    if (userId) query = query.eq('user_id', userId)
    const { data } = await query
    return data || []
  },

  async getFollowingStories(followerId: string): Promise<any[]> {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', followerId)
    if (!follows?.length) return []
    const followingIds = follows.map(f => f.following_id)
    const now = new Date().toISOString()
    const { data } = await supabase
      .from('stories')
      .select('*, author:users!stories_user_id_fkey(*), media:media(*)')
      .in('user_id', followingIds)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
    return data || []
  },

  async addView(storyId: string, viewerId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('story_views')
      .select('id')
      .eq('story_id', storyId)
      .eq('viewer_id', viewerId)
      .maybeSingle()
    if (existing) return
    await supabase.from('story_views').insert({ story_id: storyId, viewer_id: viewerId })
  },

  async getViews(storyId: string): Promise<any[]> {
    const { data } = await supabase
      .from('story_views')
      .select('*, viewer:users!story_views_viewer_id_fkey(*)')
      .eq('story_id', storyId)
      .order('created_at', { ascending: false })
    return data || []
  },

  async cleanupExpired(): Promise<number> {
    const now = new Date().toISOString()
    const { data: expired } = await supabase
      .from('stories')
      .select('id')
      .lt('expires_at', now)
    if (!expired?.length) return 0
    const ids = expired.map(s => s.id)
    await supabase.from('story_views').delete().in('story_id', ids)
    await supabase.from('stories').delete().in('id', ids)
    return ids.length
  },
}
