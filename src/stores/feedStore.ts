import { create } from 'zustand'
import type { PostWithAuthor } from '../types/database'
import { feedService, type FeedResponse, type ExploreData } from '../services/feedService'
import { postService } from '../services'

interface FeedState {
  posts: PostWithAuthor[]
  localPostIds: Set<string>
  loading: boolean
  cursor: string | null
  hasMore: boolean
  feedType: 'forYou' | 'following'

  exploreData: ExploreData
  exploreLoading: boolean

  searchQuery: string
  searchCategory: string
  searchResults: PostWithAuthor[]
  searchUsers: any[]
  searchLoading: boolean

  setFeedType: (type: 'forYou' | 'following') => void
  setPosts: (posts: PostWithAuthor[]) => void
  addPost: (post: PostWithAuthor) => void
  updatePost: (postId: string, updates: Partial<PostWithAuthor>) => void
  removePost: (postId: string) => void
  loadMore: (userId?: string) => Promise<void>
  refresh: (userId?: string) => Promise<void>
  fetchExploreData: () => Promise<void>
  searchExplore: (query: string, category?: string) => Promise<void>
  clearSearch: () => void
  reset: () => void
}

const INITIAL_EXPLORE: ExploreData = {
  trending: [],
  tags: [],
  suggested_users: [],
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  localPostIds: new Set<string>(),
  loading: false,
  cursor: null,
  hasMore: true,
  feedType: 'forYou',

  exploreData: INITIAL_EXPLORE,
  exploreLoading: false,

  searchQuery: '',
  searchCategory: 'all',
  searchResults: [],
  searchUsers: [],
  searchLoading: false,

  setFeedType: (type) => {
    set({ feedType: type, posts: [], cursor: null, hasMore: true })
    get().refresh()
  },

  setPosts: (posts) => set({ posts }),

  addPost: (post) => set((s) => {
    const newLocalIds = new Set(s.localPostIds)
    newLocalIds.add(post.id)
    return { posts: [post, ...s.posts], localPostIds: newLocalIds }
  }),

  updatePost: (postId, updates) => set((s) => ({
    posts: s.posts.map(p => p.id === postId ? { ...p, ...updates } : p),
  })),

  removePost: (postId) => set((s) => ({
    posts: s.posts.filter(p => p.id !== postId),
  })),

  loadMore: async (userId) => {
    const { cursor, posts, hasMore, loading, feedType } = get()
    if (loading || !hasMore) return
    set({ loading: true })

    try {
      let result: FeedResponse
      if (feedType === 'forYou') {
        result = await feedService.getForYouFeed(cursor || undefined)
      } else {
        result = await feedService.getFollowingFeed(cursor || undefined)
      }

      set({
        posts: [...posts, ...result.posts],
        cursor: result.next_cursor,
        hasMore: result.has_more,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  refresh: async (userId) => {
    const { posts: currentPosts, localPostIds, feedType } = get()
    // Only show loading spinner if no posts exist yet
    if (currentPosts.length === 0) set({ loading: true })
    set({ cursor: null, hasMore: true })

    try {
      let result: FeedResponse
      if (feedType === 'forYou') {
        result = await feedService.getForYouFeed(undefined)
      } else {
        result = await feedService.getFollowingFeed(undefined)
      }

      const localOnly = currentPosts.filter(p => localPostIds.has(p.id))
      const dbIds = new Set(result.posts.map(p => p.id))
      const merged = [...localOnly.filter(p => !dbIds.has(p.id)), ...result.posts]
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      set({
        posts: merged,
        cursor: result.next_cursor,
        hasMore: result.has_more,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  fetchExploreData: async () => {
    set({ exploreLoading: true })
    try {
      const data = await feedService.getExploreData()
      set({ exploreData: data, exploreLoading: false })
    } catch {
      set({ exploreLoading: false })
    }
  },

  searchExplore: async (query, category = 'all') => {
    if (!query.trim()) {
      set({ searchResults: [], searchUsers: [], searchQuery: '', searchCategory: 'all' })
      return
    }
    set({ searchLoading: true, searchQuery: query, searchCategory: category })
    try {
      const type = category === 'tags' ? 'posts' : category
      const results = await feedService.searchExplore(query, type)
      set({
        searchResults: results.posts,
        searchUsers: results.users,
        searchLoading: false,
      })
    } catch {
      set({ searchLoading: false })
    }
  },

  clearSearch: () => set({
    searchQuery: '',
    searchCategory: 'all',
    searchResults: [],
    searchUsers: [],
  }),

  reset: () => set({
    posts: [],
    localPostIds: new Set(),
    cursor: null,
    hasMore: true,
    loading: false,
    feedType: 'forYou',
    exploreData: INITIAL_EXPLORE,
    exploreLoading: false,
    searchQuery: '',
    searchCategory: 'all',
    searchResults: [],
    searchUsers: [],
    searchLoading: false,
  }),
}))
