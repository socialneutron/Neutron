import { supabase } from '../lib/supabase'

type AnalyticsEvent = {
  event: string
  user_id: string
  target_id?: string
  metadata?: Record<string, any>
}

export const analyticsService = {
  async track(event: string, userId: string, targetId?: string, metadata?: Record<string, any>): Promise<void> {
    await supabase.from('analytics_events').insert({
      event,
      user_id: userId,
      target_id: targetId || null,
      metadata: metadata || null,
    })
  },

  async getEvents(event: string, userId?: string, limit = 100): Promise<any[]> {
    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('event', event)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (userId) query = query.eq('user_id', userId)
    const { data } = await query
    return data || []
  },

  async getCount(event: string, userId?: string): Promise<number> {
    let query = supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event', event)
    if (userId) query = query.eq('user_id', userId)
    const { count } = await query
    return count || 0
  },

  async getMetricsForPost(postId: string): Promise<{ likes: number; comments: number; shares: number; saves: number }> {
    const [likes, comments, shares, saves] = await Promise.all([
      supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', postId),
      supabase.from('reposts').select('id', { count: 'exact', head: true }).eq('post_id', postId),
      supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('post_id', postId),
    ])
    return {
      likes: likes.count || 0,
      comments: comments.count || 0,
      shares: shares.count || 0,
      saves: saves.count || 0,
    }
  },
}
