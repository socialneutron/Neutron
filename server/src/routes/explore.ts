import { Router } from 'express'
import * as exploreController from '../controllers/exploreController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/feed', authenticate, exploreController.getFeed)
router.get('/page', authenticate, exploreController.getExplorePage)
router.get('/trending', authenticate, exploreController.getTrending)
router.get('/tags', authenticate, exploreController.getTags)
router.get('/suggested-users', authenticate, exploreController.getSuggestedUsers)
router.get('/search', authenticate, exploreController.search)
router.post('/action', authenticate, exploreController.recordAction)
router.get('/interests', authenticate, exploreController.getInterests)

export default router
