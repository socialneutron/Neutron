import { Request, Response, NextFunction } from 'express'
import * as messageService from '../services/messageService'
import { broadcastToConversation } from '../services/websocketService'

export async function send(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messageService.sendMessage({
      ...req.body,
      sender_id: req.user!.userId,
    })

    broadcastToConversation(req.body.conversation_id, req.user!.userId, {
      event: 'new_message',
      conversation_id: req.body.conversation_id,
      message: result.message,
      snippet: result.conversation_snippet,
    })

    res.status(201).json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messageService.getMessages(
      req.params.conversationId,
      req.user!.userId,
      req.query.cursor as string,
      parseInt(req.query.limit as string) || undefined,
    )
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messageService.getMessage(req.params.id, req.user!.userId)
    res.json({ success: true, data: { message: result } })
  } catch (err) { next(err) }
}

export async function markDelivered(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messageService.markDelivered(
      req.params.conversationId, req.user!.userId, req.body.message_ids
    )
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function markSeen(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messageService.markSeen(
      req.params.conversationId, req.user!.userId, req.body.message_id
    )
    broadcastToConversation(req.params.conversationId, req.user!.userId, {
      event: 'message_seen',
      conversation_id: req.params.conversationId,
      message_id: req.body.message_id,
      user_id: req.user!.userId,
    })
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function react(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messageService.reactToMessage(
      req.params.id, req.user!.userId, req.body.emoji
    )
    broadcastToConversation(result.conversation_id, req.user!.userId, {
      event: 'message_reaction',
      conversation_id: result.conversation_id,
      message_id: req.params.id,
      user_id: req.user!.userId,
      emoji: req.body.emoji,
      message: result,
    })
    res.json({ success: true, data: { message: result } })
  } catch (err) { next(err) }
}

export async function removeReaction(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messageService.reactToMessage(
      req.params.id, req.user!.userId, ''
    )
    res.json({ success: true, data: { message: result } })
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messageService.deleteMessage(req.params.id, req.user!.userId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}
