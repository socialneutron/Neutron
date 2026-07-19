import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

interface MessageToastItem {
  id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: Date;
  onClick: () => void;
}

interface MessageToastContextValue {
  addMessageToast: (toast: Omit<MessageToastItem, 'id' | 'timestamp'>) => void;
  removeMessageToast: (id: string) => void;
}

const MessageToastContext = createContext<MessageToastContextValue | null>(null);

export function useMessageToast() {
  return useContext(MessageToastContext);
}

export function MessageToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<MessageToastItem[]>([]);

  const removeMessageToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addMessageToast = useCallback(
    (toast: Omit<MessageToastItem, 'id' | 'timestamp'>) => {
      const newToast: MessageToastItem = {
        ...toast,
        id: `msg_toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date(),
      };
      setToasts((prev) => {
        const next = [newToast, ...prev];
        return next.slice(0, 3);
      });
    },
    []
  );

  return (
    <MessageToastContext.Provider value={{ addMessageToast, removeMessageToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 340,
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <MessageToastItemComponent
              key={toast.id}
              toast={toast}
              onDismiss={() => removeMessageToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </MessageToastContext.Provider>
  );
}

function MessageToastItemComponent({
  toast,
  onDismiss,
}: {
  toast: MessageToastItem;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const timeAgo = (() => {
    const diff = Date.now() - toast.timestamp.getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onClick={() => {
        toast.onClick();
        onDismiss();
      }}
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 14,
        background: 'rgba(9,15,30,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,207,255,0.15)',
        boxShadow:
          '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,207,255,0.05)',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = 'rgba(15,23,42,0.98)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = 'rgba(9,15,30,0.95)')
      }
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          flexShrink: 0,
          position: 'relative',
          background: toast.senderAvatar
            ? `url(${toast.senderAvatar}) center/cover`
            : 'linear-gradient(135deg, #00CFFF, #7928CA)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {!toast.senderAvatar &&
          (toast.senderName[0]?.toUpperCase() || '?')}
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'rgba(0,207,255,0.2)',
            border: '2px solid rgba(9,15,30,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MessageCircle size={9} color="#00CFFF" />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: '#f1f5f9',
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontWeight: 600 }}>{toast.senderName}</span>{' '}
          <span style={{ color: '#94a3b8' }}>sent a message</span>
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: 12,
            color: '#6b7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '220px',
          }}
        >
          {toast.text}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#6b7280' }}>{timeAgo}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}
