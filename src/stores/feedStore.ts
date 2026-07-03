import { create } from 'zustand'
import type { PostWithAuthor } from '../types/database'
import { postService } from '../services'

interface FeedState {
  posts: PostWithAuthor[]
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
  loading: false,
  page: 0,
  hasMore: true,

  setPosts: (posts) => set({ posts }),

  addPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),

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
    set({ loading: true, page: 0, hasMore: true })
    const posts = await postService.getFeed(0, 20, userId)
    set({ posts, loading: false, hasMore: posts.length === 20 })
  },

  reset: () => set({ posts: [], page: 0, hasMore: true, loading: false }),
}))
