const User = require('../models/User.model');

module.exports = (io, socket, onlineUsers) => {
  socket.on('presence:check', ({ userId }) => {
    const isOnline = onlineUsers.has(userId);
    socket.emit('presence:status', { userId, isOnline });
  });

  socket.on('presence:heartbeat', async () => {
    try {
      await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
    } catch (err) {
      socket.emit('error', { event: 'presence:heartbeat', error: err.message });
    }
  });
};
