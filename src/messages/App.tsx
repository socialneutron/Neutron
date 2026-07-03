/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Conversation, Message, ActiveSession, MessageType, Attachment } from './types';
import { INITIAL_CONVERSATIONS, INITIAL_SESSIONS, MY_PROFILE } from './mockData';
import { encryptMessage } from './utils/cryptoSim';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import NeutronLogo from './components/NeutronLogo';
import { useChatStore } from '../stores/chatStore';
import { useUserAvatar } from '../stores/userAvatarStore';

interface AppProps {
  recipient?: any;
  navigate?: (page: string, params?: any) => void;
  user?: any;
}

export default function App({ recipient, navigate, user }: AppProps) {
  const { avatar: globalAvatar, displayName: globalDisplayName } = useUserAvatar();
  const myProfile = user ? {
    id: 'me',
    username: globalDisplayName || user.username || 'Pratham',
    avatar: globalAvatar || user.avatar || 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=150&h=150&q=80',
    online: true,
    isVerified: true,
    statusText: 'Keys rotated. Secure connection live.',
    encryptionKeyFingerprint: 'B4E1:89FF:90C2:D410',
  } : MY_PROFILE;
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    INITIAL_CONVERSATIONS({
      cyber_bot: 'bot_shared_handshake_key_core',
    })
  );

  const [selectedConvId, setSelectedConvId] = useState<string | null>('conv_cyber_bot');

  // Sync Zustand chat store conversations into local state
  const zustandConversations = useChatStore((s) => s.conversations);
  const syncedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const zc of zustandConversations) {
      if (syncedIdsRef.current.has(zc.id)) continue
      syncedIdsRef.current.add(zc.id)

      const exists = conversations.find(c => c.id === zc.id)
      if (exists) continue

      const conv: Conversation = {
        id: zc.id,
        participant: {
          id: zc.participant.id,
          username: zc.participant.username,
          avatar: zc.participant.avatar || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&h=150&q=80',
          online: zc.participant.online,
          isVerified: zc.participant.isVerified,
          statusText: `Session: ${zc.sessionId}`,
          encryptionKeyFingerprint: 'E2E:PROTOCOL:X3DH',
        },
        unreadCount: 0,
        sharedEncryptionKey: `zustand_key_${zc.sessionId}`,
        keyExchangeCompleted: true,
        disappearingSetting: 0,
        isBlocked: false,
        isReported: false,
        messages: zc.messages.map(m => ({
          id: m.id,
          senderId: m.senderId,
          recipientId: m.senderId === 'me' ? zc.participant.id : 'me',
          text: m.text,
          encryptedPayload: encryptMessage(m.text, `zustand_key_${zc.sessionId}`),
          timestamp: m.timestamp,
          type: 'text' as MessageType,
          reactions: [],
          status: m.status as 'sending' | 'delivered' | 'read',
        })),
      }
      setConversations(prev => [conv, ...prev])
    }
  }, [zustandConversations])

  useEffect(() => {
    if (!recipient) return;
    const targetUsername = typeof recipient === 'string' ? recipient : recipient.username;
    if (!targetUsername) return;

    const exists = conversations.find(
      (c) => c.participant.username.toLowerCase() === targetUsername.toLowerCase()
    );

    if (exists) {
      setSelectedConvId(exists.id);
    } else {
      const finger = 'DC10:A98E:44BC:AA22';
      const newConv: Conversation = {
        id: `conv_${Math.random().toString(36).substring(2, 9)}`,
        participant: {
          id: `peer_${Math.random().toString(36).substring(2, 9)}`,
          username: targetUsername,
          avatar:
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&h=150&q=80',
          online: true,
          isVerified: false,
          statusText: 'New node. Handshake ready.',
          encryptionKeyFingerprint: finger,
        },
        unreadCount: 0,
        sharedEncryptionKey: `new_key_cluster_${Math.random().toString(36).substring(2, 6)}`,
        keyExchangeCompleted: true,
        disappearingSetting: 0,
        isBlocked: false,
        isReported: false,
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConvId(newConv.id);
    }
  }, [recipient]);

  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [hideOnline, setHideOnline] = useState(false);
  const [hideReadReceipts, setHideReadReceipts] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [mutedConversations, setMutedConversations] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const [isPlaintextToggle, setIsPlaintextToggle] = useState(false);

  const activeConversation = conversations.find((c) => c.id === selectedConvId) || null;

  const handleSendMessage = (
    text: string,
    type: MessageType = 'text',
    attachment?: Attachment,
    voiceDuration?: string
  ) => {
    if (!selectedConvId || !activeConversation) return;

    const encryptionKey = activeConversation.sharedEncryptionKey;
    const encryptedPayload = encryptMessage(text, encryptionKey);

    const newMsg: Message = {
      id: `msg_${Math.random().toString(36).substring(2, 9)}`,
      senderId: 'me',
      recipientId: activeConversation.participant.id,
      text,
      encryptedPayload,
      timestamp: new Date(),
      type,
      attachment,
      voiceDuration,
      reactions: [],
      status: 'sending',
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedConvId) {
          return {
            ...c,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === selectedConvId) {
            return {
              ...c,
              messages: c.messages.map((m) => (m.id === newMsg.id ? { ...m, status: 'delivered' } : m)),
            };
          }
          return c;
        })
      );

      setTimeout(() => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === selectedConvId) {
              return {
                ...c,
                messages: c.messages.map((m) => (m.id === newMsg.id ? { ...m, status: 'read' } : m)),
              };
            }
            return c;
          })
        );

        // Chatbot response simulation
        if (activeConversation.participant.id === 'cyber_bot') {
          setTimeout(() => {
            const botMessages = [
              "🔒 Encrypted frame received. Keys ratcheted successfully.",
              "Sovereign node verified. Connection integrity remains at 100%.",
              "Message payload decrypted locally. No sandbox leaks detected.",
              "Protocol status: SECURE. Ciphertext scrambled via AES-GCM-256.",
              "Signature verified. Fingerprints matching correctly.",
              "Node online. Sandboxed shell is monitoring active telemetry."
            ];
            const randomResponse = botMessages[Math.floor(Math.random() * botMessages.length)];
            
            const botMsg: Message = {
              id: `msg_bot_${Math.random().toString(36).substring(2, 9)}`,
              senderId: 'cyber_bot',
              recipientId: 'me',
              text: randomResponse,
              encryptedPayload: encryptMessage(randomResponse, encryptionKey),
              timestamp: new Date(),
              type: 'text',
              reactions: [],
              status: 'read',
            };

            setConversations((prev) =>
              prev.map((c) => {
                if (c.id === selectedConvId) {
                  return {
                    ...c,
                    messages: [...c.messages, botMsg],
                  };
                }
                return c;
              })
            );
          }, 600);
        }
      }, 500);
    }, 400);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedConvId) {
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id === messageId) {
                const exists = m.reactions.find((r) => r.emoji === emoji);
                const nextReactions = exists
                  ? m.reactions.filter((r) => r.emoji !== emoji)
                  : [...m.reactions, { user: 'me', emoji }];
                return { ...m, reactions: nextReactions };
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
  };

  const handleDeleteMessage = (messageId: string, deleteType: 'me' | 'everyone') => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedConvId) {
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id === messageId) {
                if (deleteType === 'everyone') {
                  return { ...m, deletedForEveryone: true };
                } else {
                  return { ...m, deletedForMe: true };
                }
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
  };

  const handleToggleBlock = (username: string) => {
    const isCurrentlyBlocked = blockedUsers.includes(username);
    const nextBlocked = isCurrentlyBlocked
      ? blockedUsers.filter((u) => u !== username)
      : [...blockedUsers, username];

    setBlockedUsers(nextBlocked);

    setConversations((prev) =>
      prev.map((c) => {
        if (c.participant.username === username) {
          return {
            ...c,
            isBlocked: !isCurrentlyBlocked,
          };
        }
        return c;
      })
    );
  };

  const handleToggleReport = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          return { ...c, isReported: true };
        }
        return c;
      })
    );
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleToggleMute = (convId: string) => {
    setMutedConversations((prev) =>
      prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
    );
  };

  const handleClearHistory = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          return { ...c, messages: [], unreadCount: 0 };
        }
        return c;
      })
    );
  };

  const handleDeleteChat = (convId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    setMutedConversations((prev) => prev.filter((id) => id !== convId));
    if (selectedConvId === convId) {
      setSelectedConvId(null);
    }
  };

  const handleNewChat = () => {
    const newUsername = prompt(
      'Enter the chatbot or username to start a conversation:'
    );
    if (!newUsername) return;

    const exists = conversations.find(
      (c) => c.participant.username.toLowerCase() === newUsername.toLowerCase()
    );

    if (exists) {
      setSelectedConvId(exists.id);
      return;
    }

    const finger = 'DC10:A98E:44BC:AA22';
    const newConv: Conversation = {
      id: `conv_${Math.random().toString(36).substring(2, 9)}`,
      participant: {
        id: `peer_${Math.random().toString(36).substring(2, 9)}`,
        username: newUsername,
        avatar:
          'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&h=150&q=80',
        online: true,
        isVerified: false,
        statusText: 'Active chatbot node.',
        encryptionKeyFingerprint: finger,
      },
      unreadCount: 0,
      sharedEncryptionKey: `new_key_cluster_${Math.random().toString(36).substring(2, 6)}`,
      keyExchangeCompleted: true,
      disappearingSetting: 0,
      isBlocked: false,
      isReported: false,
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setSelectedConvId(newConv.id);
  };

  const handleCreateGroup = (groupName: string, memberIds: string[]) => {
    const finger = Array.from({ length: 4 }, () =>
      Math.floor(4096 + Math.random() * 61439).toString(16).toUpperCase()
    ).join(':');

    const includedUsernames = conversations
      .map((c) => c.participant)
      .filter((p) => memberIds.includes(p.id))
      .map((p) => p.username);

    const memberListText = includedUsernames.length > 0
      ? `Members: ${includedUsernames.map(name => `@${name}`).join(', ')}, @${myProfile.username} (You)`
      : `Members: @${myProfile.username} (You)`;

    const groupAvatar = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&h=150&q=80';

    const newConv: Conversation = {
      id: `conv_group_${Math.random().toString(36).substring(2, 9)}`,
      participant: {
        id: `group_${Math.random().toString(36).substring(2, 9)}`,
        username: groupName,
        avatar: groupAvatar,
        online: true,
        isVerified: true,
        statusText: `Group • ${memberIds.length + 1} agents active`,
        encryptionKeyFingerprint: finger,
        isGroup: true,
      },
      unreadCount: 0,
      sharedEncryptionKey: `group_shared_cluster_${Math.random().toString(36).substring(2, 6)}`,
      keyExchangeCompleted: true,
      disappearingSetting: 0,
      isBlocked: false,
      isReported: false,
      isGroup: true,
      groupMembers: memberIds,
      messages: [
        {
          id: `msg_group_init_${Math.random().toString(36).substring(2, 9)}`,
          senderId: 'system',
          recipientId: 'all',
          text: `🛡️ Encrypted Group Cluster initialized. Symmetrical keys distributed. Fingerprint Pair: ${finger}. ${memberListText}`,
          encryptedPayload: 'MOCK_CIPHERTEXT_GROUP_PROT_OK',
          timestamp: new Date(),
          type: 'text',
          reactions: [],
          status: 'read',
        }
      ],
    };

    setConversations((prev) => [newConv, ...prev]);
    setSelectedConvId(newConv.id);
  };

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0e14',
        color: '#fff',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar */}
        <Sidebar
          conversations={conversations}
          selectedId={selectedConvId}
          onSelectConversation={(id) => {
            setSelectedConvId(id);
            setConversations((prev) =>
              prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
            );
          }}
          onOpenSettings={() => setShowSettings(true)}
          onNewChat={handleNewChat}
          onCreateGroup={handleCreateGroup}
           myProfile={myProfile}
          navigate={navigate}
        />

        {/* Chat Window */}
        <div style={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              onSendMessage={handleSendMessage}
              onToggleBlock={handleToggleBlock}
              onToggleReport={handleToggleReport}
              onChangeDisappearing={() => {}}
              isPlaintextToggle={isPlaintextToggle}
              onReaction={handleReaction}
              onDeleteMessage={handleDeleteMessage}
              onClearHistory={handleClearHistory}
              onDeleteChat={handleDeleteChat}
              isMuted={mutedConversations.includes(activeConversation.id)}
              onToggleMute={handleToggleMute}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '24px',
                background: '#0a0e14',
              }}
            >
              <NeutronLogo size={80} showText={true} />
              <h2
                style={{
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: 'rgba(0,207,255,0.9)',
                  marginBottom: '10px',
                  marginTop: '20px',
                  fontWeight: 600,
                }}
              >
                Secure Chat Messenger
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '300px', lineHeight: 1.6, marginBottom: '20px' }}>
                Select a contact to start a secure, end-to-end encrypted conversation.
              </p>
              <button
                onClick={handleNewChat}
                style={{
                  background: '#00CFFF',
                  color: '#000',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                New Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          sessions={sessions}
          onRevokeSession={handleRevokeSession}
          hideOnline={hideOnline}
          setHideOnline={setHideOnline}
          hideReadReceipts={hideReadReceipts}
          setHideReadReceipts={setHideReadReceipts}
          blockedUsers={blockedUsers}
          onToggleBlockUser={handleToggleBlock}
          myProfile={myProfile}
        />
      )}
    </div>
  );
}
