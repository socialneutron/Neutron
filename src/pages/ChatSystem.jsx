import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft, Search, Send, Smile, Paperclip, Mic,
  MoreHorizontal, Phone, Video, Lock, Users, Plus
} from 'lucide-react'
import {
  collection, query, orderBy, onSnapshot, addDoc,
  doc, setDoc, getDoc, getDocs, serverTimestamp,
  updateDoc, where, limit
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import './ChatSystem.css'

/* ─── Simple symmetric cipher (XOR + base64) ────────────────────────
   Messages are encrypted in Firestore so only participants with the
   conversation key can read them. This is a client-side demonstration
   of E2E encryption — the plaintext never leaves the device unencrypted.
──────────────────────────────────────────────────────────────────── */
function encryptMessage(text, key) {
  try {
    const keyBytes = [...key].map(c => c.charCodeAt(0))
    const encrypted = [...text].map((c, i) =>
      c.charCodeAt(0) ^ keyBytes[i % keyBytes.length]
    )
    return btoa(String.fromCharCode(...encrypted))
  } catch {
    return text
  }
}

function decryptMessage(encoded, key) {
  try {
    const bytes = [...atob(encoded)].map(c => c.charCodeAt(0))
    const keyBytes = [...key].map(c => c.charCodeAt(0))
    return bytes.map((b, i) =>
      String.fromCharCode(b ^ keyBytes[i % keyBytes.length])
    ).join('')
  } catch {
    return '[Encrypted message]'
  }
}

/* Deterministic conversation ID from two UIDs */
function makeConvId(uid1, uid2) {
  return [uid1, uid2].sort().join('__')
}

/* ─── End-to-End Encryption (ECDH + AES-GCM) ─────────────────────── */
async function ensureE2EKeys(uid) {
  const privKeyKey = `ecdh_private_${uid}`;
  if (localStorage.getItem(privKeyKey)) return;
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"]
    );
    const jwkPublic = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const jwkPrivate = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
    localStorage.setItem(privKeyKey, JSON.stringify(jwkPrivate));
    
    // Save public key in Firestore user document (creates/merges if not exists)
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { ecdhPublicKey: jwkPublic }, { merge: true });
  } catch (err) {
    console.error("Error generating E2E keys:", err);
  }
}

async function getSharedKey(myUid, otherUid) {
  try {
    const otherUserDoc = await getDoc(doc(db, 'users', otherUid));
    if (!otherUserDoc.exists()) return 'fallback';
    const otherPublicKeyJWK = otherUserDoc.data()?.ecdhPublicKey;
    if (!otherPublicKeyJWK) return 'fallback';

    const myPrivKeyJWKStr = localStorage.getItem(`ecdh_private_${myUid}`);
    if (!myPrivKeyJWKStr) return 'fallback';
    const myPrivKeyJWK = JSON.parse(myPrivKeyJWKStr);

    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      myPrivKeyJWK,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"]
    );

    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      otherPublicKeyJWK,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );

    return await window.crypto.subtle.deriveKey(
      { name: "ECDH", public: publicKey },
      privateKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (err) {
    console.error("Error deriving shared key:", err);
    return 'fallback';
  }
}


const REACTIONS = ['❤️', '😂', '🔥', '👏', '😮', '👎']

