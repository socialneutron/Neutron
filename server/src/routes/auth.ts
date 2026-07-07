import { Router } from 'express'
import * as authController from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { authLimiter } from '../middleware/rateLimiter'
import { validate } from '../middleware/validate'
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
} from '../utils/validation'

const router = Router()

router.post('/signup', authLimiter, validate(signupSchema), authController.signup)
router.post('/login', authLimiter, validate(loginSchema), authController.login)
router.post('/logout', authenticate, authController.logout)
router.post('/logout-all', authenticate, authController.logoutAll)
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken)
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword)
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword)
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), authController.verifyEmail)

export default router
