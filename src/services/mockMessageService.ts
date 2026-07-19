/**
 * localStorage persistence for E2E encrypted chat conversations.
 * Replaces the broken backend API when no server is available.
 */
import type { Conversation, Message } from '../messages/types';

const STORAGE_KEY = 'neutron_messages';

function loadConversations(): Conversation[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Restore Date objects from ISO strings
    for (const conv of data) {
      if (conv.messages) {
        for (const msg of conv.messages) {
          if (msg.timestamp && typeof msg.timestamp === 'string') {
            msg.timestamp = new Date(msg.timestamp);
          }
          if (msg.readAt && typeof msg.readAt === 'string') {
            msg.readAt = new Date(msg.readAt);
          }
        }
      }
    }
    return data;
  } catch {
    return null;
  }
}

function saveConversations(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    /* quota exceeded */
  }
}

export const mockMessageService = {
  getConversations(): Conversation[] | null {
    return loadConversations();
  },

  saveConversations(conversations: Conversation[]) {
    saveConversations(conversations);
  },

  addMessage(conversations: Conversation[], convId: string, message: Message): Conversation[] {
    const updated = conversations.map((conv) => {
      if (conv.id === convId) {
        return { ...conv, messages: [...conv.messages, message] };
      }
      return conv;
    });
    saveConversations(updated);
    return updated;
  },

  markRead(conversations: Conversation[], convId: string): Conversation[] {
    const updated = conversations.map((conv) => {
      if (conv.id === convId) {
        return { ...conv, unreadCount: 0, messages: conv.messages.map((m) => ({ ...m, status: 'read' as const })) };
      }
      return conv;
    });
    saveConversations(updated);
    return updated;
  },

  deleteConversation(conversations: Conversation[], convId: string): Conversation[] {
    const updated = conversations.filter((c) => c.id !== convId);
    saveConversations(updated);
    return updated;
  },

  updateConversation(conversations: Conversation[], convId: string, updates: Partial<Conversation>): Conversation[] {
    const updated = conversations.map((conv) => {
      if (conv.id === convId) {
        return { ...conv, ...updates };
      }
      return conv;
    });
    saveConversations(updated);
    return updated;
  },

  addConversation(conversations: Conversation[], conv: Conversation): Conversation[] {
    const updated = [conv, ...conversations];
    saveConversations(updated);
    return updated;
  },
};
