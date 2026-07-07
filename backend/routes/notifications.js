const router = require('express').Router();
const notificationsController = require('../controllers/notifications.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, notificationsController.getNotifications);
router.put('/read-all', verifyToken, notificationsController.markAllRead);
router.delete('/:id', verifyToken, notificationsController.deleteNotification);

module.exports = router;
