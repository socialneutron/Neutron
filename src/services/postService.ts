import { supabase } from '../lib/supabase'
import type { Post, PostWithAuthor, User } from '../types/database'
import { mediaService } from './mediaService'

function filterVerifiedOnly(posts: PostWithAuthor[]): PostWithAuthor[] {
  return posts.filter(p => p.author?.is_verified === true)
}

function fallbackAuthor(post: any): User {
  return {
    id: post.author_id || '',
    username: post.author_username || 'unknown',
    display_name: post.author_display_name || post.author_username || 'Unknown',
    avatar_url: post.author_avatar || '',
    banner_url: '',
    bio: '',
    website: '',
    location: '',
    is_verified: false,
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    created_at: post.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

async function resolveAuthor(post: any): Promise<User> {
  const author = post.author as any
  if (author && author.username) return author
  const { data: user } = await supabase.from('users').select('*').eq('id', post.author_id).maybeSingle()
  if (user) return user as User
  return fallbackAuthor(post)
}

async function ensureUserExists(userId: string, displayName?: string, username?: string, avatarUrl?: string) {
  const { data: existing } = await supabase.from('users').select('id').eq('id', userId).maybeSingle()
  if (!existing) {
    const uname = username || displayName?.toLowerCase().replace(/\s+/g, '_') || 'user'
    await supabase.from('users').insert({
      id: userId,
      username: uname,
      display_name: displayName || uname,
      avatar_url: avatarUrl || '',
      banner_url: '',
      bio: '',
      website: '',
      location: '',
      is_verified: false,
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
}

export const postService = {
  async create(authorId: string, data: {
    title: string; body?: string; category?: string; category_color?: string;
    tags?: string[]; image_url?: string; location?: string;
    visibility?: 'public' | 'private' | 'followers';
    author_username?: string; author_display_name?: string; author_avatar?: string;
  }): Promise<Post | null> {
    let mediaId: string | null = null
    if (data.image_url) {
      mediaId = await mediaService.upload(authorId, 'image/jpeg', data.image_url, { size: 0 })
    }
    await ensureUserExists(authorId, data.author_display_name, data.author_username, data.author_avatar)

    const { data: maxRow } = await supabase.from('posts').select('post_code').order('post_code', { ascending: false }).limit(1).maybeSingle()
    const nextCode = (maxRow?.post_code || 0) + 1
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        post_code: nextCode,
        author_id: authorId,
        media_id: mediaId,
        title: data.title,
        body: data.body || '',
        category: data.category || '',
        category_color: data.category_color || '',
        tags: data.tags || ['General'],
        image_url: data.image_url || '',
        location: data.location || '',
        visibility: data.visibility || 'public',
        author_username: data.author_username || '',
        author_display_name: data.author_display_name || '',
        author_avatar: data.author_avatar || '',
      })
      .select('*, author:users!posts_author_id_fkey(*)')
      .single()
    if (error) return null
    const author = await resolveAuthor(post)
    const result = { ...post, author } as PostWithAuthor
    await supabase.rpc('increment_count', { table_name: 'users', column_name: 'posts_count', row_id: authorId })
    return result
  },

  async getById(id: string, userId?: string): Promise<PostWithAuthor | null> {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .eq('id', id)
      .single()
    if (error) return null

    const author = await resolveAuthor(post)
    const result: PostWithAuthor = { ...post, author }

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

  async getFeed(page = 0, limit = 20, userId?: string, verifiedOnly = false): Promise<PostWithAuthor[]> {
    const from = page * limit
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []
    if (!posts?.length) return []

    let resolved = await Promise.all(posts.map(async p => ({ ...p, author: await resolveAuthor(p) }))) as PostWithAuthor[]
    if (verifiedOnly) resolved = filterVerifiedOnly(resolved)

    if (!userId) return resolved

    const postIds = resolved.map(p => p.id)
    const [likesRes, bookmarksRes, repostsRes] = await Promise.all([
      supabase.from('likes').select('post_id').eq('user_id', userId).in('post_id', postIds),
      supabase.from('bookmarks').select('post_id').eq('user_id', userId).in('post_id', postIds),
      supabase.from('reposts').select('post_id').eq('user_id', userId).in('post_id', postIds),
    ])

    const likedSet = new Set(likesRes.data?.map(l => l.post_id))
    const bookmarkedSet = new Set(bookmarksRes.data?.map(b => b.post_id))
    const repostedSet = new Set(repostsRes.data?.map(r => r.post_id))

    return resolved.map(p => ({
      ...p,
      is_liked: likedSet.has(p.id),
      is_bookmarked: bookmarkedSet.has(p.id),
      is_reposted: repostedSet.has(p.id),
    })) as PostWithAuthor[]
  },

  async getByCategory(category: string, page = 0, limit = 20, verifiedOnly = false): Promise<PostWithAuthor[]> {
    const from = page * limit
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []
    if (!data?.length) return []
    let results = await Promise.all(data.map(async p => ({ ...p, author: await resolveAuthor(p) }))) as PostWithAuthor[]
    if (verifiedOnly) results = filterVerifiedOnly(results)
    return results
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

  async getEngagementFeed(page = 0, limit = 20, userId?: string): Promise<PostWithAuthor[]> {
    const allPosts = await this.getFeed(0, 100, userId)
    const scored = allPosts.map(p => {
      const likes = p.likes_count || 0
      const comments = p.comments_count || 0
      const reposts = p.reposts_count || 0
      const ageHours = (Date.now() - new Date(p.created_at).getTime()) / 3600000
      const engagementScore = likes * 2 + comments * 3 + reposts * 4
      const freshnessBonus = Math.max(0, 10 - ageHours)
      return { ...p, _score: engagementScore + freshnessBonus }
    })
    scored.sort((a, b) => b._score - a._score)
    const from = page * limit
    return scored.slice(from, from + limit)
  },

  async search(query: string, page = 0, limit = 20, verifiedOnly = false): Promise<PostWithAuthor[]> {
    const from = page * limit
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)
    if (error) return []
    if (!data?.length) return []
    let results = await Promise.all(data.map(async p => ({ ...p, author: await resolveAuthor(p) }))) as PostWithAuthor[]
    if (verifiedOnly) results = filterVerifiedOnly(results)
    return results
  },
}
