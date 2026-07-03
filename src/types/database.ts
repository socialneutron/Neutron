// ============================================================
// NEUTRON SOCIAL – Database Types
// ============================================================

export interface User {
  id: string
  username: string
  display_name: string
  avatar_url: string
  banner_url: string
  bio: string
  website: string
  location: string
  is_verified: boolean
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: string
  title: string
  body: string
  category: string
  category_color: string
  tags: string[]
  image_url: string
  likes_count: number
  comments_count: number
  reposts_count: number
  bookmarks_count: number
  is_repost: boolean
  repost_of: string | null
  created_at: string
  updated_at: string
  // Joined
  author?: User
  reposted_post?: Post
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  body: string
  parent_id: string | null
  likes_count: number
  created_at: string
  updated_at: string
  // Joined
  author?: User
}

export interface Like {
  id: string
  user_id: string
  post_id: string | null
  comment_id: string | null
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Repost {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'repost'

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: NotificationType
  post_id: string | null
  comment_id: string | null
  read: boolean
  created_at: string
  // Joined
  actor?: User
  post?: Post
}

// ── Extended types for UI ──────────────────────────────────
export interface PostWithAuthor extends Post {
  author: User
  is_liked?: boolean
  is_bookmarked?: boolean
  is_reposted?: boolean
}

export interface CommentWithAuthor extends Comment {
  author: User
  is_liked?: boolean
}

// ── Database helper types ──────────────────────────────────
export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> }
      posts: { Row: Post; Insert: Partial<Post>; Update: Partial<Post> }
      comments: { Row: Comment; Insert: Partial<Comment>; Update: Partial<Comment> }
      likes: { Row: Like; Insert: Partial<Like>; Update: Partial<Like> }
      bookmarks: { Row: Bookmark; Insert: Partial<Bookmark>; Update: Partial<Bookmark> }
      follows: { Row: Follow; Insert: Partial<Follow>; Update: Partial<Follow> }
      reposts: { Row: Repost; Insert: Partial<Repost>; Update: Partial<Repost> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
    }
  }
}
