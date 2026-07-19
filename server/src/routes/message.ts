import { Router, Request, Response, NextFunction } from 'express'
import * as messageController from '../controllers/messageController'
import { authenticate } from '../middleware/auth'
import { pool } from '../database/pool'

const router = Router()

router.get('/single/:id', authenticate, messageController.get)
router.get('/:conversationId', authenticate, messageController.list)
router.post('/:conversationId/send', authenticate, messageController.send)
router.post('/:conversationId/delivered', authenticate, messageController.markDelivered)
router.post('/:conversationId/seen', authenticate, messageController.markSeen)
router.post('/:id/react', authenticate, messageController.react)
router.delete('/:id/react', authenticate, messageController.removeReaction)
router.delete('/:id', authenticate, messageController.remove)

// ── Public Key Lookup ──────────────────────────────────

router.get('/public-key/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      'SELECT public_key, fingerprint FROM users WHERE id = $1',
      [req.params.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } })
    }

    const { public_key, fingerprint } = result.rows[0]
    if (!public_key) {
      return res.status(404).json({ success: false, error: { code: 'NO_KEY', message: 'User has not uploaded a public key' } })
    }

    res.json({ success: true, data: { publicKey: public_key, fingerprint } })
  } catch (err) { next(err) }
})

export default router
