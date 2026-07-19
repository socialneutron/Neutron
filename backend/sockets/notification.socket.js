const Notification = require('../models/Notification.model');

module.exports = (io, socket) => {
  socket.on('notification:read', async ({ notificationId }) => {
    try {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
      socket.emit('notification:read', { notificationId });
    } catch (err) {
      socket.emit('error', { event: 'notification:read', error: err.message });
    }
  });

  socket.on('notification:read-all', async () => {
    try {
      await Notification.updateMany(
        { receiver: socket.userId, read: false },
        { read: true }
      );
      socket.emit('notification:read-all');
    } catch (err) {
      socket.emit('error', { event: 'notification:read-all', error: err.message });
    }
  });
};
