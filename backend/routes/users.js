const router = require('express').Router();
const usersController = require('../controllers/users.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { validateUpdateProfile } = require('../middleware/validate');

router.get('/:username', optionalAuth, usersController.getProfile);
router.put('/profile', verifyToken, validateUpdateProfile, usersController.updateProfile);
router.put('/avatar', verifyToken, usersController.updateAvatar);
router.put('/cover', verifyToken, usersController.updateCover);
router.post('/:id/follow', verifyToken, usersController.toggleFollow);
router.get('/:id/followers', usersController.getFollowers);
router.get('/:id/following', usersController.getFollowing);
router.get('/:id/posts', usersController.getUserPosts);

module.exports = router;
