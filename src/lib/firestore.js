import {
  collection, doc, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fsLimit, startAfter,
  onSnapshot, serverTimestamp, increment, getDoc, getDocs,
  writeBatch, arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from '../firebase'

// ── Users ──────────────────────────────────────────────────

export async function createUserProfile(uid, data) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      username: data.username || '',
      displayName: data.displayName || '',
      email: data.email || '',
      avatarUrl: data.avatarUrl || '',
      bio: data.bio || '',
      bannerImageUrl: data.bannerImageUrl || '',
      joinedAt: serverTimestamp(),
      followerCount: 0,
      followingCount: 0,
      isVerified: false,
    })
  }
}

export function onUserProfile(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export async function updateUserProfile(uid, data) {
  return updateDoc(doc(db, 'users', uid), data)
}

// ── Posts ──────────────────────────────────────────────────

export async function createPost(data) {
  const ref = await addDoc(collection(db, 'posts'), {
    authorUid: data.authorUid,
    authorUsername: data.authorUsername,
    authorAvatar: data.authorAvatar,
    contentText: data.contentText,
    mediaUrls: data.mediaUrls || [],
    category: data.category || 'General',
    categoryColor: data.categoryColor || '#4b5563',
    tags: data.tags || [],
    timestamp: serverTimestamp(),
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
  })
  return ref.id
}

export function onFeedPosts(callback, pageSize = 20) {
  const q = query(
    collection(db, 'posts'),
    orderBy('timestamp', 'desc'),
    fsLimit(pageSize)
  )
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map(d => ({ postId: d.id, ...d.data() }))
    callback(posts)
  })
}

export function onPostsByCategory(category, callback, pageSize = 20) {
  const q = query(
    collection(db, 'posts'),
    where('category', '==', category),
    orderBy('timestamp', 'desc'),
    fsLimit(pageSize)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ postId: d.id, ...d.data() })))
  })
}

export function onPostsByUser(uid, callback, pageSize = 20) {
  const q = query(
    collection(db, 'posts'),
    where('authorUid', '==', uid),
    orderBy('timestamp', 'desc'),
    fsLimit(pageSize)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ postId: d.id, ...d.data() })))
  })
}

export async function deletePost(postId) {
  return deleteDoc(doc(db, 'posts', postId))
}

// ── Likes ──────────────────────────────────────────────────

export async function toggleLike(userId, targetId, type = 'post') {
  const likeId = `${userId}_${targetId}`
  const likeRef = doc(db, 'likes', likeId)
  const likeSnap = await getDoc(likeRef)
  const batch = writeBatch(db)

  if (likeSnap.exists()) {
    batch.delete(likeRef)
    batch.update(doc(db, type === 'post' ? 'posts' : 'comments', targetId), {
      likesCount: increment(-1),
    })
    await batch.commit()
    return false
  } else {
    batch.set(likeRef, {
      userId,
      targetId,
      type,
      timestamp: serverTimestamp(),
    })
    batch.update(doc(db, type === 'post' ? 'posts' : 'comments', targetId), {
      likesCount: increment(1),
    })
    await batch.commit()
    return true
  }
}

export function onUserLike(userId, targetId, callback) {
  const likeId = `${userId}_${targetId}`
  return onSnapshot(doc(db, 'likes', likeId), (snap) => {
    callback(snap.exists())
  })
}

// ── Comments ───────────────────────────────────────────────

export async function addComment(postId, data) {
  const ref = await addDoc(collection(db, 'comments'), {
    postId,
    authorUid: data.authorUid,
    authorUsername: data.authorUsername,
    authorAvatar: data.authorAvatar,
    contentText: data.contentText,
    timestamp: serverTimestamp(),
    likesCount: 0,
  })
  await updateDoc(doc(db, 'posts', postId), {
    commentsCount: increment(1),
  })
  return ref.id
}

export function onPostComments(postId, callback, pageSize = 50) {
  const q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('timestamp', 'asc'),
    fsLimit(pageSize)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ commentId: d.id, ...d.data() })))
  })
}

export async function deleteComment(commentId, postId) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'comments', commentId))
  batch.update(doc(db, 'posts', postId), {
    commentsCount: increment(-1),
  })
  return batch.commit()
}

