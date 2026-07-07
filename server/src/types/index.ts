export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  profile_picture: string
  bio: string
  email_verified: boolean
  account_status: 'active' | 'locked' | 'suspended' | 'disabled'
  failed_login_attempts: number
  lockout_until: Date | null
  created_at: Date
  updated_at: Date
  last_login: Date | null
}

export interface Session {
  id: string
  user_id: string
  refresh_token: string
  user_agent: string
  ip_address: string
  expires_at: Date
  created_at: Date
}

export interface PasswordReset {
  id: string
  user_id: string
  token: string
  expires_at: Date
  used: boolean
  created_at: Date
}

export interface EmailVerification {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
}

export interface JwtPayload {
  sub: string
  email: string
  username: string
  type: 'access' | 'refresh'
}

export interface AuthRequest {
  userId: string
  email: string
  username: string
}

// ── Messaging ───────────────────────────────────────────
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file'
  | 'shared_post' | 'shared_reel' | 'business_share'
  | 'location' | 'contact'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen' | 'failed'

export type ConversationType = 'direct' | 'group'
export type ConversationStatus = 'active' | 'pending' | 'archived'

export interface Conversation {
  id: string
  type: ConversationType
  title: string
  status: ConversationStatus
  last_message: string
  last_message_id: string | null
  last_sender_id: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  conversation_id: string
  user_id: string
  last_read_at: string | null
  is_admin: boolean
  joined_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: MessageType
  media_url: string
  media_width: number | null
  media_height: number | null
  media_duration: number | null
  file_name: string
  file_size: number
  mime_type: string
  reply_to: string | null
  post_id: string | null
  business_id: string | null
  status: MessageStatus
  created_at: string
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface ReadReceipt {
  id: string
  user_id: string
  message_id: string
  conversation_id: string
  read_at: string
}

export interface ConversationWithParticipants extends Conversation {
  participants: Array<Participant & { username: string; profile_picture: string }>
  unread_count: number
}

export interface MessageWithSender extends Message {
  sender: { id: string; username: string; profile_picture: string }
  reactions: MessageReaction[]
  reply_to_message: Pick<Message, 'id' | 'content' | 'sender_id' | 'message_type'> | null
}

// ── Explore / Interests ─────────────────────────────────
export type ExploreEventType = 'like' | 'unlike' | 'save' | 'unsave' | 'share'
  | 'watch_start' | 'watch_25' | 'watch_50' | 'watch_75' | 'watch_complete'
  | 'skip' | 'repost' | 'comment' | 'view' | 'click' | 'dwell_3s' | 'dwell_10s' | 'dwell_30s'

// ── WebSocket Events ────────────────────────────────────
export interface WsTypingEvent {
  event: 'typing' | 'stop_typing'
  conversation_id: string
  user_id: string
}

export interface WsMessageEvent {
  event: 'new_message' | 'message_seen' | 'message_delivered'
  conversation_id: string
  message?: MessageWithSender
  message_id?: string
  user_id?: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthRequest
    }
  }
}
