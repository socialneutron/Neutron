import { Request, Response, NextFunction } from 'express'
import * as conversationService from '../services/conversationService'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationService.listConversations(req.user!.userId)
    res.json({ success: true, data: { conversations: result } })
  } catch (err) { next(err) }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationService.getConversation(req.params.id, req.user!.userId)
    res.json({ success: true, data: { conversation: result } })
  } catch (err) { next(err) }
}

export async function createOrGetDirect(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationService.createOrGetDirectConversation(
      req.user!.userId, req.body.recipient_id
    )
    res.status(201).json({ success: true, data: { conversation: result } })
  } catch (err) { next(err) }
}

export async function createGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationService.createGroupConversation(
      req.user!.userId, req.body.title, req.body.participant_ids
    )
    res.status(201).json({ success: true, data: { conversation: result } })
  } catch (err) { next(err) }
}

export async function acceptRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationService.acceptMessageRequest(req.params.id, req.user!.userId)
    res.json({ success: true, data: { conversation: result } })
  } catch (err) { next(err) }
}

export async function getRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationService.getMessageRequests(req.user!.userId)
    res.json({ success: true, data: { conversations: result } })
  } catch (err) { next(err) }
}

export async function archive(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationService.archiveConversation(req.params.id, req.user!.userId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationService.markConversationRead(
      req.params.id, req.user!.userId, req.body.last_message_id
    )
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await conversationService.getUnreadCount(req.user!.userId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}