// ── Follows ────────────────────────────────────────────────

export async function toggleFollow(followerUid, targetUid) {
  const followId = `${followerUid}_${targetUid}`
  const followRef = doc(db, 'follows', followId)
  const followSnap = await getDoc(followRef)
  const batch = writeBatch(db)

  if (followSnap.exists()) {
    batch.delete(followRef)
    batch.update(doc(db, 'users', followerUid), { followingCount: increment(-1) })
    batch.update(doc(db, 'users', targetUid), { followerCount: increment(-1) })
    await batch.commit()
    return false
  } else {
    batch.set(followRef, {
      followerUid,
      targetUid,
      timestamp: serverTimestamp(),
    })
    batch.update(doc(db, 'users', followerUid), { followingCount: increment(1) })
    batch.update(doc(db, 'users', targetUid), { followerCount: increment(1) })
    await batch.commit()

    await addDoc(collection(db, 'notifications'), {
      recipientUid: targetUid,
      senderUid: followerUid,
      type: 'follow',
      targetId: null,
      isRead: false,
      timestamp: serverTimestamp(),
    })
    return true
  }
}

export function onFollowStatus(followerUid, targetUid, callback) {
  const followId = `${followerUid}_${targetUid}`
  return onSnapshot(doc(db, 'follows', followId), (snap) => {
    callback(snap.exists())
  })
}

// ── Chats & Messages ──────────────────────────────────────

export async function getOrCreateChat(uid1, uid2) {
  const q = query(
    collection(db, 'chats'),
    where('participantUids', 'array-contains', uid1)
  )
  const snap = await getDocs(q)
  const existing = snap.docs.find(d => {
    const participants = d.data().participantUids
    return participants.includes(uid2)
  })
  if (existing) return existing.id

  const ref = await addDoc(collection(db, 'chats'), {
    participantUids: [uid1, uid2],
    lastMessageText: '',
    lastMessageTimestamp: serverTimestamp(),
  })
  return ref.id
}

export async function sendMessage(chatId, senderUid, text) {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderUid,
    text,
    timestamp: serverTimestamp(),
    isRead: false,
  })
  return updateDoc(doc(db, 'chats', chatId), {
    lastMessageText: text,
    lastMessageTimestamp: serverTimestamp(),
  })
}

export function onChatMessages(chatId, callback) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ messageId: d.id, ...d.data() })))
  })
}

export function onUserChats(uid, callback) {
  const q = query(
    collection(db, 'chats'),
    where('participantUids', 'array-contains', uid),
    orderBy('lastMessageTimestamp', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ chatId: d.id, ...d.data() })))
  })
}

// ── Notifications ──────────────────────────────────────────

export function onUserNotifications(uid, callback, pageSize = 30) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', uid),
    orderBy('timestamp', 'desc'),
    fsLimit(pageSize)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ notificationId: d.id, ...d.data() })))
  })
}

export async function markNotificationRead(notificationId) {
  return updateDoc(doc(db, 'notifications', notificationId), { isRead: true })
}

export async function markAllNotificationsRead(uid) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', uid),
    where('isRead', '==', false)
  )
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.update(d.ref, { isRead: true }))
  return batch.commit()
}

// ── Bookmarks ──────────────────────────────────────────────

export async function toggleBookmark(userId, postId) {
  const bookmarkId = `${userId}_${postId}`
  const ref = doc(db, 'bookmarks', bookmarkId)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return deleteDoc(ref)
  } else {
    return addDoc(collection(db, 'bookmarks'), {
      userId,
      postId,
      timestamp: serverTimestamp(),
    })
  }
}

export function onUserBookmarks(userId, callback, pageSize = 30) {
  const q = query(
    collection(db, 'bookmarks'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    fsLimit(pageSize)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ bookmarkId: d.id, ...d.data() })))
  })
}

export function onBookmarkStatus(userId, postId, callback) {
  const bookmarkId = `${userId}_${postId}`
  return onSnapshot(doc(db, 'bookmarks', bookmarkId), (snap) => {
    callback(snap.exists())
  })
}
