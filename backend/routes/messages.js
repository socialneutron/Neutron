const router = require('express').Router();
const messagesController = require('../controllers/messages.controller');
const { verifyToken } = require('../middleware/auth');
const { validateSendMessage } = require('../middleware/validate');
const { uploadMessageMedia } = require('../middleware/upload');

router.post('/', verifyToken, uploadMessageMedia, validateSendMessage, messagesController.sendMessage);
router.get('/conversations', verifyToken, messagesController.getConversations);
router.get('/conversation/:userId', verifyToken, messagesController.getConversation);
router.put('/:messageId/read', verifyToken, messagesController.markRead);
router.delete('/:messageId', verifyToken, messagesController.deleteMessage);

module.exports = router;
