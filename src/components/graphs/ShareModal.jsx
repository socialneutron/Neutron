import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ExternalLink, MessageSquare, Share2 } from 'lucide-react';

const C = {
  bg: '#05050A',
  surface: '#090914',
  card: '#0d0d1a',
  border: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF',
  purple: '#7928CA',
  green: '#34D399',
  text: '#f1f5f9',
  muted: '#6b7280',
};

const mockUsers = [
  { id: 1, name: 'Alice Chen', avatar: 'AC', color: '#00D2FF' },
  { id: 2, name: 'Bob Rivera', avatar: 'BR', color: '#7928CA' },
  { id: 3, name: 'Cara Park', avatar: 'CP', color: '#34D399' },
  { id: 4, name: 'Dev Shah', avatar: 'DS', color: '#F59E0B' },
];

const socialPlatforms = [
  {
    name: 'Twitter/X',
    icon: MessageSquare,
    getUrl: (title, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'LinkedIn',
    icon: ExternalLink,
    getUrl: (title, url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Reddit',
    icon: ExternalLink,
    getUrl: (title, url) =>
      `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  {
    name: 'Telegram',
    icon: Share2,
    getUrl: (title, url) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
];

export default function ShareModal({ isOpen, onClose, graphId, graphTitle, navigate }) {
  const [copied, setCopied] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/graphs/${graphId}`
    : '';

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers(new Set());
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const toggleUser = (id) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSocialClick = (getUrl) => {
    window.open(getUrl(graphTitle, shareUrl), '_blank', 'noopener,noreferrer');
  };

  const handleShareToFeed = () => {
    navigate?.('create-post', { state: { graphId, graphTitle } });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(5,5,10,0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.text, fontFamily: 'Inter, sans-serif' }}>
                Share
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Copy Link */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                Copy Link
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  value={shareUrl}
                  style={{
                    flex: 1,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: C.text,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 14px',
                    background: copied ? C.green : C.cyan,
                    color: '#000',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                    transition: 'background 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Internal Share */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
                Internal Share
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {mockUsers.map((user) => {
                  const isSelected = selectedUsers.has(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        background: isSelected ? `${user.color}18` : C.card,
                        border: `1px solid ${isSelected ? user.color : C.border}`,
                        borderRadius: 10,
                        padding: '12px 4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: user.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={10} color="#000" strokeWidth={3} />
                        </div>
                      )}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: `${user.color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 600,
                          color: user.color,
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {user.avatar}
                      </div>
                      <span style={{ fontSize: 11, color: isSelected ? user.color : C.muted, fontFamily: 'Inter, sans-serif' }}>
                        {user.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* External Share */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: C.muted, marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
                External Share
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => handleSocialClick(platform.getUrl)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      color: C.text,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: 'Inter, sans-serif',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.muted)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
                  >
                    <platform.icon size={16} />
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Share to Feed */}
            <button
              onClick={handleShareToFeed}
              style={{
                width: '100%',
                padding: '12px 0',
                background: `linear-gradient(135deg, ${C.purple}, ${C.cyan})`,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: 0.3,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Share to Feed
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
