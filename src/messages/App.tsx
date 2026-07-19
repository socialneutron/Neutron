/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Conversation, Message, ActiveSession, MessageType, Attachment, EncryptedEnvelope } from './types';
import { INITIAL_CONVERSATIONS, INITIAL_SESSIONS, MY_PROFILE } from './mockData';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import NeutronLogo from './components/NeutronLogo';
import { useChatStore } from '../stores/chatStore';
import { useUserAvatar } from '../stores/userAvatarStore';
import { useMessageToast } from '../components/common/MessageToast';
import { backendMessageService } from '../services';
import { connectSocket, disconnectSocket, onSocket, emitSocket } from '../lib/socket';
import { getE2ECryptoManager, type E2ECryptoManager } from './crypto/manager';
import { hexToUint8Array } from './crypto/keygen';
import { generateKeyPair, serializeKeyPair, computeFingerprint } from './crypto/keygen';
import { mockMessageService } from '../services/mockMessageService';

const useBackend = !!import.meta.env.VITE_API_URL;

interface AppProps {
  recipient?: any;
  navigate?: (page: string, params?: any) => void;
  user?: any;
  inquiry?: string;
}

export default function App({ recipient, navigate, user, inquiry }: AppProps) {
  const { avatar: globalAvatar, displayName: globalDisplayName } = useUserAvatar();
  const messageToast = useMessageToast();
  const myProfile = user
    ? {
        id: user.id || user.uid || 'me',
        username: globalDisplayName || user.username || 'User',
        avatar:
          globalAvatar ||
          user.avatar ||
          'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=150&h=150&q=80',
        online: true,
        isVerified: true,
        statusText: 'Online',
        encryptionKeyFingerprint: '',
      }
    : MY_PROFILE;

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = mockMessageService.getConversations();
    const initial = saved || INITIAL_CONVERSATIONS({});
    // Dedup by participant.id — keep the one with more messages
    const seen = new Map<string, Conversation>();
    for (const conv of initial) {
      const key = conv.participant.id;
      const existing = seen.get(key);
      if (!existing || conv.messages.length > existing.messages.length) {
        seen.set(key, conv);
      }
    }
    return Array.from(seen.values());
  });

  // Persist conversations to localStorage on every change
  useEffect(() => {
    if (conversations.length > 0) {
      mockMessageService.saveConversations(conversations);
    }
  }, [conversations]);

  const [selectedConvId, setSelectedConvId] = useState<string | null>('conv_cyber_bot');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(new Map());
  const [cryptoReady, setCryptoReady] = useState(false);
  const [myFingerprint, setMyFingerprint] = useState('');
  const cryptoManagerRef = useRef<E2ECryptoManager | null>(null);

  const currentUserId = user?.id || user?.uid || 'me';

  // Initialize crypto manager
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const manager = await getE2ECryptoManager();
        if (cancelled) return;
        cryptoManagerRef.current = manager;
        setMyFingerprint(manager.getFingerprint());
        setCryptoReady(true);
      } catch (err) {
        console.error('[E2E] Crypto init failed:', err);
        setCryptoReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Initialize key pair for conversations on crypto ready
  useEffect(() => {
    if (!cryptoReady || !cryptoManagerRef.current) return;

    const manager = cryptoManagerRef.current;

    // Generate a key pair for each conversation that doesn't have one yet
    (async () => {
      for (const conv of conversations) {
        if (conv.isGroup || conv.id === 'conv_cyber_bot') continue;
        if (manager.isConversationEncrypted(conv.id)) {
          // Load fingerprint into conversation
          const peerKey = manager.getConversationFingerprint(conv.id);
          if (peerKey) {
            const fp = await computeFingerprint(peerKey);
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conv.id
                  ? {
                      ...c,
                      isE2EEEnabled: true,
                      peerFingerprint: fp,
                      localFingerprint: manager.getFingerprint(),
                    }
                  : c
              )
            );
          }
          continue;
        }

        // Generate a simulated peer key for demo (in production, fetch from server)
        try {
          const tempKp = await generateKeyPair();
          const tempSerialized = await serializeKeyPair(tempKp);
          const peerPubHex = tempSerialized.publicKeyJwk.x
            ? ((tempSerialized.publicKeyJwk.x as string) + (tempSerialized.publicKeyJwk.y as string))
            : '';

          if (peerPubHex) {
            await manager.initiateConversation(conv.id, peerPubHex);
            const fp = await computeFingerprint(peerPubHex);
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conv.id
                  ? {
                      ...c,
                      isE2EEEnabled: true,
                      peerPublicKey: peerPubHex,
                      peerFingerprint: fp,
                      localFingerprint: manager.getFingerprint(),
                    }
                  : c
              )
            );
          }
        } catch (err) {
          console.error(`[E2E] Key exchange failed for ${conv.id}:`, err);
        }
      }
    })();
  }, [cryptoReady, conversations.length]);

  // Connect socket on mount and load backend conversations
  useEffect(() => {
    if (useBackend && currentUserId && currentUserId !== 'me') {
      connectSocket(currentUserId);

      const cleanupMessage = onSocket('message:new', async (msg: any) => {
        if (!msg?.senderId && !msg?.sender_id) return;
        const senderId = msg.senderId || msg.sender_id;

        let decryptedText = msg.text || msg.content || msg.message;

        // Decrypt if encrypted envelope present
        if (msg.encryptedEnvelope?.isEncrypted && cryptoManagerRef.current) {
          try {
            const envelope: EncryptedEnvelope = msg.encryptedEnvelope;
            const convId = conversations.find(
              (c) => c.participant.id === senderId
            )?.id;

            if (convId) {
              decryptedText = await cryptoManagerRef.current.decryptFromConversation(
                convId,
                envelope
              );
            }
          } catch (err) {
            console.error('[E2E] Decryption failed:', err);
            decryptedText = '[Encrypted message - decryption failed]';
          }
        }

        if (!decryptedText) return;

        setConversations((prev) => {
          const existing = prev.find((c) => c.participant.id === senderId);
          if (existing) {
            // Trigger toast if not viewing this conversation
            if (selectedConvId !== existing.id && messageToast) {
              messageToast.addMessageToast({
                senderName: existing.participant.username,
                senderAvatar: existing.participant.avatar,
                text: decryptedText,
                onClick: () => {
                  setSelectedConvId(existing.id);
                  setConversations((p) =>
                    p.map((c) => (c.id === existing.id ? { ...c, unreadCount: 0 } : c))
                  );
                },
              });
            }
            return prev.map((c) => {
              if (c.id === existing.id) {
                return {
                  ...c,
                  unreadCount: selectedConvId === c.id ? 0 : c.unreadCount + 1,
                  messages: [
                    ...c.messages,
                    {
                      id: msg.id || `msg_${Date.now()}`,
                      senderId,
                      recipientId: 'me',
                      text: decryptedText,
                      timestamp: msg.timestamp || new Date(),
                      type: 'text' as MessageType,
                      reactions: [],
                      status: 'delivered' as const,
                      isEncrypted: true,
                    },
                  ],
                };
              }
              return c;
            });
          }
          return prev;
        });
      });

      const cleanupTyping = onSocket(
        'message:typing',
        ({ senderId }: { senderId: string }) => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.set(senderId, Date.now());
            return next;
          });
        }
      );

      const cleanupOnline = onSocket('user:online', ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => new Set(prev).add(userId));
      });

      const cleanupOffline = onSocket('user:offline', ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });

      return () => {
        cleanupMessage();
        cleanupTyping();
        cleanupOnline();
        cleanupOffline();
        disconnectSocket();
      };
    }
  }, [currentUserId, useBackend]);

  // Sync Zustand chat store conversations into local state
  const zustandConversations = useChatStore((s) => s.conversations);
  const syncedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const zc of zustandConversations) {
      if (syncedIdsRef.current.has(zc.id)) continue;
      syncedIdsRef.current.add(zc.id);

      setConversations((prev) => {
        const exists = prev.find((c) => c.participant.id === zc.participant.id);
        if (exists) return prev;

        const conv: Conversation = {
          id: zc.id,
          participant: {
            id: zc.participant.id,
            username: zc.participant.username,
            avatar:
              zc.participant.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(zc.participant.username)}&background=2563eb&color=fff&size=150`,
            online: zc.participant.online,
            isVerified: zc.participant.isVerified,
            statusText: `Session: ${zc.sessionId}`,
            encryptionKeyFingerprint: '',
          },
          unreadCount: 0,
          sharedEncryptionKey: `zustand_key_${zc.sessionId}`,
          keyExchangeCompleted: true,
          disappearingSetting: 0,
          isBlocked: false,
          isReported: false,
          messages: zc.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            recipientId: m.senderId === 'me' ? zc.participant.id : 'me',
            text: m.text,
            timestamp: m.timestamp,
            type: 'text' as MessageType,
            reactions: [],
            status: m.status as 'sending' | 'delivered' | 'read',
          })),
        };
        return [conv, ...prev];
      });
    }
  }, [zustandConversations]);

  useEffect(() => {
    if (!recipient) return;
    const targetUsername =
      typeof recipient === 'string' ? recipient : recipient.username;
    const recipientId = typeof recipient === 'object' ? recipient.id : null;
    const recipientAvatar = typeof recipient === 'object' ? recipient.avatar : null;
    const recipientDisplayName = typeof recipient === 'object' ? recipient.displayName || recipient.display_name : null;
    if (!targetUsername) return;

    setConversations((prev) => {
      const exists = prev.find(
        (c) => recipientId
          ? c.participant.id === recipientId
          : c.participant.username.toLowerCase() === targetUsername.toLowerCase()
      );

      if (exists) {
        setSelectedConvId(exists.id);
        return prev;
      }

      const newConv: Conversation = {
        id: `conv_${Math.random().toString(36).substring(2, 9)}`,
        participant: {
          id: recipientId || `peer_${targetUsername}`,
          username: targetUsername,
          avatar:
            recipientAvatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientDisplayName || targetUsername)}&background=2563eb&color=fff&size=150`,
          online: true,
          isVerified: false,
          statusText: 'New chat',
          encryptionKeyFingerprint: '',
        },
        unreadCount: 0,
        sharedEncryptionKey: '',
        keyExchangeCompleted: false,
        disappearingSetting: 0,
        isBlocked: false,
        isReported: false,
        messages: [],
      };
      setSelectedConvId(newConv.id);
      return [newConv, ...prev];
    });
  }, [recipient]);

  // Auto-send inquiry text from business page (once only)
  const inquirySentRef = useRef(false);
  useEffect(() => {
    if (!inquiry || !selectedConvId || inquirySentRef.current) return;
    inquirySentRef.current = true;
    const timer = setTimeout(() => {
      handleSendMessage(inquiry);
    }, 500);
    return () => clearTimeout(timer);
  }, [inquiry, selectedConvId]);

  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [hideOnline, setHideOnline] = useState(false);
  const [hideReadReceipts, setHideReadReceipts] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [mutedConversations, setMutedConversations] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaintextToggle, setIsPlaintextToggle] = useState(false);


  // Sort conversations: unread first, then by last message time
  const sortedConversations = [...conversations].sort((a, b) => {
    const aUnread = a.unreadCount > 0 ? 1 : 0;
    const bUnread = b.unreadCount > 0 ? 1 : 0;
    if (bUnread !== aUnread) return bUnread - aUnread;
    const aTime = a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].timestamp).getTime() : 0;
    const bTime = b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].timestamp).getTime() : 0;
    return bTime - aTime;
  });

  const activeConversation =
    conversations.find((c) => c.id === selectedConvId) || null;

  const handleSendMessage = async (
    text: string,
    type: MessageType = 'text',
    attachment?: Attachment,
    voiceDuration?: string
  ) => {
    if (!selectedConvId || !activeConversation) return;

    const recipientId = activeConversation.participant.id;
    const newId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Encrypt the message
    let encryptedEnvelope: EncryptedEnvelope | undefined;
    let displayText = text;

    if (cryptoManagerRef.current && cryptoReady && type === 'text') {
      try {
        encryptedEnvelope = await cryptoManagerRef.current.encryptForConversation(
          selectedConvId,
          text
        );
        if (encryptedEnvelope.isEncrypted) {
          displayText = text; // User sees plaintext locally
        }
      } catch (err) {
        console.error('[E2E] Encryption failed:', err);
      }
    }

    const newMsg: Message = {
      id: newId,
      senderId: 'me',
      recipientId,
      text: displayText,
      timestamp: new Date(),
      type,
      attachment,
      voiceDuration,
      reactions: [],
      status: 'sending',
      encryptedEnvelope,
      isEncrypted: !!encryptedEnvelope?.isEncrypted,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedConvId) {
          return { ...c, messages: [...c.messages, newMsg] };
        }
        return c;
      })
    );

    if (useBackend) {
      try {
        await backendMessageService.send(
          recipientId,
          text,
          encryptedEnvelope
        );
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === selectedConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newId ? { ...m, status: 'delivered' as const } : m
                ),
              };
            }
            return c;
          })
        );
      } catch {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === selectedConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newId ? { ...m, status: 'sending' as const } : m
                ),
              };
            }
            return c;
          })
        );
      }
    } else {
      setTimeout(() => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === selectedConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newId ? { ...m, status: 'delivered' as const } : m
                ),
              };
            }
            return c;
          })
        );
      }, 400);
    }
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
          return { ...c, isBlocked: !isCurrentlyBlocked };
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
      prev.includes(convId)
        ? prev.filter((id) => id !== convId)
        : [...prev, convId]
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

  const handleDeleteChat = async (convId: string) => {
    if (cryptoManagerRef.current) {
      await cryptoManagerRef.current.deleteConversation(convId);
    }
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    setMutedConversations((prev) => prev.filter((id) => id !== convId));
    if (selectedConvId === convId) {
      setSelectedConvId(null);
    }
  };

  const handleNewChat = async () => {
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

    const newConvId = `conv_${Math.random().toString(36).substring(2, 9)}`;
    let peerFingerprint = 'DC10:A98E:44BC:AA22';

    // Perform key exchange for new conversation
    if (cryptoManagerRef.current && cryptoReady) {
      try {
        const tempKp = await generateKeyPair();
        const tempSerialized = await serializeKeyPair(tempKp);
        const peerPubHex = tempSerialized.publicKeyJwk.x
          ? ((tempSerialized.publicKeyJwk.x as string) + (tempSerialized.publicKeyJwk.y as string))
          : '';

        if (peerPubHex) {
          await cryptoManagerRef.current.initiateConversation(newConvId, peerPubHex);
          peerFingerprint = await computeFingerprint(peerPubHex);
        }
      } catch (err) {
        console.error('[E2E] New chat key exchange failed:', err);
      }
    }

    const newConv: Conversation = {
      id: newConvId,
      participant: {
        id: `peer_${newUsername}`,
        username: newUsername,
        avatar:
          `https://ui-avatars.com/api/?name=${encodeURIComponent(newUsername)}&background=2563eb&color=fff&size=150`,
        online: true,
        isVerified: false,
        statusText: 'Active chatbot node.',
        encryptionKeyFingerprint: peerFingerprint,
      },
      unreadCount: 0,
      sharedEncryptionKey: '',
      keyExchangeCompleted: true,
      disappearingSetting: 0,
      isBlocked: false,
      isReported: false,
      isE2EEEnabled: true,
      peerFingerprint,
      localFingerprint: myFingerprint,
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setSelectedConvId(newConv.id);
  };

  const handleCreateGroup = (groupName: string, memberIds: string[]) => {
    const includedUsernames = conversations
      .map((c) => c.participant)
      .filter((p) => memberIds.includes(p.id))
      .map((p) => p.username);

    const memberListText =
      includedUsernames.length > 0
        ? `Members: ${includedUsernames.map((name) => `@${name}`).join(', ')}, @${myProfile.username} (You)`
        : `Members: @${myProfile.username} (You)`;

    const groupAvatar =
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&h=150&q=80';

    const newConv: Conversation = {
      id: `conv_group_${Math.random().toString(36).substring(2, 9)}`,
      participant: {
        id: `group_${Math.random().toString(36).substring(2, 9)}`,
        username: groupName,
        avatar: groupAvatar,
        online: true,
        isVerified: true,
        statusText: `Group \u2022 ${memberIds.length + 1} members`,
        encryptionKeyFingerprint: '',
        isGroup: true,
      },
      unreadCount: 0,
      sharedEncryptionKey: '',
      keyExchangeCompleted: true,
      disappearingSetting: 0,
      isBlocked: false,
      isReported: false,
      isGroup: true,
      groupMembers: memberIds,
      messages: [
        {
          id: `msg_group_init_${Date.now()}`,
          senderId: 'system',
          recipientId: 'all',
          text: `Group chat created. ${memberListText}`,
          timestamp: new Date(),
          type: 'text',
          reactions: [],
          status: 'read',
        },
      ],
    };

    setConversations((prev) => [newConv, ...prev]);
    setSelectedConvId(newConv.id);
  };

  const handleRotateKeys = async () => {
    if (cryptoManagerRef.current) {
      const newFp = await cryptoManagerRef.current.rotateKeys();
      setMyFingerprint(newFp);
    }
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
          conversations={sortedConversations}
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
          onlineUsers={onlineUsers}
        />

        {/* Chat Window */}
        <div style={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              onSendMessage={handleSendMessage}
              onToggleBlock={handleToggleBlock}
              onToggleReport={handleToggleReport}
              isPlaintextToggle={isPlaintextToggle}
              onReaction={handleReaction}
              onDeleteMessage={handleDeleteMessage}
              onClearHistory={handleClearHistory}
              onDeleteChat={handleDeleteChat}
              isMuted={mutedConversations.includes(activeConversation.id)}
              onToggleMute={handleToggleMute}
              isTyping={
                typingUsers.has(activeConversation.participant.id) &&
                Date.now() -
                  (typingUsers.get(activeConversation.participant.id) || 0) <
                  5000
              }
              cryptoManager={cryptoManagerRef.current}
              cryptoReady={cryptoReady}
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
              <p
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  maxWidth: '300px',
                  lineHeight: 1.6,
                  marginBottom: '20px',
                }}
              >
                Select a contact to start a secure, end-to-end encrypted
                conversation.
              </p>
              {cryptoReady && (
                <p
                  style={{
                    fontSize: '11px',
                    color: '#00CFFF',
                    fontFamily: 'monospace',
                    marginBottom: '20px',
                    padding: '8px 14px',
                    border: '1px solid rgba(0,207,255,0.2)',
                    borderRadius: '8px',
                    background: 'rgba(0,207,255,0.05)',
                  }}
                >
                  Your fingerprint: {myFingerprint}
                </p>
              )}
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
          myFingerprint={myFingerprint}
          onRotateKeys={handleRotateKeys}
          cryptoReady={cryptoReady}
          cryptoManager={cryptoManagerRef.current}
        />
      )}
    </div>
  );
}
