const Message = require('../models/Mongoose');

module.exports = (io, socket, onlineUsers) => {
  socket.on('message:send', async ({ receiverId, message, media }) => {
    try {
      const saved = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        message,
        media,
        delivered: false,
        read: false,
      });

      io.to(receiverId).emit('message:new', saved);
      socket.emit('message:sent', saved);
    } catch (err) {
      socket.emit('error', { event: 'message:send', error: err.message });
    }
  });

  socket.on('message:typing', ({ receiverId }) => {
    io.to(receiverId).emit('message:typing', { senderId: socket.userId });
  });

  socket.on('message:stop-typing', ({ receiverId }) => {
    io.to(receiverId).emit('message:stop-typing', { senderId: socket.userId });
  });

  socket.on('message:delivered', async ({ messageId, receiverId }) => {
    try {
      const updated = await Message.findByIdAndUpdate(
        messageId,
        { delivered: true },
        { new: true }
      );

      io.to(receiverId).emit('message:delivered', updated);
    } catch (err) {
      socket.emit('error', { event: 'message:delivered', error: err.message });
    }
  });

  socket.on('message:read', async ({ messageIds }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { read: true, readAt: new Date() }
      );

      const messages = await Message.find({ _id: { $in: messageIds } });
      messages.forEach((msg) => {
        io.to(msg.sender).emit('message:read', msg);
      });
    } catch (err) {
      socket.emit('error', { event: 'message:read', error: err.message });
    }
  });
};
