const router = require('express').Router();
const postsController = require('../controllers/posts.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { validateCreatePost, validateUpdatePost } = require('../middleware/validate');
const { uploadPostMedia } = require('../middleware/upload');

router.post('/', verifyToken, uploadPostMedia, validateCreatePost, postsController.createPost);
router.get('/feed', verifyToken, postsController.getFeed);
router.get('/trending', postsController.getTrending);
router.get('/hashtag/:hashtag', postsController.getByHashtag);
router.get('/:postId', optionalAuth, postsController.getPost);
router.put('/:postId', verifyToken, validateUpdatePost, postsController.updatePost);
router.delete('/:postId', verifyToken, postsController.deletePost);
router.post('/:postId/like', verifyToken, postsController.toggleLike);
router.post('/:postId/save', verifyToken, postsController.toggleSave);
router.post('/:postId/repost', verifyToken, postsController.toggleRepost);

module.exports = router;
