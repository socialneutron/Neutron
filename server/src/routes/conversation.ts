import { Router } from 'express'
import * as conversationController from '../controllers/conversationController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, conversationController.list)
router.get('/requests', authenticate, conversationController.getRequests)
router.get('/unread-count', authenticate, conversationController.unreadCount)
router.get('/:id', authenticate, conversationController.get)
router.post('/direct', authenticate, conversationController.createOrGetDirect)
router.post('/group', authenticate, conversationController.createGroup)
router.post('/:id/accept', authenticate, conversationController.acceptRequest)
router.post('/:id/read', authenticate, conversationController.markRead)
router.put('/:id/archive', authenticate, conversationController.archive)

export default router
