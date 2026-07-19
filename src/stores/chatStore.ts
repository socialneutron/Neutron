import { create } from 'zustand'

export interface ChatMessage {
  id: string
  senderId: string
  text: string
  timestamp: Date
  status: 'sending' | 'delivered' | 'read'
}

export interface ChatConversation {
  id: string
  sessionId: string
  participant: {
    id: string
    username: string
    avatar: string
    online: boolean
    isVerified: boolean
  }
  messages: ChatMessage[]
  unreadCount: number
  lastMessage?: string
  lastMessageTime?: Date
  createdAt: Date
}

export interface MessageRequest {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  senderHandle: string
  isVerified: boolean
  preview: string
  timestamp: Date
  status: 'pending' | 'accepted' | 'declined'
}

interface ChatState {
  conversations: ChatConversation[]
  messageRequests: MessageRequest[]
  activePopupId: string | null

  addConversation: (conv: ChatConversation) => void
  updateConversation: (id: string, updates: Partial<ChatConversation>) => void
  addMessage: (convId: string, msg: ChatMessage) => void
  setActivePopup: (id: string | null) => void
  getOrCreateConversation: (participant: { id: string; username: string; avatar: string; online: boolean; isVerified: boolean }) => ChatConversation

  addMessageRequest: (req: Omit<MessageRequest, 'id' | 'timestamp' | 'status'>) => void
  acceptMessageRequest: (reqId: string) => ChatConversation | null
  declineMessageRequest: (reqId: string) => void
  getPendingRequestCount: () => number

  reset: () => void
}

function generateSessionId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = 'CHAT-'
  for (let i = 0; i < 6; i++) {
    if (i === 3) id += '-'
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

const SEED_REQUESTS: MessageRequest[] = [
  {
    id: 'req_seed_1',
    senderId: 'user_aria',
    senderName: 'Aria Chen',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    senderHandle: '@ariachen',
    isVerified: true,
    preview: 'Hey! Loved your graph on DeFi yields. Want to collab?',
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    status: 'pending',
  },
  {
    id: 'req_seed_2',
    senderId: 'user_kai',
    senderName: 'Kai Nakamura',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    senderHandle: '@kaiweb3',
    isVerified: false,
    preview: 'Sent you a marketplace offer on the Neuro Node #42',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    status: 'pending',
  },
  {
    id: 'req_seed_3',
    senderId: 'user_zara',
    senderName: 'Zara Okonkwo',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    senderHandle: '@zarabuilds',
    isVerified: true,
    preview: 'Can I feature your portfolio in my newsletter?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    status: 'pending',
  },
]

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messageRequests: SEED_REQUESTS,
  activePopupId: null,

  addConversation: (conv) => set((s) => ({
    conversations: [conv, ...s.conversations],
  })),

  updateConversation: (id, updates) => set((s) => ({
    conversations: s.conversations.map(c => c.id === id ? { ...c, ...updates } : c),
  })),

  addMessage: (convId, msg) => set((s) => ({
    conversations: s.conversations.map(c => {
      if (c.id !== convId) return c
      const messages = [...c.messages, msg]
      return {
        ...c,
        messages,
        lastMessage: msg.text,
        lastMessageTime: msg.timestamp,
      }
    }),
  })),

  setActivePopup: (id) => set({ activePopupId: id }),

  getOrCreateConversation: (participant) => {
    const existing = get().conversations.find(
      c => c.participant.id === participant.id
    )
    if (existing) return existing

    const newConv: ChatConversation = {
      id: `conv_${Math.random().toString(36).substring(2, 9)}`,
      sessionId: generateSessionId(),
      participant,
      messages: [],
      unreadCount: 0,
      createdAt: new Date(),
    }
    set((s) => ({ conversations: [newConv, ...s.conversations] }))
    return newConv
  },

  addMessageRequest: (req) => set((s) => ({
    messageRequests: [
      {
        ...req,
        id: `req_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(),
        status: 'pending' as const,
      },
      ...s.messageRequests,
    ],
  })),

  acceptMessageRequest: (reqId) => {
    const req = get().messageRequests.find(r => r.id === reqId)
    if (!req) return null

    const conv = get().getOrCreateConversation({
      id: req.senderId,
      username: req.senderName,
      avatar: req.senderAvatar,
      online: true,
      isVerified: req.isVerified,
    })

    set((s) => ({
      messageRequests: s.messageRequests.map(r =>
        r.id === reqId ? { ...r, status: 'accepted' as const } : r
      ),
    }))

    return conv
  },

  declineMessageRequest: (reqId) => set((s) => ({
    messageRequests: s.messageRequests.map(r =>
      r.id === reqId ? { ...r, status: 'declined' as const } : r
    ),
  })),

  getPendingRequestCount: () => get().messageRequests.filter(r => r.status === 'pending').length,

  getTotalUnread: () => get().conversations.reduce((sum, c) => sum + c.unreadCount, 0),

  reset: () => set({ conversations: [], messageRequests: [], activePopupId: null }),
}))
