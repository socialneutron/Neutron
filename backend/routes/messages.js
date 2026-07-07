const router = require('express').Router();
const messagesController = require('../controllers/messages.controller');
const { verifyToken } = require('../middleware/auth');
const { validateSendMessage } = require('../middleware/validate');

router.post('/', verifyToken, validateSendMessage, messagesController.sendMessage);
router.get('/conversations', verifyToken, messagesController.getConversations);
router.get('/conversation/:userId', verifyToken, messagesController.getConversation);
router.put('/:id/read', verifyToken, messagesController.markRead);
router.delete('/:id', verifyToken, messagesController.deleteMessage);

module.exports = router;
