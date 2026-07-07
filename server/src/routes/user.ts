import { Router } from 'express'
import * as userController from '../controllers/userController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { updateProfileSchema } from '../utils/validation'

const router = Router()

router.get('/profile', authenticate, userController.getProfile)
router.put('/profile', authenticate, validate(updateProfileSchema), userController.updateProfile)

export default router
