import { Router } from 'express'
import * as messageController from '../controllers/messageController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/:conversationId', authenticate, messageController.list)
router.get('/single/:id', authenticate, messageController.get)
router.post('/:conversationId/send', authenticate, messageController.send)
router.post('/:conversationId/delivered', authenticate, messageController.markDelivered)
router.post('/:conversationId/seen', authenticate, messageController.markSeen)
router.post('/:id/react', authenticate, messageController.react)
router.delete('/:id/react', authenticate, messageController.removeReaction)
router.delete('/:id', authenticate, messageController.remove)

export default router
