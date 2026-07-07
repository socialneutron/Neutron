const router = require('express').Router();
const postsController = require('../controllers/posts.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { validateCreatePost, validateUpdatePost } = require('../middleware/validate');

router.post('/', verifyToken, validateCreatePost, postsController.createPost);
router.get('/feed', verifyToken, postsController.getFeed);
router.get('/trending', postsController.getTrending);
router.get('/hashtag/:tag', postsController.getByHashtag);
router.get('/:id', optionalAuth, postsController.getPost);
router.put('/:id', verifyToken, validateUpdatePost, postsController.updatePost);
router.delete('/:id', verifyToken, postsController.deletePost);
router.post('/:id/like', verifyToken, postsController.toggleLike);
router.post('/:id/save', verifyToken, postsController.toggleSave);
router.post('/:id/repost', verifyToken, postsController.toggleRepost);

module.exports = router;
