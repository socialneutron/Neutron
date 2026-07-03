import { supabase } from '../lib/supabase'
import type { Post, PostWithAuthor } from '../types/database'

export const postService = {
  async create(authorId: string, data: { title: string; body?: string; category?: string; category_color?: string; tags?: string[]; image_url?: string }): Promise<Post | null> {
    const { data: post, error } = await supabase
      .from('posts')
      .insert({ author_id: authorId, ...data })
      .select()
      .single()
    if (error) return null
    await supabase.rpc('increment_count', { table_name: 'users', column_name: 'posts_count', row_id: authorId })
    return post
  },

  async getById(id: string, userId?: string): Promise<PostWithAuthor | null> {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .eq('id', id)
      .single()
    if (error) return null

    const result: PostWithAuthor = { ...post, author: post.author as any }

    if (userId) {
      const [liked, bookmarked, reposted] = await Promise.all([
        supabase.from('likes').select('id').eq('user_id', userId).eq('post_id', id).maybeSingle(),
        supabase.from('bookmarks').select('id').eq('user_id', userId).eq('post_id', id).maybeSingle(),
        supabase.from('reposts').select('id').eq('user_id', userId).eq('post_id', id).maybeSingle(),
      ])
      result.is_liked = !!liked.data
      result.is_bookmarked = !!bookmarked.data
      result.is_reposted = !!reposted.data
    }

    return result
  },

  async getFeed(page = 0, limit = 20, userId?: string): Promise<PostWithAuthor[]> {
    const from = page * limit
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []

    if (!userId || !posts?.length) return (posts || []) as any

    const postIds = posts.map(p => p.id)
    const [likesRes, bookmarksRes, repostsRes] = await Promise.all([
      supabase.from('likes').select('post_id').eq('user_id', userId).in('post_id', postIds),
      supabase.from('bookmarks').select('post_id').eq('user_id', userId).in('post_id', postIds),
      supabase.from('reposts').select('post_id').eq('user_id', userId).in('post_id', postIds),
    ])

    const likedSet = new Set(likesRes.data?.map(l => l.post_id))
    const bookmarkedSet = new Set(bookmarksRes.data?.map(b => b.post_id))
    const repostedSet = new Set(repostsRes.data?.map(r => r.post_id))

    return posts.map(p => ({
      ...p,
      author: p.author as any,
      is_liked: likedSet.has(p.id),
      is_bookmarked: bookmarkedSet.has(p.id),
      is_reposted: repostedSet.has(p.id),
    })) as PostWithAuthor[]
  },

  async getByCategory(category: string, page = 0, limit = 20): Promise<PostWithAuthor[]> {
    const from = page * limit
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []
    return (data || []) as any
  },

  async delete(postId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', userId)
    if (!error) await supabase.rpc('decrement_count', { table_name: 'users', column_name: 'posts_count', row_id: userId })
    return !error
  },

  async search(query: string, page = 0, limit = 20): Promise<PostWithAuthor[]> {
    const from = page * limit
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []
    return (data || []) as any
  },
}
