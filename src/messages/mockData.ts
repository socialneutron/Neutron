import { UserProfile, Conversation, ActiveSession } from './types';
import { encryptMessage } from './utils/cryptoSim';

// Key pairs
export const MY_PROFILE: UserProfile = {
  id: 'me',
  username: 'Navigator.One',
  avatar: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=150&h=150&q=80',
  online: true,
  isVerified: true,
  statusText: 'Keys rotated. Secure connection live.',
  encryptionKeyFingerprint: 'B4E1:89FF:90C2:D410',
};

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'cyber_bot',
    username: 'You',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80',
    online: true,
    isVerified: true,
    statusText: 'Active and ready for secure testing.',
    encryptionKeyFingerprint: 'CB40:3FF2:778A:8204',
  }
];

// Helper to construct structured encrypted/decrypted historical messages
function createSecMsg(
  id: string,
  senderId: string,
  recipientId: string,
  text: string,
  timeOffsetMin: number,
  key: string,
  type: 'text' | 'image' | 'file' | 'voice' = 'text',
  attachment?: any,
  voiceDuration?: string,
  status: 'sending' | 'delivered' | 'read' = 'read',
  disappearingTimer?: number
): any {
  const timestamp = new Date(Date.now() - timeOffsetMin * 60000);
  const encryptedPayload = encryptMessage(text, key);
  return {
    id,
    senderId,
    recipientId,
    text,
    encryptedPayload,
    timestamp,
    type,
    attachment,
    voiceDuration,
    reactions: [],
    status,
    disappearingTimer,
  };
}

export const INITIAL_CONVERSATIONS = (keys: { [key: string]: string }): Conversation[] => {
  const botKey = keys['cyber_bot'] || 'bot_shared_handshake_key_core';

  return [
    {
      id: 'conv_cyber_bot',
      participant: MOCK_USERS[0], // Cyber Sec Bot
      unreadCount: 0,
      sharedEncryptionKey: botKey,
      keyExchangeCompleted: true,
      disappearingSetting: 0,
      isBlocked: false,
      isReported: false,
      messages: [
        createSecMsg('b1', 'cyber_bot', 'me', 'Welcome to Neutron Secure Hub. This node is end-to-end encrypted under standard protocol X3DH.', 120, botKey),
        createSecMsg('b2', 'me', 'cyber_bot', 'Run a device signature audit on this portal.', 118, botKey),
        createSecMsg('b3', 'cyber_bot', 'me', 'Audit complete. Devices in group: Web Sandbox [Verified ✅], Desktop Hub [Pending key confirmation 🔑]. Perfect integrity found.', 115, botKey),
      ],
    }
  ];
};

export const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 's1',
    deviceName: 'Chrome Web Client (Sandbox Container)',
    location: 'Silicon Valley, California',
    ipAddress: '172.56.24.110',
    lastActive: 'Active now',
    isCurrent: true,
  }
];
