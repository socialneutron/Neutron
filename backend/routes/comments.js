const router = require('express').Router();
const commentsController = require('../controllers/comments.controller');
const { verifyToken } = require('../middleware/auth');
const { validateCreateComment } = require('../middleware/validate');

router.get('/post/:postId', commentsController.getComments);
router.post('/post/:postId', verifyToken, validateCreateComment, commentsController.addComment);
router.delete('/:id', verifyToken, commentsController.deleteComment);
router.post('/:id/like', verifyToken, commentsController.toggleLike);

module.exports = router;
