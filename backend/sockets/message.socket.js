const Message = require('../models/Message.model');

module.exports = (io, socket, onlineUsers) => {
  socket.on('message:send', async ({ receiverId, message, media, encryptedEnvelope, isEncrypted }) => {
    try {
      const msgData = {
        sender: socket.userId,
        receiver: receiverId,
        message,
        media,
        delivered: false,
        read: false,
        isEncrypted: !!isEncrypted,
        encryptedEnvelope: isEncrypted ? encryptedEnvelope : undefined,
      };

      const saved = await Message.create(msgData);

      // Broadcast with encrypted envelope so recipients can decrypt client-side
      const broadcastPayload = {
        ...saved.toObject(),
        senderId: socket.userId,
        text: isEncrypted ? '' : message, // Don't send plaintext if encrypted
        encryptedEnvelope: isEncrypted ? encryptedEnvelope : undefined,
        isEncrypted: !!isEncrypted,
      };

      io.to(receiverId).emit('message:new', broadcastPayload);
      socket.emit('message:sent', { ...broadcastPayload, senderId: 'me' });
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

  // ── Public Key Exchange ──────────────────────────────
  socket.on('user:upload-key', async ({ publicKey, fingerprint }) => {
    try {
      await User.findByIdAndUpdate(socket.userId, {
        publicKey,
        fingerprint,
        keyUploadedAt: new Date(),
      });
      socket.emit('user:key-uploaded', { success: true });
    } catch (err) {
      socket.emit('error', { event: 'user:upload-key', error: err.message });
    }
  });

  socket.on('user:get-key', async ({ userId }) => {
    try {
      const user = await User.findById(userId).select('publicKey fingerprint');
      if (user && user.publicKey) {
        socket.emit('user:public-key', {
          userId,
          publicKey: user.publicKey,
          fingerprint: user.fingerprint,
        });
      } else {
        socket.emit('user:public-key', { userId, publicKey: null, fingerprint: null });
      }
    } catch (err) {
      socket.emit('error', { event: 'user:get-key', error: err.message });
    }
  });
};
