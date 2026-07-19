import React, { useState, useMemo } from 'react';
import { Conversation, UserProfile } from '../types';
import { Search, Shield, Check, CheckCheck, ArrowLeft, UserPlus } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import NeutronLogo from './NeutronLogo';
import MessageRequestPanel from './MessageRequestPanel';

function formatLastSeen(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Active now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface SidebarProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelectConversation: (id: string) => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  onCreateGroup: (groupName: string, memberIds: string[]) => void;
  myProfile: UserProfile;
  navigate?: (page: string, params?: any) => void;
  onlineUsers?: Set<string>;
}

export default function Sidebar({
  conversations,
  selectedId,
  onSelectConversation,
  onOpenSettings,
  onNewChat,
  onCreateGroup,
  myProfile,
  navigate,
  onlineUsers = new Set(),
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequests, setShowRequests] = useState(false);
  const pendingCount = useChatStore((s) => s.messageRequests.filter(r => r.status === 'pending').length);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      c.participant.username.toLowerCase().includes(q) ||
      c.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '260px',
        background: '#0d1117',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Header: Brand + Requests Button */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: '#0d1117',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {navigate && (
              <button
                onClick={() => navigate('home')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Back to Feed"
              >
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
              </button>
            )}
            <NeutronLogo size={32} />
            <span
              style={{
                fontWeight: 700,
                fontSize: '17px',
                color: '#ffffff',
                letterSpacing: '0.05em',
              }}
            >
              neutron
            </span>
          </div>

          {/* Requests Button - Icon only */}
          <button
            onClick={() => setShowRequests(!showRequests)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              border: showRequests
                ? '1px solid rgba(245,158,11,0.4)'
                : '1px solid rgba(255,255,255,0.08)',
              background: showRequests
                ? 'rgba(245,158,11,0.12)'
                : 'rgba(255,255,255,0.04)',
              color: showRequests ? '#f59e0b' : '#9ca3af',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Message Requests"
            onMouseEnter={(e) => {
              if (!showRequests) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!showRequests) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = '#9ca3af';
              }
            }}
          >
            <UserPlus size={16} />
            {pendingCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 99,
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '14px',
              height: '14px',
              color: '#4b5563',
            }}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e5e7eb',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Message Requests Panel — toggleable */}
      {showRequests && (
        <MessageRequestPanel
          onRequestAccepted={(convId) => {
            onSelectConversation(convId);
            setShowRequests(false);
          }}
        />
      )}

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredConversations.map((conv) => {
          const isSelected = selectedId === conv.id;
          const participant = conv.participant;
          const lastMsg = conv.messages[conv.messages.length - 1];

          let receiptIcon = null;
          if (lastMsg && lastMsg.senderId === 'me') {
            receiptIcon =
              lastMsg.status === 'read' ? (
                <CheckCheck style={{ width: '13px', height: '13px', color: '#00CFFF' }} />
              ) : (
                <Check style={{ width: '13px', height: '13px', color: '#6b7280' }} />
              );
          }

          return (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                borderLeft: isSelected ? '3px solid #00CFFF' : '3px solid transparent',
                background: isSelected
                  ? 'linear-gradient(90deg, rgba(0,207,255,0.12) 0%, transparent 100%)'
                  : 'transparent',
                transition: 'all 0.15s',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={participant.avatar}
                  alt={participant.username}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: isSelected ? '2px solid #00CFFF' : '2px solid rgba(255,255,255,0.1)',
                  }}
                  referrerPolicy="no-referrer"
                />
                {(participant.online || onlineUsers.has(participant.id)) && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '1px',
                      right: '1px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      border: '2px solid #0d1117',
                    }}
                  />
                )}
              </div>

              {/* Text metadata */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '120px',
                      }}
                    >
                      {participant.username}
                    </span>
                    {participant.isVerified && (
                      <Shield style={{ width: '13px', height: '13px', color: '#00CFFF', flexShrink: 0 }} />
                    )}
                  </div>
                  {lastMsg && (
                    <span style={{ fontSize: '11px', color: conv.unreadCount > 0 ? '#00CFFF' : '#6b7280', fontFamily: 'monospace', flexShrink: 0, fontWeight: conv.unreadCount > 0 ? 600 : 400 }}>
                      {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <p
                    style={{
                      fontSize: '12px',
                      color: conv.unreadCount > 0 ? '#d1d5db' : '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      margin: 0,
                      fontWeight: conv.unreadCount > 0 ? 600 : 400,
                    }}
                  >
                    {lastMsg ? lastMsg.text : 'Ready to chat.'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    {receiptIcon}
                    {conv.unreadCount > 0 && (
                      <span
                        style={{
                          background: '#00CFFF',
                          color: '#000',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 7px',
                          borderRadius: '99px',
                          minWidth: '18px',
                          textAlign: 'center',
                        }}
                      >
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredConversations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <Search style={{ width: '24px', height: '24px', color: '#374151', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '12px', color: '#4b5563' }}>No channels found.</p>
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <img
          src={myProfile.avatar}
          alt="My avatar"
          style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
          referrerPolicy="no-referrer"
        />
        <div style={{ minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#e5e7eb', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {myProfile.username}
          </span>
          <p style={{ fontSize: '11px', color: '#22c55e', margin: 0 }}>● Active</p>
        </div>
      </div>
    </div>
  );
}
