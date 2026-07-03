import { supabase } from '../lib/supabase'
import type { Notification, NotificationType } from '../types/database'

export const notificationService = {
  async create(userId: string, actorId: string, type: NotificationType, postId?: string, commentId?: string): Promise<void> {
    if (userId === actorId) return // Don't notify yourself
    await supabase.from('notifications').insert({
      user_id: userId,
      actor_id: actorId,
      type,
      post_id: postId || null,
      comment_id: commentId || null,
    })
  },

  async getForUser(userId: string, page = 0, limit = 30): Promise<Notification[]> {
    const from = page * limit
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:users!notifications_actor_id_fkey(*), post:posts(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []
    return (data || []) as any
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    return count || 0
  },

  async markAsRead(userId: string, notificationId?: string): Promise<void> {
    if (notificationId) {
      await supabase.from('notifications').update({ read: true }).eq('id', notificationId).eq('user_id', userId)
    } else {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
  },

  subscribe(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => callback(payload.new as Notification))
      .subscribe()
  },
}
