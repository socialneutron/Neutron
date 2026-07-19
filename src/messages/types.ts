import type { EncryptedEnvelope, CryptoLogEntry } from './crypto/types';

export type { EncryptedEnvelope, CryptoLogEntry };
export type { CryptoLogEntry as CryptographicLog };

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
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: Date | string;
  type: MessageType;
  attachment?: Attachment;
  voiceDuration?: string;
  reactions: MessageReaction[];
  status: 'sending' | 'delivered' | 'read';
  disappearingTimer?: number;
  readAt?: Date;
  deletedForMe?: boolean;
  deletedForEveryone?: boolean;
  encryptedEnvelope?: EncryptedEnvelope;
  isEncrypted?: boolean;
}

export interface Conversation {
  id: string;
  participant: UserProfile;
  messages: Message[];
  unreadCount: number;
  sharedEncryptionKey: string;
  keyExchangeCompleted: boolean;
  disappearingSetting: number;
  isBlocked: boolean;
  isReported: boolean;
  isGroup?: boolean;
  groupMembers?: string[];
  isE2EEEnabled?: boolean;
  peerPublicKey?: string;
  localFingerprint?: string;
  peerFingerprint?: string;
}

export interface ActiveSession {
  id: string;
  deviceName: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}
