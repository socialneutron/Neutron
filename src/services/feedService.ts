/**
 * services/feedService.ts
 * API client for the feed/explore backend endpoints.
 * Falls back to Supabase mock when VITE_API_URL is not set.
 */

import api from '../lib/api'
import type { PostWithAuthor, User } from '../types/database'
import { postService } from './postService'

const hasBackend = !!import.meta.env.VITE_API_URL

function mapBackendUser(u: any): User {
  return {
    id: u._id || u.id || '',
    username: u.username || 'unknown',
    display_name: u.displayName || u.username || 'Unknown',
    avatar_url: u.profilePicture?.url || u.avatar_url || '',
    banner_url: '',
    bio: u.bio || '',
    website: '',
    location: '',
    is_verified: u.isVerified || false,
    followers_count: u.followersCount || 0,
    following_count: u.followingCount || 0,
    posts_count: u.postsCount || 0,
    created_at: u.createdAt || new Date().toISOString(),
    updated_at: u.updatedAt || new Date().toISOString(),
  }
}

function mapBackendPost(p: any): PostWithAuthor {
  const author = p.author
    ? typeof p.author === 'object' && p.author.username
      ? mapBackendUser(p.author)
      : mapBackendUser({ _id: p.author })
    : mapBackendUser({})

  return {
    id: p._id || p.id || '',
    post_code: p.postCode || 0,
    author_id: author.id,
    title: p.caption || p.title || '',
    body: p.caption || p.body || '',
    category: '',
    category_color: '',
    tags: p.hashtags || p.tags || [],
    image_url: p.media?.[0]?.url || p.image_url || '',
    images: Array.isArray(p.media) ? p.media.map((m: any) => m.url).filter(Boolean) : (Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : [])),
    likes_count: p.likesCount || p.likes_count || 0,
    comments_count: p.commentsCount || p.comments_count || 0,
    reposts_count: p.sharesCount || p.reposts_count || 0,
    bookmarks_count: p.savesCount || p.bookmarks_count || 0,
    is_repost: false,
    repost_of: null,
    created_at: p.createdAt || p.created_at || new Date().toISOString(),
    updated_at: p.updatedAt || p.updated_at || new Date().toISOString(),
    author,
    is_liked: p.isLiked || false,
    is_bookmarked: p.isSaved || false,
    is_reposted: p.isReposted || false,
  }
}

export interface FeedResponse {
  posts: PostWithAuthor[]
  next_cursor: string | null
  has_more: boolean
}

export interface ExploreData {
  trending: PostWithAuthor[]
  tags: Array<{ tag: string; count: number; post_count: number }>
  suggested_users: any[]
}

export interface SearchResults {
  posts: PostWithAuthor[]
  users: any[]
}

export const feedService = {
  async getForYouFeed(cursor?: string, limit = 20): Promise<FeedResponse> {
    if (!hasBackend) {
      const posts = await postService.getFeed(0, limit)
      return { posts, next_cursor: null, has_more: posts.length === limit }
    }
    const res = await api.get('/feed/home', { cursor, limit })
    return {
      posts: (res.posts || []).map(mapBackendPost),
      next_cursor: res.next_cursor,
      has_more: res.has_more,
    }
  },

  async getFollowingFeed(cursor?: string, limit = 20): Promise<FeedResponse> {
    if (!hasBackend) {
      const posts = await postService.getFeed(0, limit)
      return { posts, next_cursor: null, has_more: posts.length === limit }
    }
    const res = await api.get('/feed/following', { cursor, limit })
    return {
      posts: (res.posts || []).map(mapBackendPost),
      next_cursor: res.next_cursor,
      has_more: res.has_more,
    }
  },

  async getExploreData(): Promise<ExploreData> {
    if (!hasBackend) {
      const posts = await postService.getFeed(0, 8)
      return { trending: posts, tags: [], suggested_users: [] }
    }
    const res = await api.get('/explore')
    return {
      trending: (res.trending || []).map(mapBackendPost),
      tags: res.tags || [],
      suggested_users: res.suggested_users || [],
    }
  },

  async getTrendingFeed(limit = 10): Promise<PostWithAuthor[]> {
    if (!hasBackend) {
      return postService.getEngagementFeed(0, limit)
    }
    const res = await api.get('/explore/trending', { limit })
    return (res.posts || []).map(mapBackendPost)
  },

  async getTrendingTags(limit = 20): Promise<Array<{ tag: string; count: number }>> {
    if (!hasBackend) return []
    const res = await api.get('/explore/tags', { limit })
    return res.tags || []
  },

  async getSuggestedUsers(limit = 20): Promise<any[]> {
    if (!hasBackend) return []
    const res = await api.get('/explore/suggested', { limit })
    return (res.users || []).map(mapBackendUser)
  },

  async searchExplore(query: string, type?: string, limit = 20): Promise<SearchResults> {
    if (!hasBackend) {
      const posts = await postService.search(query, 0, limit)
      return { posts, users: [] }
    }
    const res = await api.get('/explore/search', { q: query, type, limit })
    return {
      posts: (res.posts || []).map(mapBackendPost),
      users: (res.users || []).map(mapBackendUser),
    }
  },

  async trackEvent(postId: string, eventType: string, metadata?: Record<string, any>): Promise<void> {
    if (!hasBackend) return
    try {
      await api.post('/events', { post_id: postId, event_type: eventType, metadata })
    } catch {
      // Silently fail — don't block UI for tracking
    }
  },
}
