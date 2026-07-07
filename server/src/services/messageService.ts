import { v4 as uuid } from 'uuid'
import { query, queryOne, queryMany } from '../database'
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors'
import type {
  Message, MessageWithSender, MessageType,
} from '../types'

const PAGE_SIZE = 50

function buildMessageWithSender(row: any): MessageWithSender {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    content: row.content,
    message_type: row.message_type,
    media_url: row.media_url,
    media_width: row.media_width,
    media_height: row.media_height,
    media_duration: row.media_duration,
    file_name: row.file_name,
    file_size: row.file_size,
    mime_type: row.mime_type,
    reply_to: row.reply_to,
    post_id: row.post_id,
    business_id: row.business_id,
    status: row.status,
    created_at: row.created_at,
    sender: {
      id: row.sender_id,
      username: row.sender_username || '',
      profile_picture: row.sender_picture || '',
    },
    reactions: [],
    reply_to_message: row.reply_to
      ? {
          id: row.reply_id || row.reply_to,
          content: row.reply_content || '',
          sender_id: row.reply_sender_id || '',
          message_type: row.reply_type || 'text',
        }
      : null,
  }
}

async function attachReactions(messages: MessageWithSender[]) {
  if (messages.length === 0) return
  const ids = messages.map(m => m.id)
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',')
  const reactions = await queryMany(
    `SELECT mr.*, u.username, u.profile_picture
     FROM message_reactions mr
     JOIN users u ON u.id = mr.user_id
     WHERE mr.message_id IN (${placeholders})
     ORDER BY mr.created_at`,
    ids
  )
  const grouped: Record<string, any[]> = {}
  for (const r of reactions) {
    if (!grouped[r.message_id]) grouped[r.message_id] = []
    grouped[r.message_id].push(r)
  }
  for (const m of messages) {
    m.reactions = grouped[m.id] || []
  }
}

