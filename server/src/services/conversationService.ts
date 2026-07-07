import { v4 as uuid } from 'uuid'
import { query, queryOne, queryMany } from '../database'
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors'
import type {
  Conversation, Participant, ConversationWithParticipants,
} from '../types'

export async function listConversations(userId: string) {
  const rows = await queryMany(`
    SELECT c.*, p.last_read_at,
      (SELECT count(*)::int FROM messages m
       WHERE m.conversation_id = c.id
         AND m.status != 'seen'
         AND m.sender_id != $1
         AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
      ) AS unread_count
    FROM conversations c
    JOIN participants p ON p.conversation_id = c.id AND p.user_id = $1
    WHERE c.status != 'archived'
    ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC
  `, [userId])

  const participantIds = rows.map(r => r.id)
  let participantsMap: Record<string, any[]> = {}
  if (participantIds.length > 0) {
    const placeholders = participantIds.map((_, i) => `$${i + 2}`).join(',')
    const parts = await queryMany(`
      SELECT p.*, u.username, u.profile_picture
      FROM participants p
      JOIN users u ON u.id = p.user_id
      WHERE p.conversation_id IN (${placeholders})
    `, [userId, ...participantIds])
    for (const p of parts) {
      if (!participantsMap[p.conversation_id]) participantsMap[p.conversation_id] = []
      participantsMap[p.conversation_id].push(p)
    }
  }

  return rows.map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    status: r.status,
    last_message: r.last_message,
    last_message_id: r.last_message_id,
    last_sender_id: r.last_sender_id,
    last_message_at: r.last_message_at,
    last_sender: r.last_sender_id ? { id: r.last_sender_id } : null,
    created_at: r.created_at,
    updated_at: r.updated_at,
    unread_count: parseInt(r.unread_count) || 0,
    participants: participantsMap[r.id] || [],
  }))
}

export async function getConversation(conversationId: string, userId: string) {
  const conv = await queryOne(
    'SELECT * FROM conversations WHERE id = $1',
    [conversationId]
  )
  if (!conv) throw new NotFoundError('Conversation not found')

  const isParticipant = await queryOne(
    'SELECT * FROM participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  )
  if (!isParticipant) throw new ForbiddenError('Not a participant in this conversation')

  const participants = await queryMany(`
    SELECT p.*, u.username, u.profile_picture
    FROM participants p
    JOIN users u ON u.id = p.user_id
    WHERE p.conversation_id = $1
  `, [conversationId])

  return { ...conv, participants }
}

export async function createOrGetDirectConversation(userId: string, otherUserId: string) {
  const existing = await queryOne(`
    SELECT c.id FROM conversations c
    WHERE c.type = 'direct' AND c.status = 'active'
      AND EXISTS (
        SELECT 1 FROM participants p1
        WHERE p1.conversation_id = c.id AND p1.user_id = $1
      )
      AND EXISTS (
        SELECT 1 FROM participants p2
        WHERE p2.conversation_id = c.id AND p2.user_id = $2
      )
  `, [userId, otherUserId])

  if (existing) return getConversation(existing.id, userId)

  const otherUser = await queryOne(
    'SELECT id, account_status FROM users WHERE id = $1',
    [otherUserId]
  )
  if (!otherUser) throw new NotFoundError('User not found')

  const convId = uuid()
  const isPending = otherUser.account_status === 'suspended'

  await query(
    `INSERT INTO conversations (id, type, status) VALUES ($1, 'direct', $2)`,
    [convId, isPending ? 'pending' : 'active']
  )

  await query(
    'INSERT INTO participants (id, conversation_id, user_id, is_admin) VALUES ($1, $2, $3, TRUE), ($4, $5, $6, FALSE)',
    [uuid(), convId, userId, uuid(), convId, otherUserId]
  )

  return getConversation(convId, userId)
}

export async function createGroupConversation(userId: string, title: string, participantIds: string[]) {
  if (!title.trim()) throw new BadRequestError('Group title is required')
  if (participantIds.length < 2) throw new BadRequestError('Group needs at least 2 participants')
  if (!participantIds.includes(userId)) participantIds.unshift(userId)

  const convId = uuid()
  await query(
    `INSERT INTO conversations (id, type, title) VALUES ($1, 'group', $2)`,
    [convId, title.trim()]
  )

  for (const pid of participantIds) {
    await query(
      'INSERT INTO participants (id, conversation_id, user_id, is_admin) VALUES ($1, $2, $3, $4)',
      [uuid(), convId, pid, pid === userId ? 'TRUE' : 'FALSE']
    )
  }

  return getConversation(convId, userId)
}

export async function acceptMessageRequest(conversationId: string, userId: string) {
  const conv = await queryOne(
    'SELECT * FROM conversations WHERE id = $1 AND status = $2',
    [conversationId, 'pending']
  )
  if (!conv) throw new NotFoundError('Pending conversation not found')

  const isParticipant = await queryOne(
    'SELECT * FROM participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  )
  if (!isParticipant) throw new ForbiddenError('Not a participant')

  await query(
    "UPDATE conversations SET status = 'active' WHERE id = $1",
    [conversationId]
  )

  return getConversation(conversationId, userId)
}

export async function getMessageRequests(userId: string) {
  return await queryMany(`
    SELECT c.*, p.last_read_at,
      (SELECT count(*)::int FROM messages m
       WHERE m.conversation_id = c.id AND m.sender_id != $1
         AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
      ) AS unread_count
    FROM conversations c
    JOIN participants p ON p.conversation_id = c.id AND p.user_id = $1
    WHERE c.status = 'pending'
    ORDER BY c.last_message_at DESC NULLS LAST
  `, [userId])
}

export async function archiveConversation(conversationId: string, userId: string) {
  const isParticipant = await queryOne(
    'SELECT * FROM participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  )
  if (!isParticipant) throw new ForbiddenError('Not a participant')

  await query(
    "UPDATE conversations SET status = 'archived' WHERE id = $1",
    [conversationId]
  )
  return { success: true }
}

export async function markConversationRead(conversationId: string, userId: string, lastMessageId: string) {
  await query(
    'UPDATE participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  )
  await query(
    `INSERT INTO read_receipts (id, user_id, message_id, conversation_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, message_id) DO NOTHING`,
    [uuid(), userId, lastMessageId, conversationId]
  )
  return { success: true }
}

export async function getUnreadCount(userId: string) {
  const result = await queryOne(`
    SELECT count(*)::int AS count FROM messages m
    JOIN participants p ON p.conversation_id = m.conversation_id AND p.user_id = $1
    WHERE m.sender_id != $1
      AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
      AND m.status != 'seen'
  `, [userId])
  return { count: parseInt(result?.count) || 0 }
}
