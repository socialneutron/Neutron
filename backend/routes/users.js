const router = require('express').Router();
const usersController = require('../controllers/users.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { validateUpdateProfile } = require('../middleware/validate');
const { uploadSingleImage } = require('../middleware/upload');

router.get('/:username', optionalAuth, usersController.getProfile);
router.put('/profile', verifyToken, validateUpdateProfile, usersController.updateProfile);
router.put('/avatar', verifyToken, uploadSingleImage.single('avatar'), usersController.updateAvatar);
router.put('/cover', verifyToken, uploadSingleImage.single('cover'), usersController.updateCover);
router.post('/:userId/follow', verifyToken, usersController.toggleFollow);
router.get('/:userId/followers', usersController.getFollowers);
router.get('/:userId/following', usersController.getFollowing);
router.get('/:userId/posts', usersController.getUserPosts);

module.exports = router;