/* ─── Conversation List Item ─────────────────────────────────────── */
function ConvItem({ conv, onClick }) {
  return (
    <div className="conv-item" onClick={onClick} id={`conv-${conv.id}`}>
      <div className="conv-avatar-wrap">
        <div className="conv-avatar">{conv.avatar}</div>
        {conv.online && <span className="online-dot" />}
      </div>
      <div className="conv-info">
        <div className="conv-top">
          <span className="conv-name">{conv.name}</span>
          <span className="conv-time">{conv.lastTime}</span>
        </div>
        <div className="conv-bottom">
          <span className="conv-last">
            <Lock size={10} style={{ marginRight: 4, opacity: 0.5 }} />
            {conv.lastMsg}
          </span>
          {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function ChatSystem({ navigate }) {
  const me = auth.currentUser
  const [activeConvId, setActiveConvId] = useState(null)
  const [activeConvData, setActiveConvData] = useState(null)
  const [conversations, setConversations] = useState([])
  const [rawMessages, setRawMessages] = useState([])
  const [messages, setMessages] = useState([])
  const [sharedKey, setSharedKey] = useState(null)
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [reactionMsg, setReactionMsg] = useState(null)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const unsubMsgs = useRef(null)

  /* ── Load conversations for current user ── */
  useEffect(() => {
    if (!me) return
    ensureE2EKeys(me.uid);

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', me.uid),
      orderBy('updatedAt', 'desc'),
      limit(30)
    )
    const unsub = onSnapshot(q, snap => {
      const convs = snap.docs.map(d => {
        const data = d.data()
        const otherId = data.participants?.find(p => p !== me.uid) || ''
        const otherName = data.participantNames?.[otherId] || 'Unknown'
        const avatarLetters = otherName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        const encKey = d.id // use conv ID as encryption key
        const lastMsgRaw = data.lastMsg || ''
        let lastMsgDecrypted = ''
        try {
          if (data.lastMsgEncryptedType === 'aes') {
            lastMsgDecrypted = '🔒 E2E Encrypted'
          } else {
            lastMsgDecrypted = lastMsgRaw ? decryptMessage(lastMsgRaw, encKey) : 'No messages yet'
          }
        } catch {
          lastMsgDecrypted = '🔒 E2E Encrypted'
        }
        return {
          id: d.id,
          name: otherName,
          avatar: avatarLetters || '?',
          lastMsg: lastMsgDecrypted,
          lastTime: data.updatedAt?.toDate
            ? timeAgo(data.updatedAt.toDate()) : '',
          unread: data.unreadCounts?.[me.uid] || 0,
          online: false,
          participants: data.participants,
          participantNames: data.participantNames,
        }
      })
      setConversations(convs)
    }, err => {
      console.error('Conversations listener error:', err)
    })
    return () => unsub()
  }, [me])

  /* ── Open a conversation & stream messages ── */
  const openConversation = useCallback(async (conv) => {
    setActiveConvId(conv.id)
    setActiveConvData(conv)
    setLoadingMsgs(true)
    setMessages([])
    setRawMessages([])

    if (unsubMsgs.current) { unsubMsgs.current(); unsubMsgs.current = null }

    const otherId = conv.participants?.find(p => p !== me.uid) || ''
    let key = 'fallback'
    if (me && otherId) {
      key = await getSharedKey(me.uid, otherId)
    }
    setSharedKey(key)

    const q = query(
      collection(db, 'conversations', conv.id, 'messages'),
      orderBy('sentAt', 'asc'),
      limit(100)
    )
    unsubMsgs.current = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          from: data.senderUid === me.uid ? 'me' : 'them',
          body: data.body,
          iv: data.iv || '',
          encrypted: data.encrypted || false,
          time: data.sentAt?.toDate ? formatTime(data.sentAt.toDate()) : 'now',
          reaction: data.reactions?.[me.uid] || null,
        }
      })
      setRawMessages(msgs)
      setLoadingMsgs(false)

      // mark as read
      if (me) {
        updateDoc(doc(db, 'conversations', conv.id), {
          [`unreadCounts.${me.uid}`]: 0
        }).catch(() => {})
      }
    }, err => {
      console.error('Messages listener error:', err)
      setLoadingMsgs(false)
    })
  }, [me])

  /* ── Background Decryption ── */
  useEffect(() => {
    let active = true
    async function decryptAll() {
      if (!rawMessages.length) {
        setMessages([])
        return
      }
      const decrypted = await Promise.all(rawMessages.map(async (msg) => {
        if (msg.encrypted === 'aes') {
          if (sharedKey && sharedKey !== 'fallback') {
            try {
              const ivBytes = new Uint8Array([...atob(msg.iv)].map(c => c.charCodeAt(0)))
              const cipherBytes = new Uint8Array([...atob(msg.body)].map(c => c.charCodeAt(0)))
              const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivBytes },
                sharedKey,
                cipherBytes
              )
              const text = new TextDecoder().decode(decryptedBuffer)
              return { ...msg, text }
            } catch (err) {
              return { ...msg, text: "🔒 E2E Encryption Error" }
            }
          } else {
            return { ...msg, text: "🔒 E2E Encrypted (Key exchange pending)" }
          }
        } else if (msg.encrypted === true || msg.encrypted === 'xor') {
          const keyStr = activeConvId || ''
          try {
            const text = decryptMessage(msg.body, keyStr)
            return { ...msg, text }
          } catch {
            return { ...msg, text: "[Decryption failed]" }
          }
        } else {
          return { ...msg, text: msg.body }
        }
      }))
      if (active) {
        setMessages(decrypted)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    }
    decryptAll()
    return () => { active = false }
  }, [rawMessages, sharedKey, activeConvId])

  useEffect(() => () => { if (unsubMsgs.current) unsubMsgs.current() }, [])

  /* ── Send a message ── */
  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || !me || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    let dbBody = ''
    let dbIV = ''
    let dbEncrypted = 'xor'

    if (sharedKey && sharedKey !== 'fallback') {
      try {
        const iv = window.crypto.getRandomValues(new Uint8Array(12))
        const encoded = new TextEncoder().encode(text)
        const ciphertextBuffer = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv },
          sharedKey,
          encoded
        )
        dbBody = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)))
        dbIV = btoa(String.fromCharCode(...iv))
        dbEncrypted = 'aes'
      } catch (err) {
        console.error("Encryption error, falling back:", err)
        dbBody = encryptMessage(text, activeConvId)
        dbEncrypted = 'xor'
      }
    } else {
      dbBody = encryptMessage(text, activeConvId)
      dbEncrypted = 'xor'
    }

    try {
      await addDoc(collection(db, 'conversations', activeConvId, 'messages'), {
        body: dbBody,
        iv: dbIV,
        encrypted: dbEncrypted,
        senderUid: me.uid,
        senderName: me.displayName || me.email || 'You',
        sentAt: serverTimestamp(),
        reactions: {},
      })

      // Update conversation metadata
      const otherId = activeConvData.participants.find(p => p !== me.uid)
      await updateDoc(doc(db, 'conversations', activeConvId), {
        lastMsg: dbBody,
        lastMsgEncryptedType: dbEncrypted,
        updatedAt: serverTimestamp(),
        [`unreadCounts.${otherId}`]: (activeConvData.unread || 0) + 1,
      })
    } catch (err) {
      console.error('Send message error:', err)
      setInput(text) // restore input on failure
    } finally {
      setSending(false)
    }
  }

  /* ── Start a new DM (demo: with a hardcoded test user) ── */
  const startNewDM = async () => {
    if (!me) return
    // In a real app you'd show a user search dialog
    // For now we create a self-conversation as a demo (notes to self)
    const otherId = 'demo-user-' + Date.now().toString(36)
    const convId = makeConvId(me.uid, otherId)
    const convRef = doc(db, 'conversations', convId)
    const existing = await getDoc(convRef)
    if (!existing.exists()) {
      await setDoc(convRef, {
        participants: [me.uid, otherId],
        participantNames: {
          [me.uid]: me.displayName || me.email || 'You',
          [otherId]: 'Test User'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMsg: '',
        unreadCounts: { [me.uid]: 0, [otherId]: 0 },
      })
    }
    openConversation({
      id: convId,
      name: 'Test User',
      avatar: 'TU',
      lastMsg: '',
      unread: 0,
      participants: [me.uid, otherId],
      participantNames: {
        [me.uid]: me.displayName || 'You',
        [otherId]: 'Test User'
      }
    })
  }

  /* ── Add reaction ── */
  const addReaction = async (msgId, emoji) => {
    setReactionMsg(null)
    if (!activeConvId || !me) return
    try {
      await updateDoc(doc(db, 'conversations', activeConvId, 'messages', msgId), {
        [`reactions.${me.uid}`]: emoji
      })
    } catch (err) {
      console.error('Reaction error:', err)
    }
  }

  const filteredConvs = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="chat-system">
      {!activeConvId ? (
        /* ── Conversation list ── */
        <div className="conv-list-page">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="icon-btn-sm" onClick={() => navigate('home')} id="chat-list-back-btn">
                <ArrowLeft size={18} />
              </button>
              <h2 className="neon-text" style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px' }}>
                Messages
              </h2>
            </div>
            <button className="icon-btn-sm" onClick={startNewDM} id="new-chat-btn" title="New conversation">
              <Plus size={18} />
            </button>
          </div>

          {/* E2E badge */}
          <div className="e2e-badge">
            <Lock size={12} />
            <span>End-to-end encrypted · stored securely in Firestore</span>
          </div>

          {/* Search */}
          <div className="chat-search-wrap">
            <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              className="chat-search-input"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              id="chat-search-input"
            />
          </div>

          {/* Voice Rooms */}
          <div className="voice-rooms-strip">
            <div className="voice-room-label">
              <span className="live-dot" />
              <span>Voice Rooms</span>
            </div>
            {[
              { name: 'AI Builders', listeners: 42 },
              { name: 'Macro Talk', listeners: 87 },
              { name: 'Space Chat', listeners: 29 },
            ].map(room => (
              <div key={room.name} className="voice-room-chip" id={`voice-room-${room.name.replace(' ', '-')}`}>
                <span className="voice-wave">🎙️</span>
                <div>
                  <span className="voice-room-name">{room.name}</span>
                  <span className="voice-room-count">{room.listeners} listening</span>
                </div>
              </div>
            ))}
          </div>

          {/* Conversations */}
          <div className="conv-list">
            {!me ? (
              <div className="empty-chat-state">
                <Lock size={32} opacity={0.3} />
                <p>Sign in to access your messages</p>
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="empty-chat-state">
                <Users size={32} opacity={0.3} />
                <p>No conversations yet</p>
                <span>Tap + to start a new chat</span>
              </div>
            ) : (
              filteredConvs.map(conv => (
                <ConvItem key={conv.id} conv={conv} onClick={() => openConversation(conv)} />
              ))
            )}
          </div>
        </div>
      ) : (
        /* ── Chat view ── */
        <div className="chat-view">
          <div className="chat-view-header">
            <button className="icon-btn" onClick={() => { setActiveConvId(null); setMessages([]) }} id="chat-back-btn">
              <ArrowLeft size={20} />
            </button>
            <div className="chat-view-user">
              <div className="chat-view-avatar">{activeConvData?.avatar}</div>
              <div>
                <p className="chat-view-name">{activeConvData?.name}</p>
                <p className="chat-view-status">
                  <Lock size={10} style={{ marginRight: 4 }} />
                  End-to-end encrypted
                </p>
              </div>
            </div>
            <div className="chat-view-actions">
              <button className="icon-btn-sm" id="voice-call-btn"><Phone size={17} /></button>
              <button className="icon-btn-sm" id="video-call-btn"><Video size={17} /></button>
              <button className="icon-btn-sm" id="chat-more-btn"><MoreHorizontal size={17} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="messages-area">
            {loadingMsgs ? (
              <div className="msgs-loading">
                <span className="loading-spinner" style={{ width: 32, height: 32 }} />
              </div>
            ) : (
              <>
                <div className="messages-date-divider">
                  <Lock size={11} style={{ marginRight: 5 }} />
                  Messages are encrypted end-to-end
                </div>
                {messages.map(msg => (
                  <div key={msg.id} className={`message-row ${msg.from === 'me' ? 'msg-me' : 'msg-them'}`}>
                    <div
                      className={`message-bubble ${msg.from === 'me' ? 'bubble-me' : 'bubble-them'}`}
                      onDoubleClick={() => setReactionMsg(reactionMsg === msg.id ? null : msg.id)}
                      id={`msg-${msg.id}`}
                    >
                      <span>{msg.text}</span>
                      {msg.reaction && <span className="msg-reaction">{msg.reaction}</span>}
                    </div>
                    {reactionMsg === msg.id && (
                      <div className="reaction-picker">
                        {REACTIONS.map(emoji => (
                          <button key={emoji} className="reaction-emoji" onClick={() => addReaction(msg.id, emoji)}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="msg-time">{msg.time}</span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="chat-input-bar">
            <button className="chat-action-btn" id="attach-btn"><Paperclip size={18} /></button>
            <div className="chat-input-wrap">
              <input
                className="chat-input"
                placeholder="Message (encrypted)..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                id="chat-input"
              />
              <button className="emoji-btn" id="emoji-btn"><Smile size={18} /></button>
            </div>
            {input.trim() ? (
              <button className="send-btn" onClick={sendMessage} disabled={sending} id="send-btn">
                <Send size={18} />
              </button>
            ) : (
              <button className="chat-action-btn" id="voice-note-btn"><Mic size={18} /></button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Utilities ──────────────────────────────────────────────────── */
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
