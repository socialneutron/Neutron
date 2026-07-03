export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  online: boolean;
  lastSeen?: string;
  isVerified: boolean;
  statusText: string;
  encryptionKeyFingerprint: string;
  isGroup?: boolean;
}

export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'contact' | 'video';

export interface MessageReaction {
  user: string;
  emoji: string;
}

export interface Attachment {
  name: string;
  type: string;
  size: string;
  url?: string;
  rawBytesSimulated?: string; // Hex representation of encrypted payload
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  text: string; // Plaintext when decrypted
  encryptedPayload: string; // Base64 or Hex mock ciphertext
  timestamp: Date | string;
  type: MessageType;
  attachment?: Attachment;
  voiceDuration?: string; // If voice
  reactions: MessageReaction[];
  status: 'sending' | 'delivered' | 'read';
  disappearingTimer?: number; // In seconds (undefined or 0 means infinite)
  readAt?: Date;
  scrambled?: boolean; // For typewriter/decryption glitch effect
  deletedForMe?: boolean;
  deletedForEveryone?: boolean;
}

export interface Conversation {
  id: string;
  participant: UserProfile;
  messages: Message[];
  unreadCount: number;
  sharedEncryptionKey: string;
  keyExchangeCompleted: boolean;
  disappearingSetting: number; // 0 = permanent, or seconds: 5, 30, 60
  isBlocked: boolean;
  isReported: boolean;
  isGroup?: boolean;
  groupMembers?: string[];
}

export interface ActiveSession {
  id: string;
  deviceName: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface CryptographicLog {
  id: string;
  timestamp: string;
  type: 'keygen' | 'handshake' | 'encrypt' | 'decrypt' | 'ratchet';
  details: string;
  algorithm: string;
}