export async function sendMessage(data: {
  conversation_id: string
  sender_id: string
  content?: string
  message_type?: MessageType
  media_url?: string
  media_width?: number
  media_height?: number
  media_duration?: number
  file_name?: string
  file_size?: number
  mime_type?: string
  reply_to?: string
  post_id?: string
  business_id?: string
}) {
  const isParticipant = await queryOne(
    'SELECT * FROM participants WHERE conversation_id = $1 AND user_id = $2',
    [data.conversation_id, data.sender_id]
  )
  if (!isParticipant) throw new ForbiddenError('Not a participant in this conversation')

  const conv = await queryOne('SELECT * FROM conversations WHERE id = $1', [data.conversation_id])
  if (!conv) throw new NotFoundError('Conversation not found')
  if (conv.status === 'pending' && isParticipant.is_admin === false) {
    throw new ForbiddenError('Message request not yet accepted')
  }

  const messageId = uuid()
  await query(`
    INSERT INTO messages (id, conversation_id, sender_id, content, message_type,
      media_url, media_width, media_height, media_duration, file_name, file_size, mime_type,
      reply_to, post_id, business_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [
    messageId, data.conversation_id, data.sender_id,
    data.content || '', data.message_type || 'text',
    data.media_url || '', data.media_width || null, data.media_height || null,
    data.media_duration || null, data.file_name || '', data.file_size || 0,
    data.mime_type || '',
    data.reply_to || null, data.post_id || null, data.business_id || null,
  ])

  const snippet = data.message_type === 'text'
    ? (data.content?.substring(0, 120) || '')
    : data.message_type === 'image' ? '📷 Photo'
    : data.message_type === 'video' ? '🎬 Video'
    : data.message_type === 'audio' ? '🎵 Audio'
    : data.message_type === 'shared_post' ? '📝 Shared a post'
    : data.message_type === 'shared_reel' ? '🎞️ Shared a reel'
    : data.message_type === 'business_share' ? '🏢 Shared a business'
    : '📎 File'

  await query(`
    UPDATE conversations
    SET last_message = $1, last_message_id = $2, last_sender_id = $3, last_message_at = NOW()
    WHERE id = $4
  `, [snippet, messageId, data.sender_id, data.conversation_id])

  const msg = await queryOne(`
    SELECT m.*, u.username AS sender_username, u.profile_picture AS sender_picture
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = $1
  `, [messageId])

  const result = buildMessageWithSender(msg)
  if (data.reply_to) {
    const reply = await queryOne(
      'SELECT id, content, sender_id, message_type FROM messages WHERE id = $1',
      [data.reply_to]
    )
    if (reply) result.reply_to_message = reply
  }
  await attachReactions([result])

  return {
    message: result,
    conversation_snippet: snippet,
  }
}

export async function getMessages(conversationId: string, userId: string, cursor?: string, limit: number = PAGE_SIZE) {
  const isParticipant = await queryOne(
    'SELECT * FROM participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  )
  if (!isParticipant) throw new ForbiddenError('Not a participant')

  let rows
  if (cursor) {
    rows = await queryMany(`
      SELECT m.*, u.username AS sender_username, u.profile_picture AS sender_picture,
        rm.id AS reply_id, rm.content AS reply_content, rm.sender_id AS reply_sender_id,
        rm.message_type AS reply_type
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN messages rm ON rm.id = m.reply_to
      WHERE m.conversation_id = $1 AND m.created_at < (SELECT created_at FROM messages WHERE id = $2)
      ORDER BY m.created_at DESC
      LIMIT $3
    `, [conversationId, cursor, limit])
  } else {
    rows = await queryMany(`
      SELECT m.*, u.username AS sender_username, u.profile_picture AS sender_picture,
        rm.id AS reply_id, rm.content AS reply_content, rm.sender_id AS reply_sender_id,
        rm.message_type AS reply_type
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN messages rm ON rm.id = m.reply_to
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2
    `, [conversationId, limit])
  }

  const messages = rows.map(buildMessageWithSender)
  await attachReactions(messages)

  return {
    messages: messages.reverse(),
    next_cursor: rows.length === limit ? rows[rows.length - 1].id : null,
  }
}

export async function getMessage(messageId: string, userId: string) {
  const msg = await queryOne(`
    SELECT m.*, u.username AS sender_username, u.profile_picture AS sender_picture
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = $1
  `, [messageId])
  if (!msg) throw new NotFoundError('Message not found')

  const isParticipant = await queryOne(
    'SELECT * FROM participants WHERE conversation_id = $1 AND user_id = $2',
    [msg.conversation_id, userId]
  )
  if (!isParticipant) throw new ForbiddenError('Not a participant')

  const result = buildMessageWithSender(msg)
  await attachReactions([result])
  return result
}

export async function markDelivered(conversationId: string, userId: string, messageIds: string[]) {
  if (messageIds.length === 0) return { updated: 0 }

  const result = await query(`
    UPDATE messages SET status = 'delivered'
    WHERE id = ANY($1::uuid[])
      AND conversation_id = $2
      AND sender_id != $3
      AND status = 'sent'
  `, [messageIds, conversationId, userId])

  return { updated: result.rowCount }
}

export async function markSeen(conversationId: string, userId: string, messageId: string) {
  await query(`
    UPDATE messages SET status = 'seen'
    WHERE conversation_id = $1 AND sender_id != $2 AND status IN ('sent', 'delivered')
  `, [conversationId, userId])

  await query(
    `INSERT INTO read_receipts (id, user_id, message_id, conversation_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, message_id) DO NOTHING`,
    [uuid(), userId, messageId, conversationId]
  )

  await query(
    'UPDATE participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  )

  return { success: true }
}

export async function reactToMessage(messageId: string, userId: string, emoji: string) {
  const msg = await queryOne('SELECT * FROM messages WHERE id = $1', [messageId])
  if (!msg) throw new NotFoundError('Message not found')

  const isParticipant = await queryOne(
    'SELECT * FROM participants WHERE conversation_id = $1 AND user_id = $2',
    [msg.conversation_id, userId]
  )
  if (!isParticipant) throw new ForbiddenError('Not a participant')

  if (emoji) {
    await query(`
      INSERT INTO message_reactions (id, message_id, user_id, emoji)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (message_id, user_id)
      DO UPDATE SET emoji = $4
    `, [uuid(), messageId, userId, emoji])
  } else {
    await query(
      'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2',
      [messageId, userId]
    )
  }

  return getMessage(messageId, userId)
}

export async function deleteMessage(messageId: string, userId: string) {
  const msg = await queryOne('SELECT * FROM messages WHERE id = $1', [messageId])
  if (!msg) throw new NotFoundError('Message not found')
  if (msg.sender_id !== userId) throw new ForbiddenError('Can only delete your own messages')

  await query(
    "UPDATE messages SET content = '[deleted]', status = 'failed' WHERE id = $1",
    [messageId]
  )

  return { success: true }
}

export async function getMessageParticipants(conversationId: string) {
  const rows = await queryMany(
    'SELECT user_id FROM participants WHERE conversation_id = $1',
    [conversationId]
  )
  return rows.map(r => r.user_id)
}
