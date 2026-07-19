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
  const { data: existing } = await supabase.from('users').select('id, username, display_name').eq('id', userId).maybeSingle()
  if (!existing) {
    // Only insert if user doesn't exist at all
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
  // Do NOT overwrite existing user profiles with Guest data
}

export const postService = {
  async create(authorId: string, data: {
    title: string; body?: string; category?: string; category_color?: string;
    tags?: string[]; image_url?: string; images?: string[]; location?: string;
    visibility?: 'public' | 'private' | 'followers';
    author_username?: string; author_display_name?: string; author_avatar?: string;
    is_repost?: boolean; repost_of?: string;
  }): Promise<Post | null> {
    // Skip media upload for base64 data URLs (stored directly in posts.images)
    let mediaId: string | null = null

    let authorUsername = data.author_username || ''
    let authorDisplayName = data.author_display_name || ''
    let authorAvatar = data.author_avatar || ''

    // Parallel: look up real user if needed + ensure user exists
    if (!authorUsername || /^Guest_/.test(authorUsername)) {
      const { data: realUser } = await supabase.from('users').select('username, display_name, avatar_url').eq('id', authorId).maybeSingle()
      if (realUser) {
        authorUsername = realUser.username || authorUsername
        authorDisplayName = realUser.display_name || authorDisplayName
        authorAvatar = realUser.avatar_url || authorAvatar
      }
    }

    // Only ensure user exists if we don't have a valid username
    if (!authorUsername || /^Guest_/.test(authorUsername)) {
      await ensureUserExists(authorId, authorDisplayName, authorUsername, authorAvatar)
    }

    const allImages = data.images || (data.image_url ? [data.image_url] : [])

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id: authorId,
        media_id: mediaId,
        title: data.title,
        body: data.body || '',
        category: data.category || '',
        category_color: data.category_color || '',
        tags: data.tags || ['General'],
        image_url: data.image_url || '',
        images: allImages,
        location: data.location || '',
        visibility: data.visibility || 'public',
        author_username: authorUsername,
        author_display_name: authorDisplayName,
        author_avatar: authorAvatar,
        is_repost: data.is_repost || false,
        repost_of: data.repost_of || null,
      })
      .select('*, author:users!posts_author_id_fkey(*)')
      .single()
    if (error) return null
    const author = post.author?.username ? post.author : await resolveAuthor(post)
    const result = { ...post, author } as PostWithAuthor
    supabase.rpc('increment_count', { table_name: 'users', column_name: 'posts_count', row_id: authorId }).catch(() => {})
    return result
  },

  async getById(id: string, userId?: string): Promise<PostWithAuthor | null> {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .eq('id', id)
      .single()
    if (error) return null

    const author = post.author?.username ? post.author : await resolveAuthor(post)
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
    let query = supabase
      .from('posts')
      .select('*, author:users!posts_author_id_fkey(*)')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (userId) {
      query = query.or(`visibility.eq.public,and(visibility.eq.followers,author_id.eq.${userId}),author_id.eq.${userId}`)
    } else {
      query = query.eq('visibility', 'public')
    }

    const { data: posts, error } = await query
    if (error) return []
    if (!posts?.length) return []

    const resolved = posts.map(p => {
      if (p.author && p.author.username) return p
      return { ...p, author: fallbackAuthor(p) }
    }) as PostWithAuthor[]

    if (verifiedOnly) return filterVerifiedOnly(resolved)
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
    let results = data.map(p => p.author?.username ? p : { ...p, author: fallbackAuthor(p) }) as PostWithAuthor[]
    if (verifiedOnly) results = filterVerifiedOnly(results)
    return results
  },

  async delete(postId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', userId)
    if (!error) {
      await Promise.all([
        supabase.from('likes').delete().eq('post_id', postId),
        supabase.from('comments').delete().eq('post_id', postId),
        supabase.from('bookmarks').delete().eq('post_id', postId),
        supabase.from('reposts').delete().eq('post_id', postId),
        supabase.from('notifications').delete().eq('post_id', postId),
        supabase.rpc('decrement_count', { table_name: 'users', column_name: 'posts_count', row_id: userId }),
      ])
    }
    return !error
  },

  async getEngagementFeed(page = 0, limit = 20, userId?: string): Promise<PostWithAuthor[]> {
    const allPosts = await this.getFeed(0, 50, userId)
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
    let results = data.map(p => p.author?.username ? p : { ...p, author: fallbackAuthor(p) }) as PostWithAuthor[]
    if (verifiedOnly) results = filterVerifiedOnly(results)
    return results
  },
}
