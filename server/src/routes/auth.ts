import { Router, Request, Response, NextFunction } from 'express'
import * as authController from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { authLimiter } from '../middleware/rateLimiter'
import { validate } from '../middleware/validate'
import { pool } from '../database/pool'
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
} from '../utils/validation'

const router = Router()

router.get('/check-username', authController.checkUsername)
router.post('/signup', authLimiter, validate(signupSchema), authController.signup)
router.post('/login', authLimiter, validate(loginSchema), authController.login)
router.post('/logout', authenticate, authController.logout)
router.post('/logout-all', authenticate, authController.logoutAll)
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken)
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword)
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword)
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), authController.verifyEmail)
router.post('/oauth-login', authLimiter, authController.oauthLogin)

// ── E2E Encryption Key Management ───────────────────────

router.post('/upload-key', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicKey, fingerprint } = req.body
    if (!publicKey || !fingerprint) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'publicKey and fingerprint required' } })
    }

    await pool.query(
      'UPDATE users SET public_key = $1, fingerprint = $2, key_uploaded_at = now() WHERE id = $3',
      [publicKey, fingerprint, req.user!.userId]
    )

    res.json({ success: true, data: { message: 'Public key uploaded successfully' } })
  } catch (err) { next(err) }
})

export default router
