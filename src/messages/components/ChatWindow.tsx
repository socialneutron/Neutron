import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Conversation, Message, MessageType, Attachment, EncryptedEnvelope } from '../types';
import {
  ShieldAlert,
  Send,
  Paperclip,
  MoreVertical,
  UserX,
  Trash2,
  Layers,
  Check,
  CheckCheck,
  ShieldCheck,
  Plus,
  BellOff,
  Bell,
  Eraser,
  AlertTriangle,
  Lock,
  Fingerprint,
  ChevronDown,
} from 'lucide-react';
import type { E2ECryptoManager } from '../crypto/manager';

function formatLastSeen(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface ChatWindowProps {
  conversation: Conversation;
  onSendMessage: (text: string, type?: MessageType, attachment?: Attachment, voiceDuration?: string) => void;
  onToggleBlock: (id: string) => void;
  onToggleReport: (id: string) => void;
  isPlaintextToggle: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string, deleteType: 'me' | 'everyone') => void;
  onClearHistory: (convId: string) => void;
  onDeleteChat: (convId: string) => void;
  isMuted: boolean;
  onToggleMute: (convId: string) => void;
  isTyping?: boolean;
  cryptoManager?: E2ECryptoManager | null;
  cryptoReady?: boolean;
}

export default function ChatWindow({
  conversation,
  onSendMessage,
  onToggleBlock,
  onToggleReport,
  isPlaintextToggle,
  onReaction,
  onDeleteMessage,
  onClearHistory,
  onDeleteChat,
  isMuted,
  onToggleMute,
  isTyping = false,
  cryptoManager,
  cryptoReady,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const visibleMessages = conversation.messages.filter((msg) => !msg.deletedForMe);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesAreaRef = useRef<HTMLDivElement | null>(null);
  const prevMsgCountRef = useRef(visibleMessages.length);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  // Smart auto-scroll
  useEffect(() => {
    const area = messagesAreaRef.current;
    if (!area) return;
    const isNearBottom =
      area.scrollHeight - area.scrollTop - area.clientHeight < 120;
    const newMsgAdded = visibleMessages.length > prevMsgCountRef.current;
    prevMsgCountRef.current = visibleMessages.length;
    if (newMsgAdded && isNearBottom) {
      scrollToBottom();
    }
  }, [visibleMessages, scrollToBottom]);

  // Track scroll position to show/hide "new messages" button
  useEffect(() => {
    const area = messagesAreaRef.current;
    if (!area) return;
    const handleScroll = () => {
      const isNearBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 120;
      setShowScrollBtn(!isNearBottom);
    };
    area.addEventListener('scroll', handleScroll, { passive: true });
    return () => area.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'text');
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) {
        onSendMessage(inputText.trim(), 'text');
        setInputText('');
      }
    }
  };

  // Group messages by date with enhanced labels
  const groupedMessages: { label: string; messages: Message[] }[] = [];
  let currentDate = '';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  visibleMessages.forEach((msg) => {
    const msgDate = new Date(msg.timestamp);
    const isToday = msgDate.toDateString() === today.toDateString();
    const isYesterday = msgDate.toDateString() === yesterday.toDateString();

    let simpleLabel: string;
    if (isToday) {
      simpleLabel = 'Today';
    } else if (isYesterday) {
      simpleLabel = 'Yesterday';
    } else {
      const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        simpleLabel = msgDate.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        simpleLabel = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }

    if (simpleLabel !== currentDate) {
      currentDate = simpleLabel;
      groupedMessages.push({ label: simpleLabel, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  const localFp = conversation.localFingerprint || cryptoManager?.getFingerprint() || '';
  const peerFp = conversation.peerFingerprint || '';

  const styles: { [key: string]: React.CSSProperties } = {
    root: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0a0e14',
      overflow: 'hidden',
      position: 'relative',
      minWidth: 0,
      paddingBottom: '72px',
    },
    header: {
      padding: '14px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#0d1117',
      flexShrink: 0,
      zIndex: 10,
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '13px',
    },
    avatarWrap: {
      position: 'relative',
      flexShrink: 0,
    },
    avatar: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '2px solid rgba(0,207,255,0.5)',
    },
    onlineDot: {
      position: 'absolute',
      bottom: '2px',
      right: '2px',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: '#22c55e',
      border: '2px solid #0d1117',
    },
    headerName: {
      fontWeight: 700,
      fontSize: '16px',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '2px',
    },
    verifiedBadge: {
      width: '16px',
      height: '16px',
      color: '#00CFFF',
    },
    headerStatus: {
      fontSize: '12px',
      color: '#22c55e',
      fontFamily: 'monospace',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    secureBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 14px',
      border: '1px solid rgba(0,207,255,0.25)',
      borderRadius: '10px',
      background: 'rgba(0,207,255,0.06)',
      color: '#00CFFF',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.06em',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    },
    menuBtn: {
      background: 'none',
      border: 'none',
      color: '#6b7280',
      cursor: 'pointer',
      padding: '6px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px 20px 140px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    dateDivider: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '12px 0',
    },
    datePill: {
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '99px',
      padding: '4px 14px',
      fontSize: '12px',
      color: '#6b7280',
    },
    msgGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    bubbleRowBot: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      justifyContent: 'flex-start',
    },
    bubbleRowMe: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      justifyContent: 'flex-end',
    },
    bubbleAvatar: {
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '1.5px solid rgba(255,255,255,0.1)',
      flexShrink: 0,
      marginTop: '4px',
    },
    bubbleContent: {
      maxWidth: '60%',
      display: 'flex',
      flexDirection: 'column',
    },
    senderLabel: {
      fontSize: '12px',
      color: '#9ca3af',
      marginBottom: '4px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    senderTime: {
      fontSize: '11px',
      color: '#4b5563',
      fontFamily: 'monospace',
      marginLeft: '4px',
    },
    bubbleBot: {
      background: '#1a2332',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '4px 16px 16px 16px',
      padding: '11px 14px',
      color: '#e5e7eb',
      fontSize: '14px',
      lineHeight: '1.55',
      wordBreak: 'break-word',
    },
    bubbleMe: {
      background: '#0077b6',
      borderRadius: '16px 4px 16px 16px',
      padding: '11px 14px',
      color: '#ffffff',
      fontSize: '14px',
      lineHeight: '1.55',
      wordBreak: 'break-word',
    },
    bubbleMeta: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '4px',
      marginTop: '4px',
    },
    metaTime: {
      fontSize: '11px',
      color: '#6b7280',
      fontFamily: 'monospace',
    },
    inputArea: {
      padding: '14px 20px',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      background: '#0d1117',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    },
    inputRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    typingIndicator: {
      padding: '4px 0',
      fontSize: '12px',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    iconBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '8px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'color 0.2s, background 0.2s',
    },
    inputWrap: {
      flex: 1,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      transition: 'border-color 0.2s',
    },
    input: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: '#e5e7eb',
      fontSize: '14px',
      padding: '11px 0',
      fontFamily: 'inherit',
    },
    shieldBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#00CFFF',
      padding: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    sendBtn: {
      width: '42px',
      height: '42px',
      borderRadius: '12px',
      background: '#00CFFF',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'background 0.2s, opacity 0.2s',
    },
    blockedBanner: {
      margin: '12px 20px',
      padding: '12px 16px',
      borderRadius: '12px',
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
      color: '#fca5a5',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    dropdownMenu: {
      position: 'absolute',
      right: 0,
      top: '38px',
      width: '160px',
      background: '#1a1a2e',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      padding: '6px',
      zIndex: 50,
    },
    dropdownItem: {
      width: '100%',
      textAlign: 'left' as const,
      padding: '8px 12px',
      borderRadius: '8px',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background 0.15s',
    },
    verifyModal: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    verifyBox: {
      background: '#0d1117',
      border: '1px solid rgba(0,207,255,0.25)',
      borderRadius: '18px',
      padding: '28px',
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    },
  };

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatarWrap}>
            <img
              src={conversation.participant.avatar}
              alt={conversation.participant.username}
              style={styles.avatar}
              referrerPolicy="no-referrer"
            />
            {conversation.participant.online && <span style={styles.onlineDot} />}
          </div>
          <div>
            <div style={styles.headerName}>
              {conversation.participant.username}
              {conversation.participant.isVerified && (
                <ShieldCheck style={styles.verifiedBadge} />
              )}
            </div>
            <div style={styles.headerStatus}>
              {conversation.participant.online ? (
                <>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ color: '#22c55e' }}>Online</span>
                </>
              ) : conversation.participant.lastSeen ? (
                <>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#6b7280',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ color: '#6b7280' }}>Last seen {formatLastSeen(conversation.participant.lastSeen)}</span>
                </>
              ) : (
                <>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: conversation.isE2EEEnabled ? '#22c55e' : '#6b7280',
                      display: 'inline-block',
                    }}
                  />
                  {conversation.isE2EEEnabled
                    ? 'End-to-End Encrypted'
                    : 'Establishing encryption...'}
                </>
              )}
            </div>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button
            style={{
              ...styles.secureBadge,
              borderColor: conversation.isE2EEEnabled
                ? 'rgba(34,197,94,0.4)'
                : 'rgba(251,191,36,0.4)',
              color: conversation.isE2EEEnabled ? '#22c55e' : '#fbbf24',
              background: conversation.isE2EEEnabled
                ? 'rgba(34,197,94,0.06)'
                : 'rgba(251,191,36,0.06)',
            }}
            onClick={() => setShowVerifyModal(true)}
            title="View encryption details"
          >
            <Lock style={{ width: '15px', height: '15px' }} />
            {conversation.isE2EEEnabled ? 'E2EE ACTIVE' : 'ENCRYPTING'}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              style={styles.menuBtn}
              onClick={() => setShowMenu((v) => !v)}
            >
              <MoreVertical style={{ width: '18px', height: '18px' }} />
            </button>
            {showMenu && (
              <div style={styles.dropdownMenu}>
                <button
                  onClick={() => {
                    onToggleMute(conversation.id);
                    setShowMenu(false);
                  }}
                  style={{
                    ...styles.dropdownItem,
                    color: isMuted ? '#00CFFF' : '#e5e7eb',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'none')
                  }
                >
                  {isMuted ? (
                    <Bell style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <BellOff style={{ width: '14px', height: '14px' }} />
                  )}
                  {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                </button>
                <div
                  style={{
                    height: '1px',
                    background: 'rgba(255,255,255,0.06)',
                    margin: '4px 8px',
                  }}
                />
                <button
                  onClick={() => {
                    setShowClearHistoryModal(true);
                    setShowMenu(false);
                  }}
                  style={{ ...styles.dropdownItem, color: '#fbbf24' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(251,191,36,0.08)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'none')
                  }
                >
                  <Eraser style={{ width: '14px', height: '14px' }} />
                  Clear History
                </button>
                <div
                  style={{
                    height: '1px',
                    background: 'rgba(255,255,255,0.06)',
                    margin: '4px 8px',
                  }}
                />
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowMenu(false);
                  }}
                  style={{ ...styles.dropdownItem, color: '#f87171' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(239,68,68,0.08)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'none')
                  }
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blocked Banner */}
      {conversation.isBlocked && (
        <div style={styles.blockedBanner}>
          <UserX style={{ width: '16px', height: '16px', flexShrink: 0, color: '#ef4444' }} />
          <div>
            <strong>User Blocked</strong> &mdash; You cannot send or receive
            messages from this contact.
          </div>
        </div>
      )}

      {/* E2EE Status Banner */}
      {conversation.isE2EEEnabled && (
        <div
          style={{
            margin: '8px 20px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: 'rgba(34,197,94,0.05)',
            border: '1px solid rgba(34,197,94,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#86efac',
            fontFamily: 'monospace',
          }}
        >
          <Lock style={{ width: '12px', height: '12px', color: '#22c55e' }} />
          Messages are end-to-end encrypted. No one outside this chat can read
          them.
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesAreaRef}
        style={styles.messagesArea}
        onClick={() => setShowMenu(false)}
      >
        {groupedMessages.map((group) => (
          <div key={group.label}>
            <div style={styles.dateDivider}>
              <span style={styles.datePill}>{group.label}</span>
            </div>

            <div style={styles.msgGroup}>
              {group.messages.map((msg) => {
                const isMe = msg.senderId === 'me';
                const time = new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                if (msg.deletedForEveryone) {
                  return (
                    <div
                      key={msg.id}
                      className="msg-enter"
                      style={{
                        display: 'flex',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#6b7280',
                          fontStyle: 'italic',
                          padding: '8px 12px',
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <Trash2
                          style={{ width: '12px', height: '12px', color: '#ef4444' }}
                        />
                        Message purged for everyone
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className="msg-enter"
                    style={isMe ? styles.bubbleRowMe : styles.bubbleRowBot}
                  >
                    {!isMe && (
                      <img
                        src={conversation.participant.avatar}
                        alt=""
                        style={styles.bubbleAvatar}
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <div
                      style={{
                        ...styles.bubbleContent,
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {!isMe && (
                        <div style={styles.senderLabel}>
                          {conversation.participant.username}
                          <span style={styles.senderTime}>{time}</span>
                        </div>
                      )}

                      <div style={isMe ? styles.bubbleMe : styles.bubbleBot}>
                        {msg.type === 'text' && (
                          <span style={{ fontSize: '14px', lineHeight: '1.55' }}>
                            {isPlaintextToggle ? (
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '12px',
                                  color: '#00CFFF',
                                  wordBreak: 'break-all',
                                }}
                              >
                                {msg.text}
                              </span>
                            ) : (
                              msg.text
                            )}
                          </span>
                        )}

                        {msg.type === 'image' && (
                          <div>
                            <img
                              src={msg.attachment?.url}
                              alt={msg.attachment?.name}
                              style={{
                                maxWidth: '100%',
                                borderRadius: '8px',
                                maxHeight: '200px',
                                objectFit: 'cover',
                              }}
                            />
                            {msg.text && (
                              <p
                                style={{
                                  marginTop: '8px',
                                  fontSize: '14px',
                                  margin: '6px 0 0',
                                }}
                              >
                                {msg.text}
                              </p>
                            )}
                          </div>
                        )}

                        {msg.type === 'file' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                          >
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(0,207,255,0.1)',
                                border: '1px solid rgba(0,207,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Layers
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  color: '#00CFFF',
                                }}
                              />
                            </div>
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: isMe ? '#fff' : '#e5e7eb',
                                }}
                              >
                                {msg.attachment?.name}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: '11px',
                                  color: isMe
                                    ? 'rgba(255,255,255,0.6)'
                                    : '#6b7280',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {msg.attachment?.size}
                              </p>
                            </div>
                          </div>
                        )}

                        {msg.reactions.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '4px',
                              marginTop: '6px',
                              paddingTop: '6px',
                              borderTop: '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            {msg.reactions.map((r, i) => (
                              <span
                                key={i}
                                style={{
                                  background: 'rgba(0,0,0,0.3)',
                                  borderRadius: '99px',
                                  padding: '2px 7px',
                                  fontSize: '12px',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                }}
                              >
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {isMe && (
                        <div style={styles.bubbleMeta}>
                          {/* Encryption indicator on sent messages */}
                          {msg.isEncrypted && (
                            <Lock
                              style={{
                                width: '10px',
                                height: '10px',
                                color: '#22c55e',
                              }}
                            />
                          )}
                          <span style={styles.metaTime}>{time}</span>
                          {msg.status === 'read' ? (
                            <CheckCheck
                              style={{
                                width: '14px',
                                height: '14px',
                                color: '#00CFFF',
                              }}
                            />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck
                              style={{
                                width: '14px',
                                height: '14px',
                                color: '#6b7280',
                              }}
                            />
                          ) : (
                            <Check
                              style={{
                                width: '14px',
                                height: '14px',
                                color: '#6b7280',
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          style={{
            position: 'absolute',
            bottom: '140px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            background: '#1a2332',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '99px',
            padding: '8px 16px',
            color: '#e5e7eb',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            transition: 'opacity 0.2s',
          }}
        >
          <ChevronDown style={{ width: '14px', height: '14px' }} />
          New messages
        </button>
      )}

      {/* Input Area */}
      <div style={styles.inputArea}>
        {isTyping && (
          <div style={styles.typingIndicator}>
            <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#00CFFF',
                  display: 'inline-block',
                  animation: 'typing 1.4s infinite',
                }}
              />
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#00CFFF',
                  display: 'inline-block',
                  animation: 'typing 1.4s 0.2s infinite',
                }}
              />
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#00CFFF',
                  display: 'inline-block',
                  animation: 'typing 1.4s 0.4s infinite',
                }}
              />
            </span>
            <span style={{ color: '#9ca3af' }}>
              <strong style={{ color: '#e5e7eb' }}>{conversation.participant.username}</strong> is typing...
            </span>
          </div>
        )}
        <form onSubmit={handleSendText} style={styles.inputRow}>
          <button
            type="button"
            style={{
              ...styles.iconBtn,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              color: '#9ca3af',
            }}
            title="Attach file"
            disabled={conversation.isBlocked}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,.pdf,.doc,.docx,.txt';
              input.onchange = (e: Event) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const attachment: Attachment = {
                  name: file.name,
                  type: file.type,
                  size: `${(file.size / 1024).toFixed(1)} KB`,
                  url: URL.createObjectURL(file),
                };
                const msgType: MessageType = file.type.startsWith('image/')
                  ? 'image'
                  : 'file';
                onSendMessage(file.name, msgType, attachment);
              };
              input.click();
            }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
          </button>

          <div style={styles.inputWrap}>
            <button
              type="button"
              style={styles.shieldBtn}
              title="View encryption details"
              onClick={() => setShowVerifyModal(true)}
            >
              <Lock style={{ width: '17px', height: '17px' }} />
            </button>

            <input
              type="text"
              placeholder="Type an encrypted message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={styles.input}
              disabled={conversation.isBlocked}
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || conversation.isBlocked}
            style={{
              ...styles.sendBtn,
              opacity: !inputText.trim() || conversation.isBlocked ? 0.45 : 1,
            }}
            title="Send"
          >
            <Send style={{ width: '17px', height: '17px', color: '#000' }} />
          </button>
        </form>
      </div>

      {/* Verify Encryption Modal */}
      {showVerifyModal && (
        <div
          style={styles.verifyModal}
          onClick={() => setShowVerifyModal(false)}
        >
          <div style={styles.verifyBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: conversation.isE2EEEnabled
                    ? 'rgba(34,197,94,0.1)'
                    : 'rgba(0,207,255,0.1)',
                  border: conversation.isE2EEEnabled
                    ? '1px solid rgba(34,197,94,0.25)'
                    : '1px solid rgba(0,207,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {conversation.isE2EEEnabled ? (
                  <ShieldCheck style={{ width: '20px', height: '20px', color: '#22c55e' }} />
                ) : (
                  <Lock style={{ width: '20px', height: '20px', color: '#00CFFF' }} />
                )}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {conversation.isE2EEEnabled
                    ? 'End-to-End Encrypted'
                    : 'Establishing Encryption'}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: '#6b7280',
                  }}
                >
                  ECDH P-256 + Double Ratchet + AES-256-GCM
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '18px',
              }}
            >
              {/* Your fingerprint */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: '11px',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Your Fingerprint
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#00CFFF',
                    fontFamily: 'monospace',
                    letterSpacing: '0.08em',
                  }}
                >
                  {localFp || 'Generating...'}
                </p>
              </div>

              {/* Contact fingerprint */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: '11px',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Contact Fingerprint
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#00CFFF',
                    fontFamily: 'monospace',
                    letterSpacing: '0.08em',
                  }}
                >
                  {peerFp || conversation.participant.encryptionKeyFingerprint || 'Unknown'}
                </p>
              </div>

              {/* Encryption standard */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: '11px',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Encryption Standard
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#e5e7eb',
                    fontFamily: 'monospace',
                  }}
                >
                  AES-256-GCM + ECDH + Double Ratchet
                </p>
              </div>

              {/* Verification status */}
              {conversation.isE2EEEnabled && (
                <div
                  style={{
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCheck
                    style={{
                      width: '16px',
                      height: '16px',
                      color: '#22c55e',
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#86efac',
                    }}
                  >
                    Connection verified &mdash; No interception detected
                  </p>
                </div>
              )}

              {!conversation.isE2EEEnabled && (
                <div
                  style={{
                    background: 'rgba(251,191,36,0.06)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle
                    style={{
                      width: '16px',
                      height: '16px',
                      color: '#fbbf24',
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#fde68a',
                    }}
                  >
                    Key exchange in progress &mdash; messages will be encrypted
                    shortly
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowVerifyModal(false)}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '12px',
                border: 'none',
                background: '#00CFFF',
                color: '#000',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={styles.verifyModal}
          onClick={() => setShowDeleteModal(false)}
        >
          <div style={styles.verifyBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle
                  style={{ width: '20px', height: '20px', color: '#ef4444' }}
                />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  Delete Conversation
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p
              style={{
                margin: '0 0 18px',
                fontSize: '14px',
                color: '#9ca3af',
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to delete this conversation with{' '}
              <strong style={{ color: '#e5e7eb' }}>
                @{conversation.participant.username}
              </strong>
              ? All encrypted messages and encryption keys for this conversation
              will be permanently destroyed.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')
                }
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteChat(conversation.id);
                  setShowDeleteModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#dc2626')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = '#ef4444')
                }
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearHistoryModal && (
        <div
          style={styles.verifyModal}
          onClick={() => setShowClearHistoryModal(false)}
        >
          <div style={styles.verifyBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Eraser
                  style={{ width: '20px', height: '20px', color: '#fbbf24' }}
                />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  Clear Chat History
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  Remove all messages
                </p>
              </div>
            </div>

            <p
              style={{
                margin: '0 0 18px',
                fontSize: '14px',
                color: '#9ca3af',
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to clear all messages in this conversation
              with{' '}
              <strong style={{ color: '#e5e7eb' }}>
                @{conversation.participant.username}
              </strong>
              ? You will remain in the conversation but all message history will
              be erased.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowClearHistoryModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')
                }
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory(conversation.id);
                  setShowClearHistoryModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#f59e0b',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#d97706')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = '#f59e0b')
                }
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
