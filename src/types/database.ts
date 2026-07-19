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
  // Auth fields
  email?: string
  password_hash?: string
  auth_provider?: 'email' | 'google' | 'github' | 'apple' | 'microsoft' | 'demo'
  two_factor_enabled?: boolean
  two_factor_hash?: string
  two_factor_expires_at?: string
  two_factor_attempts?: number
  interests?: string[]
  reputation?: number
  role?: string
}

export interface Post {
  id: string
  post_code: number
  author_id: string
  title: string
  body: string
  category: string
  category_color: string
  tags: string[]
  image_url: string
  images: string[]
  likes_count: number
  comments_count: number
  reposts_count: number
  bookmarks_count: number
  visibility: 'public' | 'private' | 'followers'
  author_username: string
  author_display_name: string
  author_avatar: string
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
  replies_count: number
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

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'repost' | 'reply' | 'post_share'

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

// ── Workflow types ─────────────────────────────────────────
export interface Workflow {
  id: string
  user_id: string
  name: string
  tags: any[]
  connections: any[]
  next_id: number
  created_at: string
  updated_at: string
}

// ── Company/Supplier types ─────────────────────────────────
export interface Company {
  id: string
  name: string
  handle: string
  logo: string
  description: string
  category: string
  images: string[]
  commodities: { item: string; price: string; image?: string }[]
  email: string
  phone: string
  location: string
  website: string
  rating: number
  registered_by: string
  created_at: string
  updated_at: string
}

// ── Product types ──────────────────────────────────────────
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  condition: 'new' | 'used' | 'refurbished'
  images: string[]
  seller_id: string
  seller_name: string
  seller_avatar: string
  stock: number
  location: string
  created_at: string
  updated_at: string
}

// ── Ebook types ───────────────────────────────────────────
export interface Ebook {
  id: string
  title: string
  author: string
  description: string
  cover_url: string
  price: number
  category: string
  pages: number
  file_url: string
  sample_url: string
  rating: number
  sales_count: number
  published_by?: string
  created_at: string
  updated_at: string
}

// ── User Ebook (purchased/uploaded) ──────────────────────
export interface UserEbook {
  id: string
  user_id: string
  ebook_id: string
  progress: number
  highlights: EbookHighlight[]
  last_read_at: string
  purchased_at: string
  // Joined
  ebook?: Ebook
}

// ── Ebook Highlight ──────────────────────────────────────
export interface EbookHighlight {
  id: string
  page: number
  text: string
  color: string
  note?: string
  created_at: string
}

// ── Magazine Review ─────────────────────────────────────
export interface MagazineReview {
  id: string
  ebook_id: string
  user_id: string
  user_name: string
  user_avatar: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
}

// ── Generic Listing Review (all 4 categories) ──────────
export interface ListingReview {
  id: string
  item_type: 'company' | 'product' | 'ebook' | 'talent'
  item_id: string
  user_id: string
  user_name: string
  user_avatar: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
}

// ── Message types ──────────────────────────────────────────
export interface Conversation {
  id: string
  user_id: string
  participant_id: string
  unread_count: number
  disappearing_setting: number
  is_blocked: boolean
  is_reported: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  text: string
  type: string
  status: 'sending' | 'delivered' | 'read'
  is_encrypted: boolean
  created_at: string
}

// ── Business Tracker types ─────────────────────────────────
export interface TrackerMetric {
  id: string
  name: string
  color: string
  target: number
  unit: string
  icon: string
}

export interface BusinessTracker {
  id: string
  user_id: string
  name: string
  metrics: TrackerMetric[]
  created_at: string
  updated_at: string
}

export interface BusinessEntry {
  id: string
  tracker_id: string
  user_id: string
  date: string
  values: Record<string, number>
  notes: string
  created_at: string
  updated_at: string
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
      workflows: { Row: Workflow; Insert: Partial<Workflow>; Update: Partial<Workflow> }
      companies: { Row: Company; Insert: Partial<Company>; Update: Partial<Company> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      ebooks: { Row: Ebook; Insert: Partial<Ebook>; Update: Partial<Ebook> }
      user_ebooks: { Row: UserEbook; Insert: Partial<UserEbook>; Update: Partial<UserEbook> }
      magazine_reviews: { Row: MagazineReview; Insert: Partial<MagazineReview>; Update: Partial<MagazineReview> }
      listing_reviews: { Row: ListingReview; Insert: Partial<ListingReview>; Update: Partial<ListingReview> }
      conversations: { Row: Conversation; Insert: Partial<Conversation>; Update: Partial<Conversation> }
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> }
      business_trackers: { Row: BusinessTracker; Insert: Partial<BusinessTracker>; Update: Partial<BusinessTracker> }
      business_entries: { Row: BusinessEntry; Insert: Partial<BusinessEntry>; Update: Partial<BusinessEntry> }
    }
  }
}
