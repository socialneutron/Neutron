import { create } from 'zustand'
import type { PostWithAuthor } from '../types/database'
import { postService } from '../services'

interface FeedState {
  posts: PostWithAuthor[]
  localPostIds: Set<string>
  loading: boolean
  page: number
  hasMore: boolean
  setPosts: (posts: PostWithAuthor[]) => void
  addPost: (post: PostWithAuthor) => void
  updatePost: (postId: string, updates: Partial<PostWithAuthor>) => void
  removePost: (postId: string) => void
  loadMore: (userId?: string) => Promise<void>
  refresh: (userId?: string) => Promise<void>
  reset: () => void
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  localPostIds: new Set<string>(),
  loading: false,
  page: 0,
  hasMore: true,

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
    const { page, posts, hasMore, loading } = get()
    if (loading || !hasMore) return
    set({ loading: true })
    const nextPage = page + 1
    const newPosts = await postService.getFeed(nextPage, 20, userId)
    set({
      posts: [...posts, ...newPosts],
      page: nextPage,
      hasMore: newPosts.length === 20,
      loading: false,
    })
  },

  refresh: async (userId) => {
    const { posts: currentPosts, localPostIds } = get()
    set({ loading: true, page: 0, hasMore: true })
    const dbPosts = await postService.getFeed(0, 20, userId)
    const localOnly = currentPosts.filter(p => localPostIds.has(p.id))
    const dbIds = new Set(dbPosts.map(p => p.id))
    const merged = [...localOnly.filter(p => !dbIds.has(p.id)), ...dbPosts]
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    set({ posts: merged, loading: false, hasMore: dbPosts.length === 20 })
  },

  reset: () => set({ posts: [], localPostIds: new Set(), page: 0, hasMore: true, loading: false }),
}))
